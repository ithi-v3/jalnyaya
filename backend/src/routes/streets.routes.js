const express = require('express');
const router = express.Router();
const streetsController = require('../controllers/streets.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Public/authenticated read access
router.get('/zones', authenticateToken, streetsController.getZones);
router.get('/', authenticateToken, streetsController.getAllStreets);
router.get('/:id', authenticateToken, streetsController.getStreetById);

// Admin-only write access
router.post('/', authenticateToken, authorizeRoles('ADMIN'), streetsController.createStreet);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), streetsController.updateStreet);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), streetsController.deleteStreet);

module.exports = router;
