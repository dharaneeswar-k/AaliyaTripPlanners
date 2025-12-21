const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createPackage, updatePackage, deletePackage,
    createTransport, updateTransport, deleteTransport,
    createReview, deleteReview,
    updateOwnerProfile,
    applyOffer,
    getAdmins, deleteAdmin,
    getDashboardData
} = require('../controllers/adminController');
const { createAdmin } = require('../controllers/authController');

const { getEnquiries, updateEnquiryStatus } = require('../controllers/enquiryController');


router.post('/create-admin', protect, createAdmin);
router.get('/admins', protect, getAdmins);
router.delete('/admins/:id', protect, deleteAdmin);


router.get('/enquiries', protect, getEnquiries);
router.put('/enquiries/:id', protect, updateEnquiryStatus);


router.post('/packages', protect, createPackage);
router.put('/packages/:id', protect, updatePackage);
router.delete('/packages/:id', protect, deletePackage);
router.post('/packages/offer', protect, applyOffer);


router.post('/transports', protect, createTransport);
router.put('/transports/:id', protect, updateTransport);
router.delete('/transports/:id', protect, deleteTransport);


router.post('/reviews', protect, createReview);
router.delete('/reviews/:id', protect, deleteReview);


router.put('/profile', protect, updateOwnerProfile);


router.get('/dashboard-data', protect, getDashboardData);

module.exports = router;
