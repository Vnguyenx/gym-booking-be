// src/routes/customerRoutes.js
const express = require('express');
const router = express.Router();

const verifySession = require('../middlewares/verifySession');
const { getMyBookings, getMyClasses, updateProfile, cancelBooking, getPTs, checkin} = require('../controllers/customerController');

router.use(verifySession);

router.get('/bookings',              getMyBookings);
router.get('/classes',               getMyClasses);
router.put('/profile',               updateProfile);
router.patch('/bookings/:id/cancel', cancelBooking);
router.get('/pts', getPTs);
router.post('/checkin',              checkin);

module.exports = router;