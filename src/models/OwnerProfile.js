const mongoose = require('mongoose');

const ownerProfileSchema = new mongoose.Schema({
    displayName: { type: String, default: "Unknown" },
    ownerImage: { type: String },
    contactPhone: { type: String },
    instagramHandle: { type: String },
    description: { type: String, default: "Travel Consultant / Founder of Aaliya Trip Planners" }
}, { timestamps: true });

module.exports = mongoose.model('OwnerProfile', ownerProfileSchema);
