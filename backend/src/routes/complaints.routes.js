const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaints.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/sla-report', authenticateToken, complaintsController.getSlaReport);
router.get('/', authenticateToken, complaintsController.getAllComplaints);
router.get('/:id', authenticateToken, complaintsController.getComplaintById);

// Resident can lodge complaints
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'RESIDENT'), complaintsController.createComplaint);

// Admin can assign operator
router.put('/:id/assign', authenticateToken, authorizeRoles('ADMIN'), complaintsController.assignOperator);

// Admin or assigned operator can resolve complaint
router.put('/:id/resolve', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR'), complaintsController.resolveComplaint);

module.exports = router;
