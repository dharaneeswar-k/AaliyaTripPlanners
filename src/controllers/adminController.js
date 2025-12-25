const Package = require('../models/Package');
const Transport = require('../models/Transport');
const Gallery = require('../models/Gallery');
const Review = require('../models/Review');
const OwnerProfile = require('../models/OwnerProfile');
const Admin = require('../models/Admin');

const createPackage = async (req, res) => {
    try {
        const newPackage = new Package(req.body);
        const savedPackage = await newPackage.save();
        res.status(201).json(savedPackage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePackage = async (req, res) => {
    try {
        const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPackage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deletePackage = async (req, res) => {
    try {
        await Package.findByIdAndDelete(req.params.id);
        res.json({ message: 'Package removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createTransport = async (req, res) => {
    try {
        const transport = new Transport(req.body);
        const savedTransport = await transport.save();
        res.status(201).json(savedTransport);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateTransport = async (req, res) => {
    try {
        const updatedTransport = await Transport.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTransport);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTransport = async (req, res) => {
    try {
        await Transport.findByIdAndDelete(req.params.id);
        res.json({ message: 'Transport removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createReview = async (req, res) => {
    try {
        const review = new Review(req.body);
        const savedReview = await review.save();
        res.status(201).json(savedReview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOwnerProfile = async (req, res) => {
    try {
        const { displayName, ownerImage, contactPhone, instagramHandle, description } = req.body;
        let profile = await OwnerProfile.findOne();

        if (profile) {
            profile.displayName = displayName || profile.displayName;
            profile.ownerImage = ownerImage || profile.ownerImage;
            profile.contactPhone = contactPhone || profile.contactPhone;
            profile.instagramHandle = instagramHandle || profile.instagramHandle;
            profile.description = description || profile.description;
            await profile.save();
        } else {
            profile = new OwnerProfile({
                displayName, ownerImage, contactPhone, instagramHandle, description
            });
            await profile.save();
        }
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const applyOffer = async (req, res) => {
    try {
        const { target, packageIds, offerText, offerPercent } = req.body;
        let updateQuery = {};
        if (offerPercent > 0) {
            updateQuery = { $set: { offerText, offerPercent } };
        } else {
            updateQuery = {
                $unset: { offerText: "", offerPercent: "" },
                $set: { offerPercent: 0 }
            };
        }

        if (target === 'ALL') {
            await Package.updateMany({}, updateQuery);
        } else if (target === 'SELECTED' && packageIds && packageIds.length > 0) {
            await Package.updateMany({ _id: { $in: packageIds } }, updateQuery);
        } else {
            return res.status(400).json({ message: "Invalid target or no packages selected" });
        }
        res.json({ message: "Offers updated successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const packages = await Package.find({}).sort({ createdAt: -1 });
        const transports = await Transport.find({}).sort({ createdAt: -1 });
        const gallery = await Gallery.find({}).sort({ createdAt: -1 });
        const safeGallery = gallery.map(item => {
            const obj = item.toObject();
            if (!obj.media) obj.media = [];
            return obj;
        });
        const ownerProfile = await OwnerProfile.findOne();

        res.json({
            packages,
            transports,
            gallery: safeGallery,
            ownerProfile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const addGalleryItem = async (req, res) => {
    try {
        const { media, destination, description, customerName } = req.body;

        if (!destination) {
            return res.status(400).json({ message: 'Destination is required' });
        }

        if (!media || !Array.isArray(media) || media.length === 0) {
            return res.status(400).json({ message: 'At least one media item is required' });
        }

        const newItem = new Gallery({
            media,
            destination,
            description,
            customerName
        });

        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

const deleteGalleryItem = async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        await item.deleteOne();
        res.json({ message: 'Gallery item removed' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createPackage, updatePackage, deletePackage,
    createTransport, updateTransport, deleteTransport,
    createReview, deleteReview,
    updateOwnerProfile,
    applyOffer,
    getAdmins, deleteAdmin,
    getDashboardData,
    addGalleryItem, deleteGalleryItem
};
