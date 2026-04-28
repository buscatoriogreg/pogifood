const db = require('../config/database');
const { getIO } = require('../socket');
const { sendPushNotification } = require('../utils/push');

const buildImageUrl = (filename) =>
  filename ? `${process.env.BASE_URL}/api/uploads/${filename}` : null;

const placeOrder = async (req, res) => {
  try {
    const { delivery_address, notes } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [cartItems] = await conn.query(
        `SELECT c.quantity, fi.id as food_item_id, fi.name, fi.price, fi.restaurant_id, fi.is_available
         FROM cart c
         JOIN food_items fi ON c.food_item_id = fi.id
         WHERE c.user_id = ?`,
        [req.user.id]
      );

      if (!cartItems.length) return res.status(400).json({ message: 'Cart is empty' });

      const unavailable = cartItems.filter(i => !i.is_available);
      if (unavailable.length) {
        return res.status(400).json({ message: `${unavailable[0].name} is no longer available` });
      }

      const restaurantId = cartItems[0].restaurant_id;
      const mixedRestaurants = cartItems.some(i => i.restaurant_id !== restaurantId);
      if (mixedRestaurants) return res.status(400).json({ message: 'Cart contains items from multiple restaurants' });

      const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const [orderResult] = await conn.query(
        'INSERT INTO orders (user_id, restaurant_id, delivery_address, total_amount, notes) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, restaurantId, delivery_address, totalAmount, notes || null]
      );
      const orderId = orderResult.insertId;

      for (const item of cartItems) {
        await conn.query(
          'INSERT INTO order_items (order_id, food_item_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.food_item_id, item.name, item.quantity, item.price]
        );
      }

      await conn.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
      await conn.commit();

      res.status(201).json({ id: orderId, message: 'Order placed successfully', total_amount: totalAmount });
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

const getCustomerOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.image as restaurant_image
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    for (const order of orders) {
      order.restaurant_image = buildImageUrl(order.restaurant_image);
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCustomerOrder = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.image as restaurant_image, r.address as restaurant_address
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });

    const order = orders[0];
    order.restaurant_image = buildImageUrl(order.restaurant_image);
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerOrders = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT id FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (!restaurants.length) return res.status(404).json({ message: 'No restaurant found' });

    const { status } = req.query;
    let sql = `SELECT o.*, u.name as customer_name, u.phone as customer_phone
               FROM orders o
               JOIN users u ON o.user_id = u.id
               WHERE o.restaurant_id = ?`;
    const params = [restaurants[0].id];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';

    const [orders] = await db.query(sql, params);
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  preparing: 'Being Prepared',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Order Cancelled',
};

const updateOrderStatus = async (req, res) => {
  try {
    const [restaurants] = await db.query(
      'SELECT r.id, r.name FROM restaurants r WHERE r.owner_id = ?',
      [req.user.id]
    );
    if (!restaurants.length) return res.status(404).json({ message: 'No restaurant found' });

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?',
      [status, req.params.id, restaurants[0].id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found' });

    // Fetch the order owner's push token
    const [orders] = await db.query(
      'SELECT o.user_id, u.push_token FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [req.params.id]
    );
    if (orders.length) {
      const { user_id, push_token } = orders[0];
      const restaurantName = restaurants[0].name;
      const orderId = req.params.id;

      // Real-time socket event (for when app is open)
      getIO()?.to(`user:${user_id}`).emit('order:status_updated', {
        orderId: Number(orderId),
        status,
        restaurantName,
      });

      // Push notification (for background/closed app)
      await sendPushNotification(push_token, {
        title: `${STATUS_LABELS[status] ?? status} 🍜`,
        body: `Your order #${orderId} from ${restaurantName} is now: ${status.replace(/_/g, ' ')}`,
        data: { orderId: Number(orderId), status },
      });
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder, getCustomerOrders, getCustomerOrder, getOwnerOrders, updateOrderStatus };
