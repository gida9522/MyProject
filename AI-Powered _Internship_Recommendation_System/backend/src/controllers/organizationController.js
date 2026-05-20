/**
 * Organization Controller
 * Manages internships, applications, and student progress
 */
const organizationModel = require('../models/organizationModel');
const internshipModel = require('../models/internshipModel');
const applicationModel = require('../models/applicationModel');
const studentModel = require('../models/studentModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const organizationController = {
    /**
     * GET /api/organization/profile
     * Get organization profile
     */
    getProfile: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        if (!organization) {
            throw new ApiError(404, 'Organization profile not found');
        }

        res.json({
            status: 'success',
            data: { organization },
        });
    }),

    /**
     * PATCH /api/organization/profile
     * Update organization profile
     */
    updateProfile: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const {
            name, description, industry, website, phone,
            address, city, country, logoUrl,
        } = req.body;

        const updated = await organizationModel.update(organization.id, {
            name,
            description,
            industry,
            website,
            phone,
            address,
            city,
            country,
            logo_url: logoUrl,
        });

        res.json({
            status: 'success',
            data: { organization: updated },
        });
    }),

    /**
     * POST /api/organization/internships
     * Create a new internship
     */
    createInternship: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const {
            title, description, requirements, responsibilities,
            durationMonths, type, location, capacity,
            deadline, startDate, endDate, minCgpa, salary, isPaid,
        } = req.body;

        const internship = await internshipModel.create({
            organizationId: organization.id,
            title,
            description,
            requirements,
            responsibilities,
            durationMonths,
            type,
            location,
            capacity,
            deadline,
            startDate,
            endDate,
            minCgpa,
            salary,
            isPaid,
        });

        res.status(201).json({
            status: 'success',
            data: { internship },
        });
    }),

    /**
     * GET /api/organization/internships
     * List organization's internships
     */
    listInternships: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { page, limit, status } = req.query;

        const result = await internshipModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            organizationId: organization.id,
            status,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/organization/internships/:id
     * Get internship details
     */
    getInternship: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { id } = req.params;

        const internship = await internshipModel.findById(id);
        if (!internship || internship.organization_id !== organization.id) {
            throw new ApiError(404, 'Internship not found');
        }

        res.json({
            status: 'success',
            data: { internship },
        });
    }),

    /**
     * PATCH /api/organization/internships/:id
     * Update internship
     */
    updateInternship: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { id } = req.params;

        const internship = await internshipModel.findById(id);
        if (!internship || internship.organization_id !== organization.id) {
            throw new ApiError(404, 'Internship not found');
        }

        const updated = await internshipModel.update(id, req.body);

        res.json({
            status: 'success',
            data: { internship: updated },
        });
    }),

    /**
     * DELETE /api/organization/internships/:id
     * Cancel internship
     */
    cancelInternship: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { id } = req.params;

        const internship = await internshipModel.findById(id);
        if (!internship || internship.organization_id !== organization.id) {
            throw new ApiError(404, 'Internship not found');
        }

        await internshipModel.cancel(id);

        res.json({
            status: 'success',
            message: 'Internship cancelled successfully',
        });
    }),

    /**
     * GET /api/organization/applications
     * List applications to organization's internships
     */
    listApplications: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { page, limit, status, internshipId } = req.query;

        const result = await applicationModel.list({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            organizationId: organization.id,
            internshipId,
            status,
        });

        res.json({
            status: 'success',
            data: result,
        });
    }),

    /**
     * GET /api/organization/applications/:id
     * Get application details
     */
    getApplication: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { id } = req.params;

        const application = await applicationModel.findById(id);
        if (!application || application.organization_id !== organization.id) {
            throw new ApiError(404, 'Application not found');
        }

        res.json({
            status: 'success',
            data: { application },
        });
    }),

    /**
     * PATCH /api/organization/applications/:id/status
     * Update application status (accept/reject)
     */
    updateApplicationStatus: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const { id } = req.params;
        const { status, feedback } = req.body;

        const application = await applicationModel.findById(id);
        if (!application || application.organization_id !== organization.id) {
            throw new ApiError(404, 'Application not found');
        }

        const updated = await applicationModel.updateStatus(id, status, feedback, req.user.id);

        // If accepted, update student status and internship filled slots
        if (status === 'accepted') {
            await studentModel.updateStatus(application.student_id, 'placed', req.user.id, 'Accepted for internship');
            await internshipModel.updateFilledSlots(application.internship_id, 1);
        }

        res.json({
            status: 'success',
            data: { application: updated },
        });
    }),

    /**
     * POST /api/organization/progress
     * Submit weekly progress report
     */
    submitProgress: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const {
            applicationId, weekNumber, startDate, endDate,
            summary, tasksCompleted, challenges, achievements, hoursWorked,
        } = req.body;

        const application = await applicationModel.findById(applicationId);
        if (!application || application.organization_id !== organization.id) {
            throw new ApiError(404, 'Application not found');
        }

        const { rows } = await require('../config/database').query(
            `INSERT INTO progress_reports 
       (application_id, week_number, start_date, end_date, summary, tasks_completed, challenges, achievements, hours_worked, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [applicationId, weekNumber, startDate, endDate, summary, tasksCompleted, challenges, achievements, hoursWorked, req.user.id]
        );

        res.status(201).json({
            status: 'success',
            data: { progress: rows[0] },
        });
    }),

    /**
     * POST /api/organization/evaluations
     * Submit final evaluation
     */
    submitEvaluation: asyncHandler(async (req, res) => {
        const organization = await organizationModel.findByUserId(req.user.id);
        const {
            applicationId, technicalSkillsGrade, communicationGrade,
            punctualityGrade, teamworkGrade, overallGrade, feedback, isPassed,
        } = req.body;

        const application = await applicationModel.findById(applicationId);
        if (!application || application.organization_id !== organization.id) {
            throw new ApiError(404, 'Application not found');
        }

        const { rows } = await require('../config/database').query(
            `INSERT INTO evaluations 
       (application_id, organization_id, student_id, technical_skills_grade, communication_grade, punctuality_grade, teamwork_grade, overall_grade, feedback, is_passed, evaluated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [applicationId, organization.id, application.student_id, technicalSkillsGrade, communicationGrade, punctualityGrade, teamworkGrade, overallGrade, feedback, isPassed, req.user.id]
        );

        // Update student status
        await studentModel.updateStatus(application.student_id, 'internship_completed', req.user.id, 'Internship completed and evaluated');

        res.status(201).json({
            status: 'success',
            data: { evaluation: rows[0] },
        });
    }),
};

module.exports = organizationController;

