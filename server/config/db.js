/**
 * PostgreSQL Database Connection
 * Uses pg Client Pool with MySQL-style compatibility layers to run seamlessly.
 * Includes host, port, database logging, and SSL configuration matching Render requirements.
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'tasksphere',
  DB_PORT = '5432'
} = process.env;

const { Pool } = pg;

// ─── Connection Configuration & Logging ──────────────────────────────────────
console.log(`\n=== [Database Connection Attempt] ===`);
console.log(`[DB INFO] Driver: PostgreSQL`);
console.log(`[DB INFO] Connection Target Host: "${DB_HOST}"`);
console.log(`[DB INFO] Connection Target Port: "${DB_PORT}"`);
console.log(`[DB INFO] Target Database Name:   "${DB_NAME}"`);
console.log(`[DB INFO] Database Username:      "${DB_USER}"`);

const isLocal = DB_HOST === 'localhost' || DB_HOST === '127.0.0.1';
const sslConfig = isLocal ? false : { rejectUnauthorized: false };

console.log(`[DB INFO] Configured SSL Mode:    ${isLocal ? 'Disabled (Local Connection)' : 'Enabled (rejectUnauthorized: false)'}`);
console.log(`====================================\n`);

const pool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: parseInt(DB_PORT, 10) || 5432,
  ssl: sslConfig
});

export async function initializeDatabase() {
  console.log(`[DB INIT] Verifying database connection and initial tables...`);
  const client = await pool.connect();
  
  try {
    console.log(`[DB INIT] Database connection successfully established. Creating tables...`);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category VARCHAR(50) NULL,
        priority VARCHAR(20) NULL,
        due_date DATE NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    const userCountResult = await client.query('SELECT COUNT(*) AS count FROM users');
    if (parseInt(userCountResult.rows[0].count, 10) === 0) {
      console.warn('[DB INIT] No users exist yet. Please register a new account.');
    }
    
    console.log(`[DB INIT] Database and tables successfully verified.`);
  } catch (err) {
    console.error(`[DB INIT ERROR] Table initialization failed:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ─── MySQL-to-PostgreSQL Query Compatibility Wrapper ─────────────────────────
const db = {
  async execute(sql, params = []) {
    // 1. Convert MySQL '?' parameter markers to PostgreSQL '$1', '$2', ...
    let pgSql = sql;
    let paramIndex = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
    
    // 2. Append ' RETURNING *' to INSERT commands to retrieve the auto-increment serial ID
    if (pgSql.trim().toUpperCase().startsWith('INSERT ')) {
      pgSql += ' RETURNING *';
    }

    try {
      const result = await pool.query(pgSql, params);

      // 3. Mock mysql2 metadata response schemas for insert/update/delete requests
      if (sql.trim().toUpperCase().startsWith('INSERT ')) {
        const insertedRow = result.rows[0];
        const mockResult = {
          insertId: insertedRow ? insertedRow.id : null,
          affectedRows: result.rowCount
        };
        return [mockResult];
      } else if (sql.trim().toUpperCase().startsWith('DELETE ') || sql.trim().toUpperCase().startsWith('UPDATE ')) {
        const mockResult = {
          affectedRows: result.rowCount
        };
        return [mockResult];
      }

      // 4. Return array format matching MySQL [rows] structure
      return [result.rows];
    } catch (err) {
      console.error(`[DB QUERY ERROR] SQL Execution failed:`, err.message);
      console.error(`[DB QUERY ERROR] Parsed SQL Command:`, pgSql);
      throw err;
    }
  }
};

export default db;
export { pool };
