/**
 * Authentication Service
 * Handles user registration, login, password management, and role-based operations
 */
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');
const userModel = require('../models/userModel');
const universityModel = require('../models/universityModel');
const organizationModel = require('../models/organizationModel');
const studentModel = require('../models/studentModel');
const departmentModel = require('../models/departmentModel');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const emailService = require('./emailService');

const SALT_ROUNDS = 12;

const authService = {
    /**
     * Register a new organization
     */
    registerOrganization: async (data) => {
        const existingUser = await userModel.findByEmail(data.email);
        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await userModel.create({
            email: data.email,
            password_hash: passwordHash,
            role: 'ORGANIZATION',
            is_active: false,
        });

        if (!user) {
            throw new Error("User creation failed");
        }

        console.log("CREATED USER:", user);

        const organization = await organizationModel.create({
            userId: user.id,
            name: data.name,
            description: data.description,
            industry: data.industry,
            website: data.website,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            country: data.country,
            registrationNumber: data.registrationNumber,
            taxId: data.taxId,
        });

        console.log("REGISTER HIT");

        await emailService.sendOrganizationRegistrationEmail(data.email, data.name);

        return {
            message: 'Organization registered successfully. Pending approval.',
            organization: {
                id: organization.id,
                name: organization.name,
                status: organization.status,
            },
        };
    },

    /**
     * Login user
     */
    login: async (email, password) => {
        console.log("LOGIN EMAIL:", email);
        const user = await userModel.findByEmail(email);
        console.log("FOUND USER:", user); // 👈 ADD THIS

        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        if (!user.is_active) {
            throw new ApiError(
                401,
                'Account is not active. Please contact your administrator.'
            );
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log("PASSWORD MATCH:", isMatch); // 👈 ADD THIS

        if (!isMatch) {
            throw new ApiError(401, 'Invalid email or password');
        }

        await userModel.updateLastLogin(user.id);

        const userData = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        if (user.role === 'UNIVERSITY') {
            const university = await universityModel.findByUserId(user.id);
            userData.university = university
                ? { id: university.id, name: university.name }
                : null;

        } else if (user.role === 'ORGANIZATION') {
            const org = await organizationModel.findByUserId(user.id);
            userData.organization = org
                ? { id: org.id, name: org.name }
                : null;

        } else if (user.role === 'STUDENT') {
            const student = await studentModel.findByUserId(user.id);
            userData.student = student
                ? {
                    id: student.id,
                    firstName: student.first_name,
                    status: student.status,
                }
                : null;

        } else if (user.role === 'SUPER_ADMIN') {
            const { rows } = await query(
                'SELECT id, full_name FROM super_admins WHERE user_id = $1',
                [user.id]
            );

            userData.superAdmin = rows.length
                ? {
                    id: rows[0].id,
                    fullName: rows[0].full_name,
                }
                : null;
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            token,
            user: userData,
        };
    },

    /**
     * Create University
     */
    createUniversity: async (data, createdBy) => {
        const existingUser = await userModel.findByEmail(data.email);

        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }

        const { rows: existingCode } = await query(
            'SELECT id FROM universities WHERE code = $1',
            [data.code]
        );

        if (existingCode.length) {
            throw new ApiError(409, 'University code already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await userModel.create({
            email: data.email,
            password_hash: passwordHash, // FIXED
            role: 'UNIVERSITY',
            is_active: true, // FIXED
        });

        const university = await universityModel.create({
            userId: user.id,
            name: data.name,
            code: data.code,
            address: data.address,
            city: data.city,
            country: data.country,
            phone: data.phone,
            website: data.website,
        });

        await universityModel.updateStatus(
            university.id,
            'approved',
            null,
            createdBy
        );

        await emailService.sendUniversityWelcomeEmail(
            data.email,
            data.name,
            data.password
        );

        return {
            message: 'University created successfully',
            university: {
                id: university.id,
                name: university.name,
                code: university.code,
                accreditationStatus: 'approved',
            },
        };
    },

    /**
     * Create Student
     */
    createStudent: async (data, universityId) => {
        const dept = await departmentModel.findById(data.departmentId);

        if (!dept || dept.university_id !== universityId) {
            throw new ApiError(
                403,
                'Department does not belong to your university'
            );
        }

        const existingUser = await userModel.findByEmail(data.email);

        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }

        const { rows: existingStudentId } = await query(
            'SELECT id FROM students WHERE university_id = $1 AND student_id = $2',
            [universityId, data.studentId]
        );

        if (existingStudentId.length) {
            throw new ApiError(
                409,
                'Student ID already exists in this university'
            );
        }

        const tempPassword =
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).toUpperCase().slice(-2);

        const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

        const user = await userModel.create({
            email: data.email,
            password_hash: passwordHash, // FIXED
            role: 'STUDENT',
            is_active: false, // FIXED
        });

        let status = 'not_eligible';

        const policy = await departmentModel.findActivePolicy(
            data.departmentId
        );

        if (policy) {
            const isEligible = await authService.checkEligibility(
                {
                    current_year: data.currentYear,
                    current_semester: data.currentSemester,
                    cgpa: data.cgpa,
                    total_credits: data.totalCredits,
                },
                policy
            );

            if (isEligible) {
                status = 'eligible_for_internship';
            }
        }

        const student = await studentModel.create({
            userId: user.id,
            universityId,
            departmentId: data.departmentId,
            studentId: data.studentId,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            enrollmentYear: data.enrollmentYear,
            currentYear: data.currentYear,
            currentSemester: data.currentSemester,
            cgpa: data.cgpa || 0.0,
            totalCredits: data.totalCredits || 0,
            status,
        });

        await emailService.sendStudentActivationEmail(
            data.email,
            data.firstName,
            student.activation_token
        );

        return {
            message:
                'Student created successfully. Activation email sent.',
            student: {
                id: student.id,
                studentId: student.student_id,
                firstName: student.first_name,
                lastName: student.last_name,
                status: student.status,
            },
        };
    },

    /**
     * Create Super Admin
     */
    createSuperAdmin: async (data) => {
        const existingUser = await userModel.findByEmail(data.email);

        if (existingUser) {
            throw new ApiError(409, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(
            data.password,
            SALT_ROUNDS
        );

        const user = await userModel.create({
            email: data.email,
            password_hash: passwordHash, // FIXED
            role: 'SUPER_ADMIN',
            is_active: true, // FIXED
        });

        await query(
            'INSERT INTO super_admins (user_id, full_name) VALUES ($1, $2)',
            [user.id, data.fullName]
        );

        return {
            message: 'Super Admin created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    },
};

module.exports = authService;