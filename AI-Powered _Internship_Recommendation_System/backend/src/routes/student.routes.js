/**
 * Student Routes
 * Profile, internships, applications, recommendations
 */
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/rbac');

// All routes require STUDENT role
router.use(protect, restrictTo('STUDENT'));

// Profile
router.get('/profile', studentController.getProfile);
router.patch('/profile', studentController.updateProfile);

// Eligibility
router.get('/eligibility', studentController.checkEligibility);

// Skills
router.post('/skills', studentController.addSkill);
router.get('/skills', studentController.listSkills);

// Projects
router.post('/projects', studentController.addProject);
router.get('/projects', studentController.listProjects);

// Documents
router.post('/documents', studentController.addDocument);
router.get('/documents', studentController.listDocuments);

// Internships
router.get('/internships', studentController.listInternships);
router.get('/internships/:id', studentController.getInternship);
router.get('/recommendations', studentController.getRecommendations);

// Applications
router.post('/applications', studentController.apply);
router.get('/applications', studentController.listApplications);

// Progress & Evaluations
router.get('/progress', studentController.listProgress);
router.get('/evaluations', studentController.listEvaluations);

module.exports = router;

