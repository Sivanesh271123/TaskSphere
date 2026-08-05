/**
 * MySQL Database Connection
 * Uses mysql2/promise for async CRUD operations against a MySQL database.
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'tasksphere',
  DB_PORT = '3306'
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: parseInt(DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initializeDatabase() {
  const tempConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT, 10) || 3306
  });

  try {
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  } finally {
    await tempConnection.end();
  }

  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category VARCHAR(50) NULL,
        priority VARCHAR(20) NULL,
        due_date DATE NULL,
        completed TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    const [userCountRows] = await connection.execute('SELECT COUNT(*) AS count FROM users');
    if (userCountRows[0].count === 0) {
      console.warn('No users exist yet. Please register a new account to continue.');
    }

    const [columnRows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [DB_NAME, 'tasks', 'user_id']
    );

    if (columnRows[0].count === 0) {
      throw new Error(
        'Database schema mismatch: tasks.user_id is required. ' +
        'Please run a migration to add the user_id column and preserve existing task data.'
      );
    }
  } finally {
    connection.release();
  }
}

export default pool;
