const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    packageType: {
        type: String,
        required: true,
        enum: ['COUPLE', 'COMMON', 'CUSTOMIZED']
    },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: String },
    startingPrice: { type: Number, required: true },
    minPeople: { type: Number },
    description: { type: String },
    itinerary: { type: String },
    inclusions: { type: String },
    exclusions: { type: String },
    image: { type: String },
    images: [{ type: String }],
    offerText: { type: String },
    offerPercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
