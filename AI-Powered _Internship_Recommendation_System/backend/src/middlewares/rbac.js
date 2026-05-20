/**
 * Role-Based Access Control (RBAC) middleware
 * Restricts route access to specific user roles
 */
const ApiError = require('../utils/ApiError');

/**
 * Middleware factory to restrict access to specified roles
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        // 👉 ADD IT RIGHT HERE
        console.log('USER ROLE:', req.user.role);
        console.log('ALLOWED ROLES:', roles);

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. Required role: ${roles.join(' or ')}`
            );
        }

        next();
    };
};

module.exports = {
    restrictTo,
};
