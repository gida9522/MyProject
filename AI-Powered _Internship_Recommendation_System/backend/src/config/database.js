/**
 * Database configuration using pg Pool
 * Manages PostgreSQL connections for the application
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'internship_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // Pool configuration for production scalability
    max: 20,                    // Maximum number of connections in pool
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Return error after 2s if connection not established
});

// Log connection status
pool.on('connect', () => {
    console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err);
    process.exit(-1);
});

/**
 * Execute a SQL query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for transactions
 * @returns {Promise<pg.Client>} Database client
 */
const getClient = () => pool.connect();

module.exports = {
    pool,
    query,
    getClient,
};

(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('PostgreSQL connected successfully');
    } catch (err) {
        console.error('PostgreSQL connection failed:', err.message);
        process.exit(1);
    }
})();