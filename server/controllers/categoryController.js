import CategoryModel from '../models/categoryModel.js';

export async function getCategories(req, res) {
  try {
    const categories = await CategoryModel.getAllByUser(req.user.id);
    res.json(categories);
  } catch (err) {
    console.error('GetCategories error:', err);
    res.status(500).json({ error: 'Failed to load categories.' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    if (!color || !color.trim()) {
      return res.status(400).json({ error: 'Category color is required.' });
    }

    const trimmedName = name.trim();
    const trimmedColor = color.trim();

    if (trimmedName.length > 50) {
      return res.status(400).json({ error: 'Category name must be at most 50 characters.' });
    }
    if (trimmedColor.length > 20) {
      return res.status(400).json({ error: 'Category color must be at most 20 characters.' });
    }

    // Check uniqueness (case-insensitive)
    const existing = await CategoryModel.findByName(req.user.id, trimmedName);
    if (existing) {
      return res.status(400).json({ error: 'Category name already exists.' });
    }

    const category = await CategoryModel.create(req.user.id, trimmedName, trimmedColor);
    res.status(201).json(category);
  } catch (err) {
    console.error('CreateCategory error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
}
