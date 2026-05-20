/**
 * Async handler wrapper for Express controllers
 * Eliminates need for try-catch in every async controller
 * Catches errors and passes them to Express error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

