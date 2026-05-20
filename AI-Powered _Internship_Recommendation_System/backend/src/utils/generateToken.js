/**
 * JWT token generation utility
 * Creates signed tokens for authenticated users
 */
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user
 * @param {Object} payload - User data to encode
 * @param {Object} options - JWT sign options
 * @returns {string} Signed JWT token
 */
const generateToken = (payload, options = {}) => {
    const defaultOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { ...defaultOptions, ...options }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken,
};

