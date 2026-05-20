/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request
 */
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

/**
 * Protect routes - verify JWT token and attach user
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for Authorization header with Bearer token
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized to access this route');
    }

    // Verify token
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('DECODED TOKEN:', decoded); // Debugging
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired token');
    }

    // Fetch user from database
    const { rows } = await query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.id]
    );

    if (!rows.length) {
        throw new ApiError(401, 'User not found');
    }

    const user = rows[0];

    if (!user.is_active) {
        throw new ApiError(
            401,
            'Account is not active. Please contact administrator.'
        );
    }

    // Attach user to request object
    req.user = user;

    next();
});

module.exports = {
    protect,
};