/**
 * Super Admin Controller
 * National-level oversight: university management, analytics
 */
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const universityModel = require('../models/universityModel');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Allowed status values (centralized)
 */
const STATUS = Object.freeze({
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
});

const superAdminController = {
    /**
     * POST /api/super-admin/universities
     * Register a new university (Super Admin only)
     */
    createUniversity: asyncHandler(async (req, res) => {
        const {
            email, password, name, code, address, city, country, phone, website,
        } = req.body;

        const existing = await userModel.findByEmail(email);
        if (existing) {
            throw new ApiError(409, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await userModel.create({
            email,
            password_hash: passwordHash,
            role: 'UNIVERSITY',
            isActive: true,
        });

        const university = await universityModel.create({
            userId: user.id,
            name,
            code,
            address,
            city,
            country,
            phone,
            website,
        });

        res.status(201).json({
            status: 'success',
            data: { university },
        });
    }),

    /**
     * GET /api/super-admin/universities
     */
    listUniversities: asyncHandler(async (req, res) => {
        const { page, limit, status, search } = req.query;

        const result = await universityModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status,
            search,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/super-admin/universities/:id
     */
    getUniversity: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const university = await universityModel.findById(id);

        if (!university) {
            throw new ApiError(404, 'University not found');
        }

        res.json({
            status: 'success',
            data: { university },
        });
    }),

    /**
     * PATCH /api/super-admin/universities/:id/status
     */
    updateUniversityStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, reason } = req.body;

        const normalizedStatus = status?.toLowerCase();

        if (!Object.values(STATUS).includes(normalizedStatus)) {
            throw new ApiError(400, 'Invalid status value');
        }

        const university = await universityModel.updateStatus(
            id,
            normalizedStatus,
            reason,
            req.user.id
        );

        res.json({
            status: 'success',
            message: `University ${normalizedStatus} successfully`,
            data: { university },
        });
    }),

    /**
     * GET /api/super-admin/analytics
     */
    getAnalytics: asyncHandler(async (req, res) => {
        const studentsPerUniversity = await query(`
            SELECT u.id, u.name, COUNT(s.id) as student_count
            FROM universities u
            LEFT JOIN students s ON s.university_id = u.id
            GROUP BY u.id, u.name
            ORDER BY student_count DESC
        `);

        const studentsPerDepartment = await query(`
            SELECT d.name, COUNT(s.id) as student_count
            FROM departments d
            LEFT JOIN students s ON s.department_id = d.id
            GROUP BY d.name
            ORDER BY student_count DESC
        `);

        const statusPipeline = await query(`
            SELECT status, COUNT(*) as count
            FROM students
            GROUP BY status
            ORDER BY count DESC
        `);

        const internshipStats = await query(`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
            FROM applications
        `);

        const graduationPipeline = await query(`
            SELECT 
                COUNT(CASE WHEN status = 'internship_completed' THEN 1 END) as completed_internship,
                COUNT(CASE WHEN status = 'final_year' THEN 1 END) as final_year,
                COUNT(CASE WHEN status = 'graduated' THEN 1 END) as graduated
            FROM students
        `);

        res.json({
            status: 'success',
            data: {
                studentsPerUniversity: studentsPerUniversity.rows,
                studentsPerDepartment: studentsPerDepartment.rows,
                statusPipeline: statusPipeline.rows,
                internshipStats: internshipStats.rows[0],
                graduationPipeline: graduationPipeline.rows[0],
            },
        });
    }),

    /**
     * GET /api/super-admin/organizations
     */
    listOrganizations: asyncHandler(async (req, res) => {
        const organizationModel = require('../models/organizationModel');
        const { page, limit, status, search } = req.query;

        const result = await organizationModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status,
            search,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * PATCH /api/super-admin/organizations/:id/status
     */
    updateOrganizationStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, reason } = req.body;

        const organizationModel = require('../models/organizationModel');

        const normalizedStatus = status?.toLowerCase();

        if (!Object.values(STATUS).includes(normalizedStatus)) {
            throw new ApiError(400, 'Invalid status value');
        }

        const organization = await organizationModel.updateStatus(
            id,
            normalizedStatus,
            reason
        );

        res.json({
            status: 'success',
            message: `Organization ${normalizedStatus} successfully`,
            data: { organization },
        });
    }),
};

module.exports = superAdminController;