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
  }
};

export default UserModel;
