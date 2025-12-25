const Gallery = require('../models/Gallery');

// @desc    Get all gallery items
// @route   GET /api/public/gallery or /api/gallery
// @access  Public
const getAllGalleryItems = async (req, res) => {
    try {
        // Fetch all items
        const items = await Gallery.find().sort({ createdAt: -1 });

        // Return strictly the array format
        // If there's legacy data lingering in the specific documents returned, strict schema might mask it
        // but we want to ensure the frontend gets 'media' array.
        // We will assume data is valid or the manual check updates it.
        // Since I'm "rebuilding", I'll rely on the new add function to be correct.
        // However, to keep the "remove errors" promise, I'll ensure safety.

        const safeItems = items.map(item => {
            const obj = item.toObject();
            if (!obj.media || obj.media.length === 0) {
                // Fallback if somehow legacy data exists and was selected (though it defaults to false now)
                // or just return empty media to prevent crash
                obj.media = [];
            }
            return obj;
        });

        res.json(safeItems);
    } catch (error) {
        console.error("Fetch Gallery Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add new gallery item
// @route   POST /api/gallery
// @access  Private (Admin)
const addGalleryItem = async (req, res) => {
    try {
        const { media, destination, description, customerName } = req.body;

        if (!destination) {
            return res.status(400).json({ message: 'Destination/Title is required' });
        }

        if (!media || !Array.isArray(media) || media.length === 0) {
            return res.status(400).json({ message: 'At least one image or video is required' });
        }

        const galleryItem = new Gallery({
            media,
            destination,
            description,
            customerName
        });

        const savedItem = await galleryItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error("Add Gallery Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteGalleryItem = async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Gallery item not found' });
        }

        await item.deleteOne();
        res.json({ message: 'Gallery item removed' });
    } catch (error) {
        console.error("Delete Gallery Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllGalleryItems,
    addGalleryItem,
    deleteGalleryItem
};
