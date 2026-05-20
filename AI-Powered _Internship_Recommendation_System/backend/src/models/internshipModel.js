/**
 * Internship model - Database operations for internships
 */
const { query } = require('../config/database');

const internshipModel = {
    /**
     * Create an internship
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({
        organizationId,
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
    }) => {
        const { rows } = await query(
            `INSERT INTO internships 
       (organization_id, title, description, requirements, responsibilities, duration_months, type, location, capacity, deadline, start_date, end_date, min_cgpa, salary, is_paid, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active') 
       RETURNING *`,
            [organizationId, title, description, requirements, responsibilities, durationMonths, type, location, capacity, deadline, startDate, endDate, minCgpa, salary, isPaid]
        );
        return rows[0];
    },

    /**
     * Find internship by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT i.*, o.name as organization_name, o.email as organization_email, o.city
       FROM internships i
       JOIN organizations o ON i.organization_id = o.id
       WHERE i.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Update internship filled slots count
     * @param {string} id
     * @param {number} delta
     * @returns {Promise<Object>}
     */
    updateFilledSlots: async (id, delta) => {
        const { rows } = await query(
            `UPDATE internships SET filled_slots = filled_slots + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [delta, id]
        );
        return rows[0];
    },

    /**
     * List internships with filters
     * @param {Object} filters
     * @returns {Promise<Object>}
     */
    list: async ({ page = 1, limit = 10, status = 'active', organizationId, search, type }) => {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`i.status = $${paramCount}`);
            values.push(status);
        }

        if (organizationId) {
            paramCount++;
            conditions.push(`i.organization_id = $${paramCount}`);
            values.push(organizationId);
        }

        if (type) {
            paramCount++;
            conditions.push(`i.type = $${paramCount}`);
            values.push(type);
        }

        if (search) {
            paramCount++;
            conditions.push(`i.title ILIKE $${paramCount}`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM internships i ${whereClause}`,
            values
        );
        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT i.*, o.name as organization_name, o.city
       FROM internships i
       JOIN organizations o ON i.organization_id = o.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            internships: rows,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    },

    /**
     * Update internship
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
        const fields = Object.keys(data)
            .filter((key) => data[key] !== undefined)
            .map((key, index) => {
                const snakeCase = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                return `${snakeCase} = $${index + 2}`;
            });

        const values = Object.values(data).filter((v) => v !== undefined);

        const { rows } = await query(
            `UPDATE internships SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return rows[0];
    },

    /**
     * Delete (soft via status) or cancel internship
     * @param {string} id
     * @returns {Promise<Object>}
     */
    cancel: async (id) => {
        const { rows } = await query(
            `UPDATE internships SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0];
    },
};

module.exports = internshipModel;

