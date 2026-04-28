const db = require('../config/database');

const buildImageUrl = (filename) =>
  filename ? `${process.env.BASE_URL}/api/uploads/${filename}` : null;

const getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.quantity, fi.id as food_item_id, fi.name, fi.price, fi.image,
              fi.is_available, r.id as restaurant_id, r.name as restaurant_name
       FROM cart c
       JOIN food_items fi ON c.food_item_id = fi.id
       JOIN restaurants r ON fi.restaurant_id = r.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json(rows.map(i => ({ ...i, image: buildImageUrl(i.image) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { food_item_id, quantity } = req.body;
    const [items] = await db.query('SELECT * FROM food_items WHERE id = ? AND is_available = 1', [food_item_id]);
    if (!items.length) return res.status(404).json({ message: 'Food item not available' });

    await db.query(
      'INSERT INTO cart (user_id, food_item_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
      [req.user.id, food_item_id, quantity || 1, quantity || 1]
    );
    res.json({ message: 'Item added to cart' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      return res.json({ message: 'Item removed' });
    }
    await db.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeItem = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
