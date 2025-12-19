const { validationResult } = require('express-validator');
const { searchPortfolios, indexPortfolio, deletePortfolio, getSuggestions } = require('../utils/meilisearch');
const redisClient = require('../utils/redis');

class SearchController {
  // Search portfolios
  async searchPortfolios(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        q, 
        limit = 20, 
        offset = 0, 
        tags, 
        category,
        sort = 'relevance'
      } = req.query;

      // Create cache key
      const cacheKey = `search:${JSON.stringify({ q, limit, offset, tags, category, sort })}`;

      // Try to get from cache first
      try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          return res.json({
            success: true,
            data: JSON.parse(cachedResult),
            cached: true
          });
        }
      } catch (cacheError) {
        console.error('Redis cache error:', cacheError);
      }

      // Search in Meilisearch
      const searchOptions = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        filter: [],
        sort: []
      };

      // Add filters
      if (tags) {
        const tagArray = tags.split(',');
        const tagFilters = tagArray.map(tag => `tags = "${tag.trim()}"`);
        searchOptions.filter.push(`(${tagFilters.join(' OR ')})`);
      }

      if (category) {
        searchOptions.filter.push(`category = "${category}"`);
      }

      // Add sorting
      if (sort === 'date') {
        searchOptions.sort = ['createdAt:desc'];
      } else if (sort === 'views') {
        searchOptions.sort = ['views:desc'];
      } else if (sort === 'likes') {
        searchOptions.sort = ['likes:desc'];
      }

      const results = await searchPortfolios(q, searchOptions);

      // Cache results for 5 minutes
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(results));
      } catch (cacheError) {
        console.error('Redis cache set error:', cacheError);
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  // Get search suggestions
  async getSuggestions(req, res, next) {
    try {
      const { q, limit = 5 } = req.query;

      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: { suggestions: [] }
        });
      }

      const suggestions = await getSuggestions(q, parseInt(limit));

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      next(error);
    }
  }

  // Index portfolio (manual indexing endpoint)
  async indexPortfolio(req, res, next) {
    try {
      const portfolioData = req.body;

      await indexPortfolio(portfolioData);

      res.json({
        success: true,
        message: 'Portfolio indexed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete from index
  async deleteFromIndex(req, res, next) {
    try {
      const { id } = req.params;

      await deletePortfolio(id);

      res.json({
        success: true,
        message: 'Portfolio removed from index'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
