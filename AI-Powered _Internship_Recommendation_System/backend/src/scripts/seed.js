/**
 * Seed Script
 * Creates initial Super Admin user for testing
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function seed() {
    try {
        console.log('Starting seed...');

        // Check if super admin exists
        const { rows: existing } = await query(
            "SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1"
        );

        if (existing.length > 0) {
            console.log('Super Admin already exists. Skipping seed.');
            process.exit(0);
        }

        // Create Super Admin user
        const passwordHash = await bcrypt.hash('SuperAdmin123!', 12);

        const { rows: userRows } = await query(
            `INSERT INTO users (email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            ['superadmin@internship-platform.com', passwordHash, 'SUPER_ADMIN', true, true]
        );

        const userId = userRows[0].id;

        await query(
            `INSERT INTO super_admins (user_id, full_name, ministry_name)
       VALUES ($1, $2, $3)`,
            [userId, 'System Administrator', 'Ministry of Education']
        );

        console.log('Seed completed successfully!');
        console.log('Super Admin Credentials:');
        console.log('  Email: superadmin@internship-platform.com');
        console.log('  Password: SuperAdmin123!');
        console.log('');
        console.log('IMPORTANT: Change this password in production!');

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();

