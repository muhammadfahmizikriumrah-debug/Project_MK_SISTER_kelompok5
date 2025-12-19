const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('email').notEmpty(),
  body('username').notEmpty(),
  body('password').notEmpty()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/verify', authenticate, authController.verifyToken);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
