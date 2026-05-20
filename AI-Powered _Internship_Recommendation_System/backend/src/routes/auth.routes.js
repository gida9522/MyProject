/**
 * Auth Routes
 * Handles login, registration, and activation
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

console.log(authController);

// POST /api/auth/login - Universal login
router.post('/login', validate(schemas.login), authController.login);

// POST /api/auth/register/organization - Organization self-registration
router.post('/register/organization', validate(schemas.registerOrganization), authController.registerOrganization);

// POST /api/auth/activate/:token - Student account activation
router.post('/activate/:token', authController.activateStudent);

// GET /api/auth/me - Get current user
router.get('/me', protect, authController.getMe);

// POST /api/auth/change-password - Change password
router.post('/change-password', protect, authController.changePassword);

module.exports = router;


