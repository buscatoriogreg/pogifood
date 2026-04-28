require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { setIO } = require('./socket');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
  path: '/socket.io'
});
setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  socket.on('disconnect', () => {});
});

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
httpServer.listen(PORT, () => console.log(`PogiFood API running on port ${PORT}`));
