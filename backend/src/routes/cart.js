const router = require('express').Router();
const { authenticate, requireCustomer } = require('../middleware/auth');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');

router.get('/', authenticate, requireCustomer, getCart);
router.post('/', authenticate, requireCustomer, addItem);
router.put('/:id', authenticate, requireCustomer, updateItem);
router.delete('/clear', authenticate, requireCustomer, clearCart);
router.delete('/:id', authenticate, requireCustomer, removeItem);

module.exports = router;
