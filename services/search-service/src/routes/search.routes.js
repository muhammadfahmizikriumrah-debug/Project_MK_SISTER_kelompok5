const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const searchController = require('../controllers/search.controller');

// Validation rules
const searchValidation = [
  query('q').notEmpty().isLength({ min: 1, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

// Routes
router.get('/portfolios', searchValidation, searchController.searchPortfolios);
router.get('/suggestions', searchController.getSuggestions);
router.post('/index', searchController.indexPortfolio);
router.delete('/index/:id', searchController.deleteFromIndex);

module.exports = router;
