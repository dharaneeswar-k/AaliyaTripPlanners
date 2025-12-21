const express = require('express');
const router = express.Router();
const { loginAdmin, createAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/create', protect, createAdmin); // Protected route to create new admins

module.exports = router;
