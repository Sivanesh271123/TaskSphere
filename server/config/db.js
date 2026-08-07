/**
 * Database Connection & Initialization
 * Supports both PostgreSQL (pg) and MySQL (mysql2) depending on environment configuration.
 * MySQL dialect syntax compatibility wrapper allows queries to run transparently on both.
 */

import dotenv from 'dotenv';
import pg from 'pg';
import mysql from 'mysql2/promise';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'tasksphere',
  DB_PORT = '5432'
} = process.env;

const isMySQL = DB_PORT === '3306';
const { Pool } = pg;

console.log(`\n=== [Database Connection Attempt] ===`);
console.log(`[DB INFO] Driver:                 ${isMySQL ? 'MySQL' : 'PostgreSQL'}`);
console.log(`[DB INFO] Connection Target Host: "${DB_HOST}"`);
console.log(`[DB INFO] Connection Target Port: "${DB_PORT}"`);
console.log(`[DB INFO] Target Database Name:   "${DB_NAME}"`);
console.log(`[DB INFO] Database Username:      "${DB_USER}"`);

let pgPool = null;
let mysqlPool = null;

if (isMySQL) {
  mysqlPool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: parseInt(DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  const isLocal = DB_HOST === 'localhost' || DB_HOST === '127.0.0.1';
  const sslConfig = isLocal ? false : { rejectUnauthorized: false };
  console.log(`[DB INFO] Configured SSL Mode:    ${isLocal ? 'Disabled (Local Connection)' : 'Enabled (rejectUnauthorized: false)'}`);
  
  pgPool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: parseInt(DB_PORT, 10) || 5432,
    ssl: sslConfig
  });
}
console.log(`====================================\n`);

