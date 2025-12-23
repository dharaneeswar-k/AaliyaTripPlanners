const Enquiry = require('../models/Enquiry');

const createEnquiry = async (req, res) => {
    try {
        const {
            enquiryType,
            packageType,
            packageId,
            transportId,
            pickupLocation,
            dropLocation,
            destination,
            duration,
            peopleCount,
            travelDate,
            name,
            phone,
            message
        } = req.body;

        const enquiry = new Enquiry({
            enquiryType,
            packageType,
            packageId,
            transportId,
            pickupLocation,
            dropLocation,
            destination,
            duration,
            peopleCount,
            travelDate,
            customerName: name,
            contact: phone,
            message
        });

        const createdEnquiry = await enquiry.save();
        res.status(201).json(createdEnquiry);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid enquiry data' });
    }
};

const getEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.find({})
            .sort({ createdAt: -1 })
            .populate('packageId', 'title')
            .populate('transportId', 'name');
        res.json(enquiries);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateEnquiryStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    ...(status && { status }),
                    ...(notes && { notes })
                }
            },
            { new: true, runValidators: true }
        );

        if (updatedEnquiry) {
            res.json(updatedEnquiry);
        } else {
            res.status(404).json({ message: 'Enquiry not found' });
        }
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

module.exports = { createEnquiry, getEnquiries, updateEnquiryStatus };
