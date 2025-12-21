const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    enquiryType: {
        type: String,
        required: true,
        enum: ['PACKAGE', 'ROOM', 'TRANSPORT', 'CUSTOM', 'COUPLE_PACKAGE', 'COMMON_PACKAGE']
    },

    packageType: { type: String },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },


    transportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transport' },

    pickupLocation: { type: String },
    dropLocation: { type: String },


    destination: { type: String },
    duration: { type: String },
    peopleCount: { type: Number },
    travelDate: { type: Date },
    customerName: { type: String, required: true },
    contact: { type: String, required: true },
    message: { type: String },

    status: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'CONTACTED', 'CONVERTED', 'CLOSED']
    },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
