/**
 * Request validation middleware using Joi
 * Validates request body, params, or query against schemas
 */
const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * Validate request data against a Joi schema
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const message = error.details
                .map((detail) => detail.message)
                .join(', ');
            throw new ApiError(400, `Validation error: ${message}`);
        }

        // Replace the property with validated value
        req[property] = value;
        next();
    };
};

// Common validation schemas
const schemas = {
    // Auth schemas
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),

    registerOrganization: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        name: Joi.string().min(2).max(255).required(),
        description: Joi.string().allow(''),
        industry: Joi.string().allow(''),
        website: Joi.string().uri().allow(''),
        phone: Joi.string().allow(''),
        address: Joi.string().allow(''),
        city: Joi.string().allow(''),
        country: Joi.string().allow(''),
        registrationNumber: Joi.string().allow(''),
        taxId: Joi.string().allow(''),
    }),

    createUniversity: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        name: Joi.string().min(2).max(255).required(),
        code: Joi.string().min(2).max(50).required(),
        address: Joi.string().allow(''),
        city: Joi.string().allow(''),
        country: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        website: Joi.string().uri().allow(''),
    }),

    createStudent: Joi.object({
        email: Joi.string().email().required(),
        studentId: Joi.string().required(),
        firstName: Joi.string().min(1).max(100).required(),
        lastName: Joi.string().min(1).max(100).required(),
        departmentId: Joi.string().uuid().required(),
        enrollmentYear: Joi.number().integer().min(2000).max(2100).required(),
        currentYear: Joi.number().integer().min(1).max(6).required(),
        currentSemester: Joi.number().integer().min(1).max(3).optional(),
        phone: Joi.string().allow(''),
        dateOfBirth: Joi.date().optional(),
        cgpa: Joi.number().min(0).max(4).optional(),
        totalCredits: Joi.number().integer().min(0).optional(),
    }),

    createInternship: Joi.object({
        title: Joi.string().min(2).max(255).required(),
        description: Joi.string().min(10).required(),
        requirements: Joi.array().items(Joi.string()).default([]),
        responsibilities: Joi.array().items(Joi.string()).default([]),
        durationMonths: Joi.number().integer().min(1).max(24).required(),
        type: Joi.string().valid('remote', 'on-site', 'hybrid').required(),
        location: Joi.string().allow(''),
        capacity: Joi.number().integer().min(1).default(1),
        deadline: Joi.date().required(),
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional(),
        minCgpa: Joi.number().min(0).max(4).default(0),
        salary: Joi.string().allow(''),
        isPaid: Joi.boolean().default(false),
    }),

    applyToInternship: Joi.object({
        coverLetter: Joi.string().min(10).max(5000).required(),
    }),

    updateApplicationStatus: Joi.object({
        status: Joi.string().valid('pending', 'under_review', 'shortlisted', 'accepted', 'rejected').required(),
        feedback: Joi.string().max(2000).allow(''),
    }),

    createDepartmentPolicy: Joi.object({
        departmentId: Joi.string().uuid().required(),
        internshipYear: Joi.number().integer().min(1).max(6).required(),
        internshipSemester: Joi.number().integer().min(1).max(3).optional(),
        internshipTiming: Joi.string().valid('semester', 'summer', 'both').required(),
        internshipDurationMonths: Joi.number().integer().min(1).max(24).required(),
        minCgpa: Joi.number().min(0).max(4).default(0),
        requiredCredits: Joi.number().integer().min(0).default(0),
        effectiveFrom: Joi.date().required(),
        effectiveUntil: Joi.date().optional(),
    }),
};

module.exports = {
    validate,
    schemas,
};
