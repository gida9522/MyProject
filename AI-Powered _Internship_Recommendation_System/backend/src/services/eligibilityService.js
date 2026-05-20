/**
 * Eligibility Service
 * Determines if a student is eligible for internship based on department policy
 */
const departmentModel = require('../models/departmentModel');
const studentModel = require('../models/studentModel');
const ApiError = require('../utils/ApiError');

const eligibilityService = {
    /**
     * Check if student is eligible for internship
     * Evaluates against department policy and student current status
     * @param {string} studentId
     * @returns {Promise<Object>}
     */
    checkEligibility: async (studentId) => {
        const student = await studentModel.findById(studentId);
        if (!student) {
            throw new ApiError(404, 'Student not found');
        }

        const policy = await departmentModel.findActivePolicy(student.department_id);
        if (!policy) {
            return {
                eligible: false,
                reason: 'No active internship policy found for this department',
                student,
            };
        }

        const checks = {
            yearMatch: student.current_year >= policy.internship_year,
            cgpaMatch: parseFloat(student.cgpa) >= parseFloat(policy.min_cgpa),
            creditsMatch: student.total_credits >= policy.required_credits,
            statusValid: ['not_eligible', 'eligible_for_internship'].includes(student.status),
        };

        const isEligible = checks.yearMatch && checks.cgpaMatch && checks.creditsMatch && checks.statusValid;

        return {
            eligible: isEligible,
            reason: isEligible ? null :
                !checks.yearMatch ? `Student must be in year ${policy.internship_year} or higher` :
                    !checks.cgpaMatch ? `Minimum CGPA required: ${policy.min_cgpa}` :
                        !checks.creditsMatch ? `Minimum credits required: ${policy.required_credits}` :
                            'Student status does not allow application',
            checks,
            policy,
            student,
        };
    },

    /**
     * Update student status to eligible_for_internship if conditions met
     * @param {string} studentId
     * @param {string} changedBy
     * @returns {Promise<Object>}
     */
    evaluateAndUpdate: async (studentId, changedBy) => {
        const result = await eligibilityService.checkEligibility(studentId);

        if (result.eligible && result.student.status === 'not_eligible') {
            await studentModel.updateStatus(studentId, 'eligible_for_internship', changedBy, 'System: Eligibility check passed based on department policy');
            result.student.status = 'eligible_for_internship';
        }

        return result;
    },
};

module.exports = eligibilityService;

