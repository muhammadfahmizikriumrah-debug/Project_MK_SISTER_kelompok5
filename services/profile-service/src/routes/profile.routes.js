const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profile.controller');

// Validation rules
const updateProfileValidation = [
  body('bio').optional().isLength({ max: 1000 }),
  body('title').optional().isLength({ max: 100 }),
  body('institution').optional().isLength({ max: 200 }),
  body('phone').optional().isMobilePhone(),
  body('website').optional().isURL()
];

// Routes
router.get('/user/:userId', profileController.getProfileByUserId);
router.get('/public/:username', profileController.getPublicProfile);
router.post('/', profileController.createProfile);
router.put('/:userId', updateProfileValidation, profileController.updateProfile);
router.delete('/:userId', profileController.deleteProfile);
router.post('/:userId/view', profileController.incrementView);

module.exports = router;
