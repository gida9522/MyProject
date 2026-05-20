/**
 * Student model - Database operations for students
 */
const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const studentModel = {
    /**
     * Create a student (always linked to a university-created user)
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async ({
        userId,
        universityId,
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
        status = 'not_eligible',
    }) => {
        const activationToken = uuidv4();
        const activationExpires = new Date();
        activationExpires.setDate(activationExpires.getDate() + 7);

        const { rows } = await query(
            `INSERT INTO students 
       (user_id, university_id, department_id, student_id, first_name, last_name, phone, date_of_birth, enrollment_year, current_year, current_semester, cgpa, total_credits, status, activation_token, activation_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
            [userId, universityId, departmentId, studentId, firstName, lastName, phone, dateOfBirth, enrollmentYear, currentYear, currentSemester, cgpa, totalCredits, status, activationToken, activationExpires]
        );
        return rows[0];
    },

    /**
     * Create multiple students in a transaction (CSV import)
     * @param {Array<Object>} students
     * @returns {Promise<Array<Object>>}
     */
    createMany: async (students) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            const createdStudents = [];

            for (const student of students) {
                const activationToken = uuidv4();
                const activationExpires = new Date();
                activationExpires.setDate(activationExpires.getDate() + 7);

                const { rows } = await client.query(
                    `INSERT INTO students 
           (user_id, university_id, department_id, student_id, first_name, last_name, phone, date_of_birth, enrollment_year, current_year, current_semester, cgpa, total_credits, status, activation_token, activation_expires)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING *`,
                    [
                        student.userId,
                        student.universityId,
                        student.departmentId,
                        student.studentId,
                        student.firstName,
                        student.lastName,
                        student.phone || null,
                        student.dateOfBirth || null,
                        student.enrollmentYear,
                        student.currentYear,
                        student.currentSemester || null,
                        student.cgpa || 0.00,
                        student.totalCredits || 0,
                        student.status || 'not_eligible',
                        activationToken,
                        activationExpires,
                    ]
                );
                createdStudents.push(rows[0]);
            }

            await client.query('COMMIT');
            return createdStudents;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Find student by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    findById: async (id) => {
        const { rows } = await query(
            `SELECT s.*, u.email, dep.name as department_name, dep.code as department_code, uni.name as university_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments dep ON s.department_id = dep.id
       JOIN universities uni ON s.university_id = uni.id
       WHERE s.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Find student by user ID
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    findByUserId: async (userId) => {
        const { rows } = await query(
            `SELECT s.*, u.email, dep.name as department_name, dep.code as department_code, uni.name as university_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments dep ON s.department_id = dep.id
       JOIN universities uni ON s.university_id = uni.id
       WHERE s.user_id = $1`,
            [userId]
        );
        return rows[0] || null;
    },

    /**
     * Find student by activation token
     * @param {string} token
     * @returns {Promise<Object|null>}
     */
    findByActivationToken: async (token) => {
        const { rows } = await query(
            'SELECT * FROM students WHERE activation_token = $1 AND activation_expires > CURRENT_TIMESTAMP',
            [token]
        );
        return rows[0] || null;
    },

    /**
     * Update student
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
            `UPDATE students SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return rows[0];
    },

    /**
     * Update student status with audit logging
     * @param {string} id
     * @param {string} newStatus
     * @param {string} changedBy
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    updateStatus: async (id, newStatus, changedBy, reason = null) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const current = await client.query('SELECT status FROM students WHERE id = $1', [id]);
            if (!current.rows.length) {
                throw new Error('Student not found');
            }
            const oldStatus = current.rows[0].status;

            await client.query(
                'UPDATE students SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newStatus, id]
            );

            await client.query(
                'INSERT INTO student_status_history (student_id, old_status, new_status, changed_by, reason) VALUES ($1, $2, $3, $4, $5)',
                [id, oldStatus, newStatus, changedBy, reason]
            );

            await client.query('COMMIT');
            return { id, oldStatus, newStatus };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Activate student account and set password
     * @param {string} id
     * @param {string} passwordHash
     * @returns {Promise<Object>}
     */
    activateAccount: async (id, passwordHash) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `UPDATE students SET activation_token = NULL, activation_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING user_id`,
                [id]
            );

            if (!rows.length) {
                throw new Error('Student not found');
            }

            await client.query(
                'UPDATE users SET password_hash = $1, is_active = true, email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [passwordHash, rows[0].user_id]
            );

            await client.query('COMMIT');
            return { id, activated: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * List students with filters
     * @param {Object} filters
     * @returns {Promise<Object>}
     */
    list: async ({ page = 1, limit = 10, universityId, departmentId, status, search }) => {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (universityId) {
            paramCount++;
            conditions.push(`s.university_id = $${paramCount}`);
            values.push(universityId);
        }

        if (departmentId) {
            paramCount++;
            conditions.push(`s.department_id = $${paramCount}`);
            values.push(departmentId);
        }

        if (status) {
            paramCount++;
            conditions.push(`s.status = $${paramCount}`);
            values.push(status);
        }

        if (search) {
            paramCount++;
            conditions.push(`(s.first_name ILIKE $${paramCount} OR s.last_name ILIKE $${paramCount} OR s.student_id ILIKE $${paramCount})`);
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM students s ${whereClause}`,
            values
        );
        const totalCount = parseInt(countResult.rows[0].count);

        values.push(limit, offset);
        const { rows } = await query(
            `SELECT s.*, u.email, dep.name as department_name, dep.code as department_code
       FROM students s
       JOIN users u ON s.user_id = u.id
       JOIN departments dep ON s.department_id = dep.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
            values
        );

        return {
            students: rows,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
        };
    },
};

module.exports = studentModel;

