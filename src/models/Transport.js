const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    pricePerKm: { type: Number, required: true, default: 0 },
    image: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);
