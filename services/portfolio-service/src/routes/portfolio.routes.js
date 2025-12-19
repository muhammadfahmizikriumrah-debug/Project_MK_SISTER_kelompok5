const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const portfolioController = require('../controllers/portfolio.controller');
const commentController = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Validation rules
const createPortfolioValidation = [
  body('title').notEmpty(),
  body('description').optional(),
  body('category').optional(),
  body('tags').optional()
];

const updatePortfolioValidation = [
  body('title').optional().isLength({ min: 3, max: 200 }),
  body('description').optional().isLength({ max: 5000 })
];

// Routes
router.get('/', portfolioController.getAllPortfolios);
router.get('/user/:userId', portfolioController.getPortfoliosByUser);
router.get('/public/:username', portfolioController.getPublicPortfolios);
router.post('/admin/reindex', portfolioController.reindexAllPortfolios);
router.get('/:id', portfolioController.getPortfolioById);
router.post('/', authenticate, createPortfolioValidation, portfolioController.createPortfolio);
router.put('/:id', authenticate, updatePortfolioValidation, portfolioController.updatePortfolio);
router.delete('/:id', authenticate, portfolioController.deletePortfolio);
router.post('/:id/view', portfolioController.incrementView);
router.post('/:id/like', authenticate, portfolioController.toggleLike);
router.get('/:id/like/check', portfolioController.checkUserLike);

// Comments
router.get('/:id/comments', commentController.getComments.bind(commentController));
router.post(
  '/:id/comments',
  authenticate,
  commentController.validationRules(),
  commentController.createComment.bind(commentController)
);
router.delete(
  '/:id/comments/:commentId',
  authenticate,
  commentController.deleteComment.bind(commentController)
);

module.exports = router;
