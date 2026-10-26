const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// All user management routes restricted to ADMIN
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
