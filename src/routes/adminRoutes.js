// src/routes/adminRoutes.js
//
// Tất cả route /api/admin/* đều yêu cầu:
//   1. verifySession  — kiểm tra session cookie hợp lệ
//   2. requireAdmin   — kiểm tra role === 'admin'

const express = require('express');
const router = express.Router();

const verifySession = require('../middlewares/verifySession');
const requireRole = require('../middlewares/requireRole');

const userCtrl    = require('../controllers/admin/adminUserController');
const classCtrl   = require('../controllers/admin/adminClassController');
const bookingCtrl = require('../controllers/admin/adminBookingController');
const contentCtrl = require('../controllers/admin/adminContentController');
const catalogCtrl = require('../controllers/admin/adminCatalogController');
const revenueCtrl = require('../controllers/admin/adminRevenueController');


// Tất cả routes /api/admin/* chỉ dành cho admin
router.use(verifySession);
router.use(requireRole('admin'));

// ══════════════════════════════════════════════════════
//  USERS & PTs
// ══════════════════════════════════════════════════════
router.get   ('/users',                userCtrl.getUsers);
router.get   ('/users/:uid',           userCtrl.getUserById);
router.patch ('/users/:uid',           userCtrl.updateUser);
router.delete('/users/:uid',           userCtrl.deleteUser);

router.get   ('/pts',                  userCtrl.getPTs);
router.get   ('/pts/:ptId',            userCtrl.getPTById);
router.patch ('/pts/:ptId',            userCtrl.updatePT);

router.get   ('/pt-applications',      userCtrl.getPTApplications);
router.patch ('/pt-applications/:id',  userCtrl.reviewPTApplication);

// ══════════════════════════════════════════════════════
//  CLASSES
// ══════════════════════════════════════════════════════
router.get   ('/classes',              classCtrl.getClasses);
router.get   ('/classes/:classId',     classCtrl.getClassById);
router.post  ('/classes',              classCtrl.createClass);
router.patch ('/classes/:classId',     classCtrl.updateClass);

// ══════════════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════════════
router.get   ('/bookings',             bookingCtrl.getBookings);
router.get   ('/bookings/:bookingId',  bookingCtrl.getBookingById);
router.patch ('/bookings/:bookingId',  bookingCtrl.updateBookingStatus);
router.post('/bookings', bookingCtrl.createBooking);

// ══════════════════════════════════════════════════════
//  CONTENT (trang chủ)
// ══════════════════════════════════════════════════════
router.get   ('/gym-info',             contentCtrl.getGymInfo);
router.put   ('/gym-info',             contentCtrl.updateGymInfo);

router.get   ('/gym-settings/:docId',  contentCtrl.getGymSetting);
router.patch ('/gym-settings/:docId',  contentCtrl.updateGymSetting);

router.get   ('/banners',              contentCtrl.getBanners);
router.post  ('/banners',              contentCtrl.createBanner);
router.patch ('/banners/:bannerId',    contentCtrl.updateBanner);
router.delete('/banners/:bannerId',    contentCtrl.deleteBanner);

router.get   ('/pt-info',              contentCtrl.getPtInfo);
router.put   ('/pt-info',              contentCtrl.updatePtInfo);

router.get   ('/zones',                contentCtrl.getZones);
router.post  ('/zones',                contentCtrl.createZone);
router.patch ('/zones/:zoneId',        contentCtrl.updateZone);
router.delete('/zones/:zoneId',        contentCtrl.deleteZone);

// ══════════════════════════════════════════════════════
//  CATALOG (gói tập, dịch vụ PT, thiết bị)
// ══════════════════════════════════════════════════════
router.get   ('/memberships',          catalogCtrl.getMemberships);
router.post  ('/memberships',          catalogCtrl.createMembership);
router.patch ('/memberships/:id',      catalogCtrl.updateMembership);
router.delete('/memberships/:id',      catalogCtrl.deleteMembership);

router.get   ('/pt-services',          catalogCtrl.getPTServices);
router.post  ('/pt-services',          catalogCtrl.createPTService);   // Thêm mới route POST
router.patch ('/pt-services/:id',      catalogCtrl.updatePTService);
router.delete('/pt-services/:id',      catalogCtrl.deletePTService);   // Thêm mới route DELETE

router.get   ('/equipment',            catalogCtrl.getEquipments);
router.post  ('/equipment',            catalogCtrl.createEquipment);
router.patch ('/equipment/:id',        catalogCtrl.updateEquipment);
router.delete('/equipment/:id',        catalogCtrl.deleteEquipment);

// ══════════════════════════════════════════════════════
//  REVENUE
// ══════════════════════════════════════════════════════
router.get   ('/revenue/summary',      revenueCtrl.getRevenueSummary);
router.get   ('/revenue',              revenueCtrl.getRevenue);


module.exports = router;
