import db from '../config/db.js';

function formatCategory(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at
  };
}

const CategoryModel = {
  async getAllByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY id ASC',
      [userId]
    );
    return rows.map(formatCategory);
  },

  async findByName(userId, name) {
    // Check both global categories and the user's custom categories case-insensitively
    const [rows] = await db.execute(
      'SELECT * FROM categories WHERE (user_id IS NULL OR user_id = ?) AND LOWER(name) = LOWER(?)',
      [userId, name.trim()]
    );
    return rows[0] ? formatCategory(rows[0]) : null;
  },

  async create(userId, name, color) {
    const [result] = await db.execute(
      'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
      [userId, name.trim(), color.trim()]
    );
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return formatCategory(rows[0]);
  }
};

export default CategoryModel;
