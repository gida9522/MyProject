/**
 * Student Controller
 * Profile management, internship browsing, applications, recommendations
 */
const studentModel = require('../models/studentModel');
const internshipModel = require('../models/internshipModel');
const applicationModel = require('../models/applicationModel');
const departmentModel = require('../models/departmentModel');
const eligibilityService = require('../services/eligibilityService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const studentController = {
    /**
     * GET /api/student/profile
     * Get student profile
     */
    getProfile: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        if (!student) {
            throw new ApiError(404, 'Student profile not found');
        }

        res.json({
            status: 'success',
            data: { student },
        });
    }),

    /**
     * PATCH /api/student/profile
     * Update student profile
     */
    updateProfile: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const {
            firstName, lastName, phone, bio, locationPreference,
            resumeUrl, profilePictureUrl,
        } = req.body;

        const updated = await studentModel.update(student.id, {
            first_name: firstName,
            last_name: lastName,
            phone,
            bio,
            location_preference: locationPreference,
            resume_url: resumeUrl,
            profile_picture_url: profilePictureUrl,
        });

        res.json({
            status: 'success',
            data: { student: updated },
        });
    }),

    /**
     * GET /api/student/eligibility
     * Check internship eligibility
     */
    checkEligibility: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const result = await eligibilityService.checkEligibility(student.id);

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * POST /api/student/skills
     * Add skill to profile
     */
    addSkill: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const { skillId, proficiencyLevel } = req.body;

        const { rows } = await require('../config/database').query(
            `INSERT INTO student_skills (student_id, skill_id, proficiency_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, skill_id) DO UPDATE SET proficiency_level = $3
       RETURNING *`,
            [student.id, skillId, proficiencyLevel]
        );

        res.status(201).json({
            status: 'success',
            data: { skill: rows[0] },
        });
    }),

    /**
     * GET /api/student/skills
     * List student skills
     */
    listSkills: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);

        const { rows } = await require('../config/database').query(
            `SELECT s.id, s.name, s.category, ss.proficiency_level
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = $1`,
            [student.id]
        );

        res.json({
            status: 'success',
            data: { skills: rows },
        });
    }),

    /**
     * POST /api/student/projects
     * Add project
     */
    addProject: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const {
            title, description, technologies, projectUrl,
            githubUrl, startDate, endDate, isOngoing,
        } = req.body;

        const { rows } = await require('../config/database').query(
            `INSERT INTO projects (student_id, title, description, technologies, project_url, github_url, start_date, end_date, is_ongoing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [student.id, title, description, technologies, projectUrl, githubUrl, startDate, endDate, isOngoing]
        );

        res.status(201).json({
            status: 'success',
            data: { project: rows[0] },
        });
    }),

    /**
     * GET /api/student/projects
     * List projects
     */
    listProjects: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);

        const { rows } = await require('../config/database').query(
            'SELECT * FROM projects WHERE student_id = $1 ORDER BY created_at DESC',
            [student.id]
        );

        res.json({
            status: 'success',
            data: { projects: rows },
        });
    }),

    /**
     * POST /api/student/documents
     * Upload document reference
     */
    addDocument: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const { name, documentType, fileUrl, fileSize, mimeType } = req.body;

        const { rows } = await require('../config/database').query(
            `INSERT INTO documents (student_id, name, document_type, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [student.id, name, documentType, fileUrl, fileSize, mimeType]
        );

        res.status(201).json({
            status: 'success',
            data: { document: rows[0] },
        });
    }),

    /**
     * GET /api/student/documents
     * List documents
     */
    listDocuments: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);

        const { rows } = await require('../config/database').query(
            'SELECT * FROM documents WHERE student_id = $1 ORDER BY uploaded_at DESC',
            [student.id]
        );

        res.json({
            status: 'success',
            data: { documents: rows },
        });
    }),

    /**
     * GET /api/student/internships
     * Browse available internships
     */
    listInternships: asyncHandler(async (req, res) => {
        const { page, limit, type, search } = req.query;

        const result = await internshipModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status: 'active',
            type,
            search,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/student/internships/:id
     * Get internship details
     */
    getInternship: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const internship = await internshipModel.findById(id);

        if (!internship) {
            throw new ApiError(404, 'Internship not found');
        }

        res.json({
            status: 'success',
            data: { internship },
        });
    }),

    /**
     * GET /api/student/recommendations
     * Get recommended internships (basic scoring)
     */
    getRecommendations: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const { page = 1, limit = 10 } = req.query;

        // Get student skills
        const { rows: studentSkills } = await require('../config/database').query(
            'SELECT skill_id, proficiency_level FROM student_skills WHERE student_id = $1',
            [student.id]
        );

        const skillIds = studentSkills.map((s) => s.skill_id);

        // Get active internships with basic scoring
        const { rows: internships } = await require('../config/database').query(
            `SELECT i.*, o.name as organization_name,
        CASE
          WHEN i.min_cgpa <= $1 THEN 25
          ELSE 0
        END as cgpa_score,
        CASE
          WHEN i.location ILIKE $2 THEN 20
          ELSE 10
        END as location_score,
        CASE
          WHEN array_length(i.required_skills, 1) IS NULL OR array_length(i.required_skills, 1) = 0 THEN 25
          WHEN i.required_skills && $3 THEN 25
          ELSE 5
        END as skill_score,
        CASE
          WHEN i.duration_months BETWEEN 2 AND 6 THEN 20
          ELSE 10
        END as duration_score
      FROM internships i
      JOIN organizations o ON i.organization_id = o.id
      WHERE i.status = 'active' AND i.deadline >= CURRENT_DATE
        AND i.filled_slots < i.capacity
        AND NOT EXISTS (
          SELECT 1 FROM applications a
          WHERE a.student_id = $4 AND a.internship_id = i.id
        )
      ORDER BY (cgpa_score + location_score + skill_score + duration_score) DESC
      LIMIT $5 OFFSET $6`,
            [
                student.cgpa || 0,
                `%${student.location_preference || ''}%`,
                skillIds,
                student.id,
                parseInt(limit),
                (parseInt(page) - 1) * parseInt(limit),
            ]
        );

        // Calculate total scores
        const scoredInternships = internships.map((i) => ({
            ...i,
            total_score: i.cgpa_score + i.location_score + i.skill_score + i.duration_score,
        }));

        res.json({
            status: 'success',
            data: {
                internships: scoredInternships,
                pagination: { page: parseInt(page), limit: parseInt(limit) },
            },
        });
    }),

    /**
     * POST /api/student/applications
     * Apply to an internship
     */
    apply: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const { internshipId, coverLetter, resumeUrl } = req.body;

        // Check eligibility
        const eligibility = await eligibilityService.checkEligibility(student.id);
        if (!eligibility.eligible) {
            throw new ApiError(403, `Not eligible: ${eligibility.reason}`);
        }

        // Check if already applied
        const existing = await applicationModel.findByStudentAndInternship(student.id, internshipId);
        if (existing) {
            throw new ApiError(409, 'Already applied to this internship');
        }

        // Check internship capacity
        const internship = await internshipModel.findById(internshipId);
        if (!internship || internship.status !== 'active') {
            throw new ApiError(404, 'Internship not found or not active');
        }
        if (internship.filled_slots >= internship.capacity) {
            throw new ApiError(400, 'Internship capacity is full');
        }
        if (new Date(internship.deadline) < new Date()) {
            throw new ApiError(400, 'Application deadline has passed');
        }

        // Calculate match score
        const { rows: studentSkills } = await require('../config/database').query(
            'SELECT skill_id FROM student_skills WHERE student_id = $1',
            [student.id]
        );
        const skillIds = studentSkills.map((s) => s.skill_id);
        let matchScore = 0;
        if (internship.required_skills && internship.required_skills.length > 0) {
            const matchCount = internship.required_skills.filter((s) => skillIds.includes(s)).length;
            matchScore = (matchCount / internship.required_skills.length) * 100;
        } else {
            matchScore = 50; // Default if no skills required
        }

        const application = await applicationModel.create({
            studentId: student.id,
            internshipId,
            coverLetter,
            resumeUrl,
            matchScore,
        });

        // Update student status
        await studentModel.updateStatus(student.id, 'applied', req.user.id, 'Applied to internship');

        res.status(201).json({
            status: 'success',
            message: 'Application submitted successfully',
            data: { application },
        });
    }),

    /**
     * GET /api/student/applications
     * List my applications
     */
    listApplications: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);
        const { page, limit, status } = req.query;

        const result = await applicationModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            studentId: student.id,
            status,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/student/progress
     * View progress reports
     */
    listProgress: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);

        const { rows } = await require('../config/database').query(
            `SELECT pr.*, i.title as internship_title
       FROM progress_reports pr
       JOIN applications a ON pr.application_id = a.id
       JOIN internships i ON a.internship_id = i.id
       WHERE a.student_id = $1
       ORDER BY pr.week_number`,
            [student.id]
        );

        res.json({
            status: 'success',
            data: { progress: rows },
        });
    }),

    /**
     * GET /api/student/evaluations
     * View evaluations
     */
    listEvaluations: asyncHandler(async (req, res) => {
        const student = await studentModel.findByUserId(req.user.id);

        const { rows } = await require('../config/database').query(
            `SELECT e.*, i.title as internship_title, o.name as organization_name
       FROM evaluations e
       JOIN applications a ON e.application_id = a.id
       JOIN internships i ON a.internship_id = i.id
       JOIN organizations o ON i.organization_id = o.id
       WHERE e.student_id = $1
       ORDER BY e.evaluated_at DESC`,
            [student.id]
        );

        res.json({
            status: 'success',
            data: { evaluations: rows },
        });
    }),
};

module.exports = studentController;

