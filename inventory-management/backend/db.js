// ============================================================
// db.js — MySQL Connection Pool
// Uses mysql2/promise for async/await support
// ============================================================

const mysql = require('mysql2/promise');

// Create a connection pool for better performance and reliability
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',   // ← Update with your MySQL password
    database: process.env.DB_NAME || 'inventory_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,          // Maximum simultaneous connections
    queueLimit: 0,                // Unlimited queue
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Test the connection on startup
(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('✅ MySQL connected successfully to inventory_db');
        conn.release();
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        process.exit(1); // Exit if DB connection fails
    }
})();

module.exports = pool;
