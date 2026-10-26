const express = require('express');
const router = express.Router();
const waterSourcesController = require('../controllers/waterSources.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/trends', authenticateToken, waterSourcesController.getWaterTrends);
router.get('/alerts', authenticateToken, waterSourcesController.getAlerts);
router.put('/alerts/:id/resolve', authenticateToken, authorizeRoles('ADMIN'), waterSourcesController.resolveAlert);

router.get('/', authenticateToken, waterSourcesController.getAllWaterSources);
router.get('/:id', authenticateToken, waterSourcesController.getWaterSourceById);

// Admin-only management
router.post('/', authenticateToken, authorizeRoles('ADMIN'), waterSourcesController.createWaterSource);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), waterSourcesController.updateWaterSource);

// Add reading (triggers automated depletion warning / alert)
router.post('/:id/readings', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR'), waterSourcesController.addWaterLevelReading);

module.exports = router;
