const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aaliya-tripplanners', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi', 'webm'],
        resource_type: 'auto', // Auto-detect image or video
        transformation: [{ width: 1000, crop: "limit" }] // Optional: resize large images
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
