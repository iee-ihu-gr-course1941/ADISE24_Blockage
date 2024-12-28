const mysql = require('mysql2/promise');
const dotenv = require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
    // waitForConnections: true,
    // connectionLimit: 10,
    // queueLimit: 0
});

// Check connection on pool creation
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database pool connected successfully.');
        connection.release(); // Release the connection immediately
    } catch (error) {
        console.error('Error establishing pool connection:', error.message);
    }
})();

// Export the pool for queries
module.exports = pool;