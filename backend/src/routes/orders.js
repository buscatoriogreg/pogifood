const router = require('express').Router();
const { authenticate, requireCustomer, requireOwner } = require('../middleware/auth');
const { placeOrder, getCustomerOrders, getCustomerOrder, getOwnerOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/', authenticate, requireCustomer, placeOrder);
router.get('/my', authenticate, requireCustomer, getCustomerOrders);
router.get('/my/:id', authenticate, requireCustomer, getCustomerOrder);
router.get('/owner', authenticate, requireOwner, getOwnerOrders);
router.put('/owner/:id/status', authenticate, requireOwner, updateOrderStatus);

module.exports = router;
