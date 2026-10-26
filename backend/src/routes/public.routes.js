const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Public route: NO authentication required
router.get('/transparency', publicController.getPublicTransparencyData);

module.exports = router;
