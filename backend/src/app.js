require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/food-items', require('./routes/foodItems'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'PogiFood API' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`PogiFood API running on port ${PORT}`));
