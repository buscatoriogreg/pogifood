const router = require('express').Router();
const upload = require('../middleware/upload');
const { authenticate, requireOwner } = require('../middleware/auth');
const { search, getByRestaurant, create, update, remove } = require('../controllers/foodItemController');

router.get('/search', search);
router.get('/restaurant/:restaurantId', getByRestaurant);
router.post('/', authenticate, requireOwner, upload.single('image'), create);
router.put('/:id', authenticate, requireOwner, upload.single('image'), update);
router.delete('/:id', authenticate, requireOwner, remove);

module.exports = router;
