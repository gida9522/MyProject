/**
 * Route Index
 * Mounts all API routes
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const superAdminRoutes = require('./superAdmin.routes');
const universityRoutes = require('./university.routes');
const organizationRoutes = require('./organization.routes');
const studentRoutes = require('./student.routes');

console.log("INDEX ROUTES HIT");
// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/university', universityRoutes);
router.use('/organization', organizationRoutes);
router.use('/student', studentRoutes);

module.exports = router;

