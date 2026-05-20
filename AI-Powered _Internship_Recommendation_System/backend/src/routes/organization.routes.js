/**
 * Organization Routes
 * Manages internships, applications, and progress
 */
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/rbac');
const { validate, schemas } = require('../middlewares/validate');

// All routes require ORGANIZATION role
router.use(protect, restrictTo('ORGANIZATION'));

// Profile
router.get('/profile', organizationController.getProfile);
router.patch('/profile', organizationController.updateProfile);

// Internships
router.post('/internships', validate(schemas.createInternship), organizationController.createInternship);
router.get('/internships', organizationController.listInternships);
router.get('/internships/:id', organizationController.getInternship);
router.patch('/internships/:id', organizationController.updateInternship);
router.delete('/internships/:id', organizationController.cancelInternship);

// Applications
router.get('/applications', organizationController.listApplications);
router.get('/applications/:id', organizationController.getApplication);
router.patch('/applications/:id/status', validate(schemas.updateApplicationStatus), organizationController.updateApplicationStatus);

// Progress & Evaluations
router.post('/progress', organizationController.submitProgress);
router.post('/evaluations', organizationController.submitEvaluation);

module.exports = router;

