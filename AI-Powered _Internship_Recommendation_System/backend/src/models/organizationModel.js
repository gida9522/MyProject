/**
 * Organization model - Database operations for organizations
 */
const { query } = require('../config/database');

const organizationModel = {
    /**
     * Create an organization with a user account
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({
        userId,
        name,
        description,
        industry,
        website,
        email,
        phone,
        address,
        city,
        country,
        registrationNumber,
        taxId,
    }) => {
        const { rows } = await query(
            `INSERT INTO organizations (user_id, name, description, industry, website, email, phone, address, city, country, registration_number, tax_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending') 
       RETURNING *`,
            [userId, name, description, industry, website, email, phone, address, city, country, registrationNumber, taxId]
        );
        return rows[0];
    },

    /**
     * Find organization by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT o.*, usr.email, usr.is_active 
       FROM organizations o
       JOIN users usr ON o.user_id = usr.id
       WHERE o.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Find organization by user ID
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    findByUserId: async (userId) => {
        const { rows } = await query(
            `SELECT o.*, usr.email, usr.is_active 
       FROM organizations o
       JOIN users usr ON o.user_id = usr.id
       WHERE o.user_id = $1`,
            [userId]
        );
        return rows[0] || null;
    },

    /**
     * Update organization status
     * @param {string} id
     * @param {string} status
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    updateStatus: async (id, status, reason = null) => {
        const result = await query(
            `UPDATE organizations 
         SET status = $1, 
             rejection_reason = $2, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING user_id`,
            [status, reason, id]
        );

        const userId = result.rows[0]?.user_id;

        if (status === 'approved' && userId) {
            await query(
                `UPDATE users 
             SET is_active = true 
             WHERE id = $1`,
                [userId]
            );
        }

        return result.rows[0];
    },

    /**
     * List all organizations with filters
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
            conditions.push(`o.status = $${paramCount}`);
            values.push(status);
        }

        if (search) {
            paramCount++;
            conditions.push(`o.name ILIKE $${paramCount}`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM organizations o ${whereClause}`,
            values
        );
        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT o.*, usr.email, usr.is_active
       FROM organizations o
       JOIN users usr ON o.user_id = usr.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            organizations: rows,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    },

    /**
     * Update organization details
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
            `UPDATE organizations SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return rows[0];
    },
};

module.exports = organizationModel;

