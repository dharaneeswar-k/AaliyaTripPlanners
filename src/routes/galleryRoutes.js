const express = require('express');
const router = express.Router();
const { getAllGalleryItems, addGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllGalleryItems);
router.post('/', protect, addGalleryItem);
router.delete('/:id', protect, deleteGalleryItem);

module.exports = router;
