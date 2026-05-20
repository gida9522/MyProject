/**
 * Application model - Database operations for internship applications
 */
const { query, getClient } = require('../config/database');

const applicationModel = {
    /**
     * Create an application
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({ studentId, internshipId, coverLetter, resumeUrl, matchScore }) => {
        const { rows } = await query(
            `INSERT INTO applications (student_id, internship_id, cover_letter, resume_url, match_score, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING *`,
            [studentId, internshipId, coverLetter, resumeUrl, matchScore]
        );
        return rows[0];
    },

    /**
     * Find application by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT a.*, s.first_name, s.last_name, s.student_id, s.cgpa, s.status as student_status,
              i.title as internship_title, i.organization_id, i.capacity, i.filled_slots,
              o.name as organization_name
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN internships i ON a.internship_id = i.id
       JOIN organizations o ON i.organization_id = o.id
       WHERE a.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Check if student already applied to internship
     * @param {string} studentId
     * @param {string} internshipId
     * @returns {Promise<Object|null>}
     */
    findByStudentAndInternship: async (studentId, internshipId) => {
        const { rows } = await query(
            'SELECT * FROM applications WHERE student_id = $1 AND internship_id = $2',
            [studentId, internshipId]
        );
        return rows[0] || null;
    },

    /**
     * Update application status
     * @param {string} id
     * @param {string} status
     * @param {string} feedback
     * @param {string} reviewedBy
     * @returns {Promise<Object>}
     */
    updateStatus: async (id, status, feedback = null, reviewedBy = null) => {
        const { rows } = await query(
            `UPDATE applications 
       SET status = $1, feedback = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
            [status, feedback, reviewedBy, id]
        );
        return rows[0];
    },

    /**
     * List applications with filters
     * @param {Object} filters
     * @returns {Promise<Object>}
     */
    list: async ({ page = 1, limit = 10, studentId, internshipId, organizationId, status }) => {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (studentId) {
            paramCount++;
            conditions.push(`a.student_id = $${paramCount}`);
            values.push(studentId);
        }

        if (internshipId) {
            paramCount++;
            conditions.push(`a.internship_id = $${paramCount}`);
            values.push(internshipId);
        }

        if (organizationId) {
            paramCount++;
            conditions.push(`i.organization_id = $${paramCount}`);
            values.push(organizationId);
        }

        if (status) {
            paramCount++;
            conditions.push(`a.status = $${paramCount}`);
            values.push(status);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM applications a JOIN internships i ON a.internship_id = i.id ${whereClause}`,
            values
        );
        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT a.*, s.first_name, s.last_name, s.student_id, s.cgpa,
              i.title as internship_title, i.duration_months, i.type, i.location,
              o.name as organization_name
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN internships i ON a.internship_id = i.id
       JOIN organizations o ON i.organization_id = o.id
       ${whereClause}
       ORDER BY a.applied_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            applications: rows,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    },

    /**
     * Get application counts by status for a student
     * @param {string} studentId
     * @returns {Promise<Object>}
     */
    getCountsByStudent: async (studentId) => {
        const { rows } = await query(
            `SELECT status, COUNT(*) as count FROM applications WHERE student_id = $1 GROUP BY status`,
            [studentId]
        );
        return rows;
    },

    /**
     * Withdraw application
     * @param {string} id
     * @returns {Promise<Object>}
     */
    withdraw: async (id) => {
        const { rows } = await query(
            `UPDATE applications SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0];
    },
};

module.exports = applicationModel;

