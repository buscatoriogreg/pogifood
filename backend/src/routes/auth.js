const router = require('express').Router();
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { register, ownerRegister, login, getProfile, updateProfile, savePushToken } = require('../controllers/authController');

router.post('/register', register);
router.post('/owner/register', upload.single('restaurant_image'), ownerRegister);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/push-token', authenticate, savePushToken);

module.exports = router;
