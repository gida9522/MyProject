/**
 * Department model - Database operations for departments and policies
 */
const { query } = require('../config/database');

const departmentModel = {
    /**
     * Create a department
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({ universityId, name, code, description }) => {
        const { rows } = await query(
            'INSERT INTO departments (university_id, name, code, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [universityId, name, code, description]
        );
        return rows[0];
    },

    /**
     * Find department by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT d.*, u.name as university_name
       FROM departments d
       JOIN universities u ON d.university_id = u.id
       WHERE d.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * List departments by university
     * @param {string} universityId
     * @returns {Promise<Array>}
     */
    listByUniversity: async (universityId) => {
        const { rows } = await query(
            'SELECT * FROM departments WHERE university_id = $1 ORDER BY name',
            [universityId]
        );
        return rows;
    },

    /**
     * Create department policy
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    createPolicy: async ({
        departmentId,
        internshipYear,
        internshipSemester,
        internshipTiming,
        internshipDurationMonths,
        minCgpa,
        requiredCredits,
        effectiveFrom,
        effectiveUntil,
    }) => {
        const { rows } = await query(
            `INSERT INTO department_policies 
       (department_id, internship_year, internship_semester, internship_timing, internship_duration_months, min_cgpa, required_credits, effective_from, effective_until) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [departmentId, internshipYear, internshipSemester, internshipTiming, internshipDurationMonths, minCgpa, requiredCredits, effectiveFrom, effectiveUntil]
        );
        return rows[0];
    },

    /**
     * Find active policy for department
     * @param {string} departmentId
     * @returns {Promise<Object|null>}
     */
    findActivePolicy: async (departmentId) => {
        const { rows } = await query(
            `SELECT * FROM department_policies 
       WHERE department_id = $1 AND is_active = true 
       AND effective_from <= CURRENT_DATE 
       AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
       ORDER BY created_at DESC LIMIT 1`,
            [departmentId]
        );
        return rows[0] || null;
    },

    /**
     * Update policy
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    updatePolicy: async (id, data) => {
        const fields = Object.keys(data)
            .filter((key) => data[key] !== undefined)
            .map((key, index) => {
                const snakeCase = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                return `${snakeCase} = $${index + 2}`;
            });

        const values = Object.values(data).filter((v) => v !== undefined);

        const { rows } = await query(
            `UPDATE department_policies SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return rows[0];
    },
};

module.exports = departmentModel;