export async function initializeDatabase() {
  console.log(`[DB INIT] Verifying database connection and initial tables...`);
  
  if (isMySQL) {
    const client = await mysqlPool.getConnection();
    try {
      console.log(`[DB INIT] MySQL connection established. Creating tables...`);
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          reset_otp VARCHAR(10) NULL,
          reset_otp_expires TIMESTAMP NULL,
          reset_otp_attempts INT DEFAULT 0,
          reset_otp_verified INT DEFAULT 0,
          reset_token VARCHAR(255) NULL,
          reset_token_expires TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration: Add reset_otp columns to users table if missing (MySQL)
      const mysqlUserAlters = [
        'ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) NULL',
        'ALTER TABLE users ADD COLUMN reset_otp_expires TIMESTAMP NULL',
        'ALTER TABLE users ADD COLUMN reset_otp_attempts INT DEFAULT 0',
        'ALTER TABLE users ADD COLUMN reset_otp_verified INT DEFAULT 0',
        'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL',
        'ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL'
      ];
      for (const alter of mysqlUserAlters) {
        try {
          await client.query(alter);
        } catch (err) {
          if (!err.message.includes('Duplicate column') && !err.message.includes('already exists')) {
            throw err;
          }
        }
      }

      // Create tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          category VARCHAR(50) DEFAULT 'Personal',
          priority VARCHAR(20) NULL,
          due_date DATE NULL,
          due_time TIME NULL,
          repeat_type VARCHAR(20) DEFAULT 'None',
          repeat_interval INT DEFAULT 1,
          start_date DATE NULL,
          end_date DATE NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          kanban_status VARCHAR(20) DEFAULT 'Todo',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Migration: Add category, due_time and repeat columns if they do not exist (MySQL)
      const mysqlAlters = [
        'ALTER TABLE tasks ADD COLUMN category VARCHAR(50) DEFAULT "Personal"',
        'ALTER TABLE tasks ADD COLUMN due_time TIME NULL',
        'ALTER TABLE tasks ADD COLUMN repeat_type VARCHAR(20) DEFAULT "None"',
        'ALTER TABLE tasks ADD COLUMN repeat_interval INT DEFAULT 1',
        'ALTER TABLE tasks ADD COLUMN start_date DATE NULL',
        'ALTER TABLE tasks ADD COLUMN end_date DATE NULL',
        'ALTER TABLE tasks ADD COLUMN kanban_status VARCHAR(20) DEFAULT "Todo"'
      ];
      for (const alter of mysqlAlters) {
        try {
          await client.query(alter);
        } catch (err) {
          if (!err.message.includes('Duplicate column') && !err.message.includes('already exists')) {
            throw err;
          }
        }
      }
      
      try {
        await client.query('ALTER TABLE tasks ALTER COLUMN category SET DEFAULT "Personal"');
      } catch(err) {}
      
      try {
        await client.query('UPDATE tasks SET category = "Personal" WHERE category IS NULL');
      } catch(err) {}

      try {
        await client.query('UPDATE tasks SET kanban_status = "Todo" WHERE kanban_status IS NULL');
      } catch(err) {}

      // Create task_completions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_completions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL,
          completed_date DATE NOT NULL,
          UNIQUE KEY task_completion_idx (task_id, completed_date),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `);

      // Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          name VARCHAR(50) NOT NULL,
          color VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY categories_user_name_idx (user_id, name)
        )
      `);

      // Create notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          task_id INT NULL,
          title VARCHAR(255) NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `);

      // Create email_reminders_log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_reminders_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          task_id INT NOT NULL,
          occurrence_date DATE NOT NULL,
          reminder_type VARCHAR(20) NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY email_reminder_unique (task_id, occurrence_date, reminder_type),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `);

      // Migration: Rename in_app_notifications to notifications if it exists (MySQL)
      try {
        await client.query('RENAME TABLE in_app_notifications TO notifications');
      } catch (err) {
        // Ignore if table doesn't exist or already renamed
      }

      // Migration: Add new columns if they do not exist
      const notifAlters = [
        'ALTER TABLE notifications ADD COLUMN task_id INT NULL',
        'ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL',
        'ALTER TABLE notifications ADD CONSTRAINT notifications_task_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE'
      ];
      for (const alter of notifAlters) {
        try {
          await client.query(alter);
        } catch (err) {
          // Ignore duplicate column/key errors
        }
      }

      // Create indexes for performance (MySQL)
      const mysqlIndexes = [
        'CREATE INDEX tasks_due_date_idx ON tasks (due_date)',
        'CREATE INDEX tasks_created_at_idx ON tasks (created_at)',
        'CREATE INDEX tasks_user_id_idx ON tasks (user_id)',
        'CREATE INDEX tasks_completed_idx ON tasks (completed)',
        'CREATE INDEX notif_user_id_idx ON notifications (user_id)',
        'CREATE INDEX notif_task_id_idx ON notifications (task_id)',
        'CREATE INDEX notif_is_read_idx ON notifications (is_read)'
      ];
      for (const idx of mysqlIndexes) {
        try {
          await client.query(idx);
        } catch (err) {
          if (!err.message.includes('Duplicate key') && !err.message.includes('already exists') && !err.message.includes('Duplicate index')) {
            throw err;
          }
        }
      }

      // Seed default categories
      const [rows] = await client.query('SELECT COUNT(*) AS count FROM categories WHERE user_id IS NULL');
      if (parseInt(rows[0].count, 10) === 0) {
        console.log('[DB INIT] Seeding default categories...');
        const defaults = [
          ['Study', '#3b82f6'],
          ['Work', '#8b5cf6'],
          ['Personal', '#10b981'],
          ['Shopping', '#f97316'],
          ['Health', '#ef4444'],
          ['Other', '#6b7280']
        ];
        for (const [name, color] of defaults) {
          await client.query(
            'INSERT INTO categories (user_id, name, color) VALUES (NULL, ?, ?)',
            [name, color]
          );
        }
      }

      const [userRows] = await client.query('SELECT COUNT(*) AS count FROM users');
      if (parseInt(userRows[0].count, 10) === 0) {
        console.warn('[DB INIT] No users exist yet. Please register a new account.');
      }
      console.log(`[DB INIT] MySQL database and tables successfully verified.`);
    } catch (err) {
      console.error(`[DB INIT ERROR] MySQL initialization failed:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  } else {
    const client = await pgPool.connect();
    try {
      console.log(`[DB INIT] PostgreSQL connection established. Creating tables...`);
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          reset_otp VARCHAR(10) NULL,
          reset_otp_expires TIMESTAMP NULL,
          reset_otp_attempts INT DEFAULT 0,
          reset_otp_verified INT DEFAULT 0,
          reset_token VARCHAR(255) NULL,
          reset_token_expires TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration: Add reset_otp columns to users table if missing (PostgreSQL)
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10) NULL
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP NULL
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INT DEFAULT 0
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_verified INT DEFAULT 0
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL
      `);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL
      `);

      // Create tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          category VARCHAR(50) DEFAULT 'Personal',
          priority VARCHAR(20) NULL,
          due_date DATE NULL,
          due_time TIME NULL,
          repeat_type VARCHAR(20) DEFAULT 'None',
          repeat_interval INT DEFAULT 1,
          start_date DATE NULL,
          end_date DATE NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          kanban_status VARCHAR(20) DEFAULT 'Todo',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Migration: Add new columns if they do not exist (PostgreSQL)
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Personal'
      `);
      await client.query(`
        ALTER TABLE tasks ALTER COLUMN category SET DEFAULT 'Personal'
      `);
      await client.query(`
        UPDATE tasks SET category = 'Personal' WHERE category IS NULL
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME NULL
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_type VARCHAR(20) DEFAULT 'None'
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_interval INT DEFAULT 1
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE NULL
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE NULL
      `);
      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS kanban_status VARCHAR(20) DEFAULT 'Todo'
      `);
      await client.query(`
        ALTER TABLE tasks ALTER COLUMN kanban_status SET DEFAULT 'Todo'
      `);
      await client.query(`
        UPDATE tasks SET kanban_status = 'Todo' WHERE kanban_status IS NULL
      `);

      // Create task_completions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_completions (
          id SERIAL PRIMARY KEY,
          task_id INT NOT NULL,
          completed_date DATE NOT NULL,
          UNIQUE (task_id, completed_date),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `);

      // Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(50) NOT NULL,
          color VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id INT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          title VARCHAR(255) NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create email_reminders_log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_reminders_log (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          occurrence_date DATE NOT NULL,
          reminder_type VARCHAR(20) NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (task_id, occurrence_date, reminder_type)
        )
      `);

      // Migration: Rename in_app_notifications to notifications if it exists (PostgreSQL)
      try {
        await client.query('ALTER TABLE in_app_notifications RENAME TO notifications');
      } catch (err) {
        // Ignore if table doesn't exist or already renamed
      }

      // Migration: Add new columns if they do not exist
      await client.query(`
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS task_id INT NULL REFERENCES tasks(id) ON DELETE CASCADE
      `);
      await client.query(`
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL
      `);

      // Create indexes for performance (PostgreSQL)
      await client.query('CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date)');
      await client.query('CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at)');
      await client.query('CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks (completed)');
      await client.query('CREATE INDEX IF NOT EXISTS notif_user_id_idx ON notifications (user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS notif_task_id_idx ON notifications (task_id)');
      await client.query('CREATE INDEX IF NOT EXISTS notif_is_read_idx ON notifications (is_read)');

      // Create uniqueness indexes for category names (case-insensitive)
      // Safely drop old indexes first to guarantee migration to LOWER(name) is applied
      try {
        await client.query('DROP INDEX IF EXISTS categories_global_name_idx');
        await client.query('DROP INDEX IF EXISTS categories_user_name_idx');
      } catch (err) {
        console.warn('[DB INIT] Non-critical warning dropping old indexes:', err.message);
      }

      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS categories_global_name_idx 
        ON categories (LOWER(name)) WHERE user_id IS NULL
      `);

      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_idx 
        ON categories (user_id, LOWER(name)) WHERE user_id IS NOT NULL
      `);

      // Seed default categories
      const categoryCountResult = await client.query('SELECT COUNT(*) AS count FROM categories WHERE user_id IS NULL');
      if (parseInt(categoryCountResult.rows[0].count, 10) === 0) {
        console.log('[DB INIT] Seeding default categories...');
        const defaults = [
          ['Study', '#3b82f6'],
          ['Work', '#8b5cf6'],
          ['Personal', '#10b981'],
          ['Shopping', '#f97316'],
          ['Health', '#ef4444'],
          ['Other', '#6b7280']
        ];
        for (const [name, color] of defaults) {
          await client.query(
            'INSERT INTO categories (user_id, name, color) VALUES (NULL, $1, $2)',
            [name, color]
          );
        }
      }

      const userCountResult = await client.query('SELECT COUNT(*) AS count FROM users');
      if (parseInt(userCountResult.rows[0].count, 10) === 0) {
        console.warn('[DB INIT] No users exist yet. Please register a new account.');
      }
      console.log(`[DB INIT] PostgreSQL database and tables successfully verified.`);
    } catch (err) {
      console.error(`[DB INIT ERROR] PostgreSQL initialization failed:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}

const db = {
  async execute(sql, params = []) {
    if (isMySQL) {
      try {
        const [rows] = await mysqlPool.execute(sql, params);
        if (sql.trim().toUpperCase().startsWith('INSERT ')) {
          return [{ insertId: rows.insertId, affectedRows: rows.affectedRows }];
        } else if (sql.trim().toUpperCase().startsWith('DELETE ') || sql.trim().toUpperCase().startsWith('UPDATE ')) {
          return [{ affectedRows: rows.affectedRows }];
        }
        return [rows];
      } catch (err) {
        console.error(`[DB QUERY ERROR] MySQL Execution failed:`, err.message);
        throw err;
      }
    } else {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
      
      if (pgSql.trim().toUpperCase().startsWith('INSERT ')) {
        pgSql += ' RETURNING *';
      }

      try {
        const result = await pgPool.query(pgSql, params);

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

        return [result.rows];
      } catch (err) {
        console.error(`[DB QUERY ERROR] SQL Execution failed:`, err.message);
        console.error(`[DB QUERY ERROR] Parsed SQL Command:`, pgSql);
        throw err;
      }
    }
  }
};

export default db;
export { pgPool as pool };
