/**
 * User Model — MySQL authentication support.
 */

import db from '../config/db.js';

function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at
  };
}

const UserModel = {
  async create(data) {
    const { name, email, password } = data;
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return formatUser(rows[0]);
  },

  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? formatUser(rows[0]) : null;
  },

  async setResetOTP(userId, otp, expiresAt) {
    await db.execute(
      'UPDATE users SET reset_otp = ?, reset_otp_expires = ?, reset_otp_attempts = 0, reset_otp_verified = 0 WHERE id = ?',
      [otp, expiresAt, userId]
    );
  },

  async incrementResetOTPAttempts(userId) {
    await db.execute(
      'UPDATE users SET reset_otp_attempts = reset_otp_attempts + 1 WHERE id = ?',
      [userId]
    );
  },

  async markOTPVerified(userId) {
    await db.execute(
      'UPDATE users SET reset_otp_verified = 1 WHERE id = ?',
      [userId]
    );
  },

  async setResetToken(userId, token, expiresAt) {
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ?, reset_otp_verified = 1, reset_otp = NULL, reset_otp_expires = NULL, reset_otp_attempts = 0 WHERE id = ?',
      [token, expiresAt, userId]
    );
  },

  async updatePassword(userId, hashedPassword) {
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  },

  async clearResetOTP(userId) {
    await db.execute(
      'UPDATE users SET reset_otp = NULL, reset_otp_expires = NULL, reset_otp_attempts = 0, reset_otp_verified = 0, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [userId]
    );
  }
};

export default UserModel;
