const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');

// Validation rules
const updateUserValidation = [
  body('firstName').optional().trim().isLength({ min: 0, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 0, max: 50 }),
  body('email').optional().isEmail(),
  body('username').optional().trim().isLength({ min: 0, max: 50 }),
  body('bio').optional().trim(),
  body('phone').optional().trim().isLength({ min: 0, max: 20 }),
  body('website').optional().trim(),
  body('location').optional().trim().isLength({ min: 0, max: 100 }),
  body('university').optional().trim().isLength({ min: 0, max: 100 }),
  body('department').optional().trim().isLength({ min: 0, max: 100 }),
  body('position').optional().trim().isLength({ min: 0, max: 100 })
];

// Routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.get('/username/:username', userController.getUserByUsername);
router.put('/:id', updateUserValidation, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/', userController.createUser);

module.exports = router;
