
const mongoose = require('mongoose');

// Define Schema EXACTLY as I modified it
const gallerySchema = new mongoose.Schema({
    media: [{
        url: { type: String, required: true },
        type: { type: String, required: true, enum: ['image', 'video'] }
    }],
    destination: { type: String, required: true },
    description: { type: String, required: false },
    customerName: { type: String, required: false },
    // Legacy fields
    mediaUrl: { type: String, required: false },
    mediaType: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

// Mock Mongoose Model
const Gallery = mongoose.model('GalleryTest', gallerySchema);

// Mock Query Result (resembling what comes from DB)
const mockDbResult = new Gallery({
    destination: 'Old Trip',
    mediaUrl: 'http://example.com/old.jpg',
    mediaType: 'image'
});

// Simulate Controller Logic
const items = [mockDbResult];

const normalizedItems = items.map(item => {
    const obj = item.toObject();
    console.log("Object after toObject():", obj);

    // Logic from controller
    if ((!obj.media || obj.media.length === 0) && obj.mediaUrl) {
        obj.media = [{ url: obj.mediaUrl, type: obj.mediaType || 'image' }];
    }
    return obj;
});

console.log("Normalized Media:", normalizedItems[0].media);

if (normalizedItems[0].media && normalizedItems[0].media[0].url === 'http://example.com/old.jpg') {
    console.log("PASS: Schema supports legacy fields.");
} else {
    console.log("FAIL: Schema missed legacy fields.");
}
