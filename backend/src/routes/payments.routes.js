const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, paymentsController.getAllPayments);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), paymentsController.createPayment);

module.exports = router;
