/**
 * Super Admin Routes
 * National-level oversight
 */
const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { protect } = require('../middlewares/auth');
const { restrictTo } = require('../middlewares/rbac');
const { validate, schemas } = require('../middlewares/validate');

// All routes require SUPER_ADMIN role
router.use(protect, restrictTo('SUPER_ADMIN'));

// University management
router.post('/universities', validate(schemas.createUniversity), superAdminController.createUniversity);
router.get('/universities', superAdminController.listUniversities);
router.get('/universities/:id', superAdminController.getUniversity);
router.patch('/universities/:id/status', superAdminController.updateUniversityStatus);

// Organization oversight
router.get('/organizations', superAdminController.listOrganizations);
router.patch('/organizations/:id/status', superAdminController.updateOrganizationStatus);

// Analytics
router.get('/analytics', superAdminController.getAnalytics);

console.log("SUPER ADMIN ROUTES LOADED");

module.exports = router;

