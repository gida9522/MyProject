/**
 * University Controller
 * Manages students, departments, policies, and monitors internships
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
const departmentModel = require('../models/departmentModel');
const universityModel = require('../models/universityModel');
const organizationModel = require('../models/organizationModel');
const emailService = require('../services/emailService');
const eligibilityService = require('../services/eligibilityService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');

const universityController = {
    /**
     * GET /api/university/profile
     * Get university profile
     */
    getProfile: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        if (!university) {
            throw new ApiError(404, 'University profile not found');
        }

        res.json({
            status: 'success',
            data: { university },
        });
    }),

    /**
     * POST /api/university/departments
     * Create a department
     */
    createDepartment: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { name, code, description } = req.body;

        const department = await departmentModel.create({
            universityId: university.id,
            name,
            code,
            description,
        });

        res.status(201).json({
            status: 'success',
            data: { department },
        });
    }),

    /**
     * GET /api/university/organizations
     * View organizations (filter by status)
     */
    listOrganizations: asyncHandler(async (req, res) => {
        const { status } = req.query;

        let query = `SELECT * FROM organizations`;
        const params = [];

        if (status === 'pending') {
            query += ` WHERE is_approved = false`;
        } else if (status === 'approved') {
            query += ` WHERE is_approved = true`;
        }

        const result = await db.query(query, params);

        res.json({
            status: 'success',
            data: { organizations: result.rows }
        });
    }),

    /**
     * POST /api/university/departments/:id/policy
     * Create department internship policy
     */
    createPolicy: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const {
            internshipYear, internshipSemester, internshipTiming,
            internshipDurationMonths, minCgpa, requiredCredits,
            effectiveFrom, effectiveUntil,
        } = req.body;

        const university = await universityModel.findByUserId(req.user.id);
        const department = await departmentModel.findById(id);

        if (!department || department.university_id !== university.id) {
            throw new ApiError(404, 'Department not found');
        }

        const policy = await departmentModel.createPolicy({
            departmentId: id,
            internshipYear,
            internshipSemester,
            internshipTiming,
            internshipDurationMonths,
            minCgpa,
            requiredCredits,
            effectiveFrom,
            effectiveUntil,
        });

        res.status(201).json({
            status: 'success',
            data: { policy },
        });
    }),

    /**
     * POST /api/university/students
     * Create a single student
     */
    createStudent: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const {
            email, studentId, firstName, lastName, departmentId,
            enrollmentYear, currentYear, currentSemester,
            phone, dateOfBirth, cgpa, totalCredits,
        } = req.body;

        const existing = await userModel.findByEmail(email);
        if (existing) {
            throw new ApiError(409, 'Email already registered');
        }

        const department = await departmentModel.findById(departmentId);
        if (!department || department.university_id !== university.id) {
            throw new ApiError(404, 'Department not found in this university');
        }

        const tempPassword = await bcrypt.hash(uuidv4(), 12);
        const user = await userModel.create({
            email,
            password_hash: tempPassword,
            role: 'STUDENT',
            isActive: false,
        });

        const student = await studentModel.create({
            userId: user.id,
            universityId: university.id,
            departmentId,
            studentId,
            firstName,
            lastName,
            phone,
            dateOfBirth,
            enrollmentYear,
            currentYear,
            currentSemester,
            cgpa,
            totalCredits,
        });

        await emailService.sendStudentActivationEmail(email, firstName, student.activation_token);
        await eligibilityService.evaluateAndUpdate(student.id, req.user.id);

        res.status(201).json({
            status: 'success',
            message: 'Student created successfully. Activation email sent.',
            data: { student },
        });
    }),

    /**
     * POST /api/university/students/bulk
     * Bulk create students via CSV
     */
    createStudentsBulk: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            throw new ApiError(400, 'Students array is required');
        }

        const results = { created: [], failed: [] };

        for (const studentData of students) {
            try {
                const existing = await userModel.findByEmail(studentData.email);
                if (existing) {
                    results.failed.push({ email: studentData.email, reason: 'Email already exists' });
                    continue;
                }

                const department = await departmentModel.findById(studentData.departmentId);
                if (!department || department.university_id !== university.id) {
                    results.failed.push({ email: studentData.email, reason: 'Invalid department' });
                    continue;
                }

                const tempPassword = await bcrypt.hash(uuidv4(), 12);
                const user = await userModel.create({
                    email: studentData.email,
                    passwordHash: tempPassword,
                    role: 'STUDENT',
                    isActive: false,
                });

                const student = await studentModel.create({
                    userId: user.id,
                    universityId: university.id,
                    departmentId: studentData.departmentId,
                    studentId: studentData.studentId,
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    phone: studentData.phone || null,
                    dateOfBirth: studentData.dateOfBirth || null,
                    enrollmentYear: studentData.enrollmentYear,
                    currentYear: studentData.currentYear,
                    currentSemester: studentData.currentSemester || null,
                    cgpa: studentData.cgpa || 0,
                    totalCredits: studentData.totalCredits || 0,
                });

                await emailService.sendActivationEmail(studentData.email, student.activation_token, studentData.firstName);
                await eligibilityService.evaluateAndUpdate(student.id, req.user.id);

                results.created.push({ email: studentData.email, studentId: student.id });
            } catch (error) {
                results.failed.push({ email: studentData.email, reason: error.message });
            }
        }

        res.status(201).json({
            status: 'success',
            data: results,
        });
    }),

    /**
     * GET /api/university/students
     */
    listStudents: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { page, limit, departmentId, status, search } = req.query;

        const result = await studentModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            universityId: university.id,
            departmentId,
            status,
            search,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/university/students/:id
     */
    getStudent: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { id } = req.params;

        const student = await studentModel.findById(id);
        if (!student || student.university_id !== university.id) {
            throw new ApiError(404, 'Student not found');
        }

        res.json({
            status: 'success',
            data: { student },
        });
    }),

    /**
     * PATCH /api/university/students/:id/status
     */
    updateStudentStatus: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { id } = req.params;
        const { status, reason } = req.body;

        const student = await studentModel.findById(id);
        if (!student || student.university_id !== university.id) {
            throw new ApiError(404, 'Student not found');
        }

        const result = await studentModel.updateStatus(id, status, req.user.id, reason);

        res.json({
            status: 'success',
            data: { result },
        });
    }),

    /**
     * GET /api/university/applications
     */
    listApplications: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);
        const { page, limit, status } = req.query;

        const { rows } = await require('../config/database').query(`
      SELECT a.*, s.first_name, s.last_name, s.student_id,
             i.title as internship_title, o.name as organization_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN internships i ON a.internship_id = i.id
      JOIN organizations o ON i.organization_id = o.id
      WHERE s.university_id = $1
      ${status ? 'AND a.status = $2' : ''}
      ORDER BY a.applied_at DESC
      LIMIT $${status ? 3 : 2} OFFSET $${status ? 4 : 3}
    `, status
            ? [university.id, status, parseInt(limit) || 10, ((parseInt(page) || 1) - 1) * (parseInt(limit) || 10)]
            : [university.id, parseInt(limit) || 10, ((parseInt(page) || 1) - 1) * (parseInt(limit) || 10)]
        );

        res.json({
            status: 'success',
            data: { applications: rows },
        });
    }),

    listDepartments: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);

        const departments = await departmentModel.listByUniversity(university.id);

        res.json({
            status: 'success',
            data: { departments },
        });
    }),

    /**
     * GET /api/university/analytics
     */
    getAnalytics: asyncHandler(async (req, res) => {
        const university = await universityModel.findByUserId(req.user.id);

        const { rows: statusCounts } = await require('../config/database').query(`
      SELECT status, COUNT(*) as count
      FROM students
      WHERE university_id = $1
      GROUP BY status
    `, [university.id]);

        const { rows: departmentCounts } = await require('../config/database').query(`
      SELECT d.name, COUNT(s.id) as student_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id AND s.university_id = $1
      WHERE d.university_id = $1
      GROUP BY d.id, d.name
    `, [university.id]);

        const { rows: placementStats } = await require('../config/database').query(`
      SELECT 
        COUNT(CASE WHEN s.status IN ('placed', 'in_internship', 'internship_completed') THEN 1 END) as placed_count,
        COUNT(*) as total_students
      FROM students s
      WHERE s.university_id = $1
    `, [university.id]);

        res.json({
            status: 'success',
            data: {
                statusCounts,
                departmentCounts,
                placementStats: placementStats[0],
            },
        });
    }),
};

module.exports = universityController;