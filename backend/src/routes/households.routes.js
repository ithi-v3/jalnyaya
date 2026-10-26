const express = require('express');
const router = express.Router();
const householdsController = require('../controllers/households.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, householdsController.getAllHouseholds);
router.get('/:id', authenticateToken, householdsController.getHouseholdById);

// Admin-only management
router.post('/', authenticateToken, authorizeRoles('ADMIN'), householdsController.createHousehold);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), householdsController.updateHousehold);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), householdsController.deleteHousehold);

module.exports = router;
