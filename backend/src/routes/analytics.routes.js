const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Public/authenticated view access
router.get('/fairness', authenticateToken, analyticsController.getStreetFairness);
router.get('/fewest-deliveries', authenticateToken, analyticsController.getFewestDeliveries);
router.get('/priority-schedule', authenticateToken, analyticsController.getDeliveryPriority);
router.get('/operator-disputes', authenticateToken, analyticsController.getOperatorDisputes);

// Dashboards
router.get('/dashboard/admin', authenticateToken, authorizeRoles('ADMIN'), analyticsController.getAdminDashboard);
router.get('/dashboard/resident', authenticateToken, authorizeRoles('RESIDENT', 'ADMIN'), analyticsController.getResidentDashboard);
router.get('/dashboard/operator', authenticateToken, authorizeRoles('OPERATOR', 'ADMIN'), analyticsController.getOperatorDashboard);

// Stored Procedure Trigger (Admin only)
router.post('/recalculate-fairness', authenticateToken, authorizeRoles('ADMIN'), analyticsController.recalculateFairnessProcedure);

module.exports = router;
