/**
 * User model - Database operations for users table
 */
const { query } = require('../config/database');

const userModel = {
    /**
     * Find user by email
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    findByEmail: async (email) => {
        const { rows } = await query(
            'SELECT id, email, password_hash, role, is_active, email_verified FROM users WHERE email = $1',
            [email]
        );
        return rows[0] || null;
    },

    /**
     * Find user by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            'SELECT id, email, role, is_active, email_verified, created_at FROM users WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Create a new user
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    create: async ({ email, password_hash, role, is_active = false }) => {
        const { rows } = await query(
            'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, role, is_active, created_at',
            [email, password_hash, role, is_active]
        );
        return rows[0];
    },

    /**
     * Activate user account
     * @param {string} id
     * @returns {Promise<Object>}
     */
    activate: async (id) => {
        const { rows } = await query(
            'UPDATE users SET is_active = true, email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, is_active',
            [id]
        );
        return rows[0];
    },

    /**
     * Update last login
     * @param {string} id
     * @returns {Promise<void>}
     */
    updateLastLogin: async (id) => {
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
    },

    /**
     * Update password
     * @param {string} id
     * @param {string} passwordHash
     * @returns {Promise<Object>}
     */
    updatePassword: async (id, passwordHash) => {
        const { rows } = await query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
            [passwordHash, id]
        );
        return rows[0];
    },

    /**
     * Delete user
     * @param {string} id
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        await query('DELETE FROM users WHERE id = $1', [id]);
    },

    /**
     * List all users with pagination
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    list: async ({ page = 1, limit = 10, role, search }) => {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            conditions.push(`role = $${paramCount}`);
            values.push(role);
        }

        if (search) {
            paramCount++;
            conditions.push(`email ILIKE $${paramCount}`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            values
        );

        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT id, email, role, is_active, email_verified, last_login, created_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            users: rows,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    },
};

module.exports = userModel;

