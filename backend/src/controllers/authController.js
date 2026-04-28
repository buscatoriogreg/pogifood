const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, address || null, 'customer']
    );
    const user = { id: result.insertId, name, email, role: 'customer' };
    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ownerRegister = async (req, res) => {
  try {
    const { name, email, password, phone, restaurantName, restaurantDescription, restaurantAddress } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashed, phone || null, 'owner']
      );
      const ownerId = userResult.insertId;

      let imagePath = null;
      if (req.file) imagePath = req.file.filename;

      await conn.query(
        'INSERT INTO restaurants (owner_id, name, description, address, image) VALUES (?, ?, ?, ?, ?)',
        [ownerId, restaurantName, restaurantDescription || null, restaurantAddress || null, imagePath]
      );
      await conn.commit();

      const user = { id: ownerId, name, email, role: 'owner' };
      res.status(201).json({ token: generateToken(user), user });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(user), user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await db.query('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const savePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;
    await db.query('UPDATE users SET push_token = ? WHERE id = ?', [push_token || null, req.user.id]);
    res.json({ message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, ownerRegister, login, getProfile, updateProfile, savePushToken };
