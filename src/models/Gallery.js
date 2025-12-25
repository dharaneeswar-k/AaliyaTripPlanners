const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    media: [{
        url: { type: String, required: true },
        type: { type: String, required: true, enum: ['image', 'video'] }
    }],
    destination: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    customerName: {
        type: String,
        required: false
    },
    // Retaining legacy fields as optional but deprecated for potential existing data recovery
    mediaUrl: { type: String, select: false },
    mediaType: { type: String, select: false },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gallery', gallerySchema);
