/**
 * University Routes
 * Manages students, departments, policies, and monitoring
 */
const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/rbac');
const { validate, schemas } = require('../middlewares/validate');

// All routes require UNIVERSITY role
router.use(protect, restrictTo('UNIVERSITY'));

// Profile
router.get('/profile', universityController.getProfile);

// Departments
router.post('/departments', universityController.createDepartment);
router.get('/departments', universityController.listDepartments);
router.post('/departments/:id/policy', validate(schemas.createDepartmentPolicy), universityController.createPolicy);

// Students
router.post('/students', validate(schemas.createStudent), universityController.createStudent);
router.post('/students/bulk', universityController.createStudentsBulk);
router.get('/students', universityController.listStudents);
router.get('/students/:id', universityController.getStudent);
router.patch('/students/:id/status', universityController.updateStudentStatus);

// Applications
router.get('/applications', universityController.listApplications);

// Organizations
router.get('/organizations', universityController.listOrganizations);

// Analytics
router.get('/analytics', universityController.getAnalytics);

module.exports = router;

