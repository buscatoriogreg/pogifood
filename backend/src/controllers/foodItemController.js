const db = require('../config/database');
const { processImage } = require('../utils/processImage');

const buildImageUrl = (filename) =>
  filename ? `${process.env.BASE_URL}/api/uploads/${filename}` : null;

const toBool = (val) => (val === 'false' || val === '0' || val === false || val === 0) ? 0 : 1;

const search = async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = `SELECT fi.*, r.name as restaurant_name, c.name as category_name
               FROM food_items fi
               JOIN restaurants r ON fi.restaurant_id = r.id
               LEFT JOIN categories c ON fi.category_id = c.id
               WHERE fi.is_available = 1 AND r.is_open = 1`;
    const params = [];
    if (q) { sql += ' AND (fi.name LIKE ? OR fi.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (category) { sql += ' AND c.name = ?'; params.push(category); }
    sql += ' ORDER BY fi.name LIMIT 50';

    const [rows] = await db.query(sql, params);
    res.json(rows.map(i => ({ ...i, image: buildImageUrl(i.image) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getByRestaurant = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fi.*, c.name as category_name
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       WHERE fi.restaurant_id = ?
       ORDER BY fi.created_at DESC`,
      [req.params.restaurantId]
    );
    res.json(rows.map(i => ({ ...i, image: buildImageUrl(i.image) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!restaurants.length) return res.status(404).json({ message: 'No restaurant found' });
    const restaurantId = restaurants[0].id;

    const { name, description, price, category_id, is_available } = req.body;
    const image = req.file ? await processImage(req.file.filename) : null;

    const [result] = await db.query(
      'INSERT INTO food_items (restaurant_id, category_id, name, description, price, image, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [restaurantId, category_id || null, name, description || null, price, image, is_available !== undefined ? toBool(is_available) : 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Food item created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!restaurants.length) return res.status(404).json({ message: 'No restaurant found' });

    const [items] = await db.query('SELECT * FROM food_items WHERE id = ? AND restaurant_id = ?', [req.params.id, restaurants[0].id]);
    if (!items.length) return res.status(404).json({ message: 'Food item not found' });

    const { name, description, price, category_id, is_available } = req.body;
    let image = items[0].image;
    if (req.file) image = await processImage(req.file.filename);

    await db.query(
      'UPDATE food_items SET name = ?, description = ?, price = ?, category_id = ?, image = ?, is_available = ? WHERE id = ?',
      [name || items[0].name, description ?? items[0].description, price || items[0].price, category_id || items[0].category_id, image, is_available !== undefined ? toBool(is_available) : items[0].is_available, req.params.id]
    );
    res.json({ message: 'Food item updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!restaurants.length) return res.status(404).json({ message: 'No restaurant found' });

    const [result] = await db.query('DELETE FROM food_items WHERE id = ? AND restaurant_id = ?', [req.params.id, restaurants[0].id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Food item not found' });
    res.json({ message: 'Food item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { search, getByRestaurant, create, update, remove };
