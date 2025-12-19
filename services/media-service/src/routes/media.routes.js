const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/media.controller');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and videos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
    }
  }
});

// Routes
router.post('/upload', upload.single('file'), mediaController.uploadFile);
router.get('/:id', mediaController.getMediaById);
router.get('/user/:userId', mediaController.getMediaByUser);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
