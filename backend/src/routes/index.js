const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const streetsRoutes = require('./streets.routes');
const householdsRoutes = require('./households.routes');
const tankersRoutes = require('./tankers.routes');
const deliveriesRoutes = require('./deliveries.routes');
const complaintsRoutes = require('./complaints.routes');
const waterSourcesRoutes = require('./waterSources.routes');
const analyticsRoutes = require('./analytics.routes');
const paymentsRoutes = require('./payments.routes');
const usersRoutes = require('./users.routes');
const publicRoutes = require('./public.routes');

router.use('/auth', authRoutes);
router.use('/streets', streetsRoutes);
router.use('/households', householdsRoutes);
router.use('/tankers', tankersRoutes);
router.use('/deliveries', deliveriesRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/water-sources', waterSourcesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/users', usersRoutes);
router.use('/public', publicRoutes);

module.exports = router;
