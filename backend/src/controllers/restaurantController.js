const db = require('../config/database');

const buildImageUrl = (req, filename) =>
  filename ? `${process.env.BASE_URL}/api/uploads/${filename}` : null;

const toBool = (val) => (val === 'false' || val === '0' || val === false || val === 0) ? 0 : 1;

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.name as owner_name FROM restaurants r JOIN users u ON r.owner_id = u.id WHERE r.is_open = 1 ORDER BY r.name'
    );
    const restaurants = rows.map(r => ({ ...r, image: buildImageUrl(req, r.image) }));
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT r.*, u.name as owner_name FROM restaurants r JOIN users u ON r.owner_id = u.id WHERE r.id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Restaurant not found' });

    const restaurant = { ...rows[0], image: buildImageUrl(req, rows[0].image) };

    const [items] = await db.query(
      `SELECT fi.*, c.name as category_name
       FROM food_items fi
       LEFT JOIN categories c ON fi.category_id = c.id
       WHERE fi.restaurant_id = ? AND fi.is_available = 1
       ORDER BY c.name, fi.name`,
      [id]
    );
    restaurant.food_items = items.map(i => ({ ...i, image: buildImageUrl(req, i.image) }));
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerRestaurant = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'No restaurant found' });
    const restaurant = { ...rows[0], image: buildImageUrl(req, rows[0].image) };
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, description, address, is_open } = req.body;
    const [rows] = await db.query('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Restaurant not found' });

    let image = rows[0].image;
    if (req.file) image = req.file.filename;

    await db.query(
      'UPDATE restaurants SET name = ?, description = ?, address = ?, is_open = ?, image = ? WHERE owner_id = ?',
      [name || rows[0].name, description ?? rows[0].description, address ?? rows[0].address, is_open !== undefined ? toBool(is_open) : rows[0].is_open, image, req.user.id]
    );
    res.json({ message: 'Restaurant updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getOne, getOwnerRestaurant, update, getCategories };
