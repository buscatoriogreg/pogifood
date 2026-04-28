const router = require('express').Router();
const upload = require('../middleware/upload');
const { authenticate, requireOwner } = require('../middleware/auth');
const { getAll, getOne, getOwnerRestaurant, update, getCategories } = require('../controllers/restaurantController');

router.get('/', getAll);
router.get('/categories', getCategories);
router.get('/my', authenticate, requireOwner, getOwnerRestaurant);
router.get('/:id', getOne);
router.put('/my', authenticate, requireOwner, upload.single('image'), update);

module.exports = router;
