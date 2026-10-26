const express = require('express');
const router = express.Router();
const tankersController = require('../controllers/tankers.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, tankersController.getAllTankers);
router.get('/:id', authenticateToken, tankersController.getTankerById);

// Admin-only management
router.post('/', authenticateToken, authorizeRoles('ADMIN'), tankersController.createTanker);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'OPERATOR'), tankersController.updateTanker);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), tankersController.deleteTanker);

module.exports = router;
