/**
 * University model - Database operations for universities
 */
const { query, getClient } = require('../config/database');

const universityModel = {
    /**
     * Create a university with a user account
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({ userId, name, code, address, city, country, phone, website }) => {
        const { rows } = await query(
            `INSERT INTO universities (user_id, name, code, address, city, country, phone, website, accreditation_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') 
       RETURNING *`,
            [userId, name, code, address, city, country, phone, website]
        );
        return rows[0];
    },

    /**
     * Find university by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT u.*, usr.email, usr.is_active 
       FROM universities u
       JOIN users usr ON u.user_id = usr.id
       WHERE u.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Find university by user ID
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    findByUserId: async (userId) => {
        const { rows } = await query(
            `SELECT u.*, usr.email, usr.is_active 
       FROM universities u
       JOIN users usr ON u.user_id = usr.id
       WHERE u.user_id = $1`,
            [userId]
        );
        return rows[0] || null;
    },

    /**
     * Update university status (approve/reject)
     * @param {string} id
     * @param {string} status
     * @param {string} reason
     * @param {string} approvedBy
     * @returns {Promise<Object>}
     */
    updateStatus: async (id, status, reason = null, approvedBy = null) => {

        const isApproved = status === 'approved';
        const rejectionReason = status === 'rejected' ? reason : null;

        const { rows } = await query(
            `UPDATE universities
         SET accreditation_status = CAST($2 AS VARCHAR),
             rejection_reason = $3,
             approval_date = CASE
                 WHEN $4 THEN CURRENT_TIMESTAMP
                 ELSE NULL
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
            [id, status, rejectionReason, isApproved]
        );

        if (approvedBy && isApproved) {
            await query(
                `UPDATE users
             SET is_active = true
             WHERE id = (
                 SELECT user_id
                 FROM universities
                 WHERE id = $1
             )`,
                [id]
            );
        }

        return rows[0];
    },

    /**
     * List all universities with filters
     * @param {Object} filters
     * @returns {Promise<Object>}
     */
    list: async ({ page = 1, limit = 10, status, search }) => {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`u.accreditation_status = $${paramCount}`);
            values.push(status);
        }

        if (search) {
            paramCount++;
            conditions.push(`u.name ILIKE $${paramCount}`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM universities u ${whereClause}`,
            values
        );
        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT u.*, usr.email, usr.is_active
       FROM universities u
       JOIN users usr ON u.user_id = usr.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            universities: rows,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    },

    /**
     * Update university details
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        const fields = Object.keys(data)
            .filter((key) => data[key] !== undefined)
            .map((key, index) => `${key} = $${index + 2}`);

        const values = Object.values(data).filter((v) => v !== undefined);

        const { rows } = await query(
            `UPDATE universities SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return rows[0];
    },
};

module.exports = universityModel;

