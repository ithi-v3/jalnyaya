const express = require('express');
const router = express.Router();
const deliveriesController = require('../controllers/deliveries.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, deliveriesController.getAllDeliveries);
router.get('/:id', authenticateToken, deliveriesController.getDeliveryById);

// Admin-only scheduling
router.post('/', authenticateToken, authorizeRoles('ADMIN'), deliveriesController.createDelivery);

// Multi-step Transaction: Operator completes delivery
router.put('/:id/complete', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR'), deliveriesController.completeDeliveryTransaction);

// Resident anti-fraud confirmation/dispute
router.post('/:id/confirm', authenticateToken, authorizeRoles('ADMIN', 'RESIDENT'), deliveriesController.submitDeliveryConfirmation);

// Admin cancel
router.put('/:id/cancel', authenticateToken, authorizeRoles('ADMIN'), deliveriesController.cancelDelivery);

module.exports = router;
