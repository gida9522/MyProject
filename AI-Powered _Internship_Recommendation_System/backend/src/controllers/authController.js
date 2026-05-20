/**
 * Auth Controller
 * Handles authentication: login, organization registration, student activation
 */
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
const organizationModel = require('../models/organizationModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
    /**
     * POST /api/auth/login
     * Universal login for all roles
     */
    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        // FIX: service already returns token + user
        res.json({
            status: 'success',
            data: {
                token: result.token,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                    isActive: result.user.is_active,
                },
            },
        });
    }),

    /**
     * POST /api/auth/register/organization
     */
    registerOrganization: asyncHandler(async (req, res) => {
        const {
            email, password, name, description, industry, website,
            phone, address, city, country, registrationNumber, taxId,
        } = req.body;

        const existing = await userModel.findByEmail(email);
        if (existing) {
            throw new ApiError(409, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await userModel.create({
            email,
            password_hash: passwordHash,
            role: 'ORGANIZATION',
            is_active: false,
        });

        const organization = await organizationModel.create({
            userId: user.id,
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
        });

        res.status(201).json({
            status: 'success',
            message: 'Organization registered successfully. Awaiting approval.',
            data: {
                organization: {
                    id: organization.id,
                    name: organization.name,
                    status: organization.status,
                },
            },
        });
    }),

    /**
     * POST /api/auth/activate/:token
     */
    activateStudent: asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        const student = await studentModel.findByActivationToken(token);
        if (!student) {
            throw new ApiError(400, 'Invalid or expired activation token');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await studentModel.activateAccount(student.id, passwordHash);

        res.json({
            status: 'success',
            message: 'Account activated successfully. You can now log in.',
        });
    }),

    /**
     * GET /api/auth/me
     */
    getMe: asyncHandler(async (req, res) => {
        const { id, role } = req.user;
        let profile = null;

        if (role === 'UNIVERSITY') {
            const universityModel = require('../models/universityModel');
            profile = await universityModel.findByUserId(id);
        } else if (role === 'ORGANIZATION') {
            profile = await organizationModel.findByUserId(id);
        } else if (role === 'STUDENT') {
            profile = await studentModel.findByUserId(id);
        } else if (role === 'SUPER_ADMIN') {
            const { query } = require('../config/database');

            const { rows } = await query(
                'SELECT id, full_name FROM super_admins WHERE user_id = $1',
                [id]
            );

            profile = rows.length
                ? {
                    id: rows[0].id,
                    fullName: rows[0].full_name,
                }
                : null;
        }

        res.json({
            status: 'success',
            data: {
                user: req.user,
                profile,
            },
        });
    }),

    /**
     * POST /api/auth/change-password
     */
    changePassword: asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            throw new ApiError(401, 'Current password is incorrect');
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await userModel.updatePassword(userId, newHash);

        res.json({
            status: 'success',
            message: 'Password changed successfully',
        });
    }),
};

module.exports = authController;