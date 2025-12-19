const { validationResult } = require('express-validator');
const { Portfolio, PortfolioLike } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const { publishToSearchIndex } = require('../utils/rabbitmq');

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3006';

class PortfolioController {
  // Get all portfolios with pagination and filters
  async getAllPortfolios(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        tags, 
        category,
        status = 'published',
        isPublic = true
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { status };

      if (isPublic !== undefined) {
        where.isPublic = isPublic === 'true';
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (tags) {
        const tagArray = tags.split(',');
        where.tags = {
          [Op.overlap]: tagArray
        };
      }

      if (category) {
        where.category = category;
      }

      const { count, rows } = await Portfolio.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          portfolios: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get portfolio by ID
  async getPortfolioById(req, res, next) {
    try {
      const { id } = req.params;

      const portfolio = await Portfolio.findByPk(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      next(error);
    }
  }

  // Get portfolios by user ID
  async getPortfoliosByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, isPublic } = req.query;

      const where = { userId };

      if (status) {
        where.status = status;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic === 'true';
      }

      const portfolios = await Portfolio.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: portfolios
      });
    } catch (error) {
      next(error);
    }
  }

  // Get public portfolios by username
  async getPublicPortfolios(req, res, next) {
    try {
      const { username } = req.params;

      // Get user by username from user service
      const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
      const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/username/${username}`);
      const user = userResponse.data.data;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const portfolios = await Portfolio.findAll({
        where: {
          userId: user.id,
          status: 'published',
          isPublic: true
        },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          user: {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
          },
          portfolios
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      next(error);
    }
  }

  // Create portfolio
  async createPortfolio(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const portfolioData = {
        ...req.body,
        userId: req.user.userId, // Use authenticated user ID
        status: req.body.status || 'published',
        isPublic: req.body.isPublic !== false
      };

      const portfolio = await Portfolio.create(portfolioData);

      // Publish to search index (async via RabbitMQ)
      if (portfolio.status === 'published' && portfolio.isPublic) {
        await publishToSearchIndex({
          action: 'index',
          portfolio: portfolio.toJSON()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully',
        data: portfolio
      });
    } catch (error) {
      next(error);
    }
  }

  // Update portfolio
  async updatePortfolio(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      const portfolio = await Portfolio.findByPk(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      await portfolio.update(updateData);

      // Update search index
      if (portfolio.status === 'published' && portfolio.isPublic) {
        await publishToSearchIndex({
          action: 'update',
          portfolio: portfolio.toJSON()
        });
      } else {
        // Remove from search if unpublished or made private
        await publishToSearchIndex({
          action: 'delete',
          portfolioId: portfolio.id
        });
      }

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: portfolio
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete portfolio
  async deletePortfolio(req, res, next) {
    try {
      const { id } = req.params;

      const portfolio = await Portfolio.findByPk(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      await portfolio.destroy();

      // Remove from search index
      await publishToSearchIndex({
        action: 'delete',
        portfolioId: id
      });

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Increment view count (no auth required, guest can view)
  async incrementView(req, res, next) {
    try {
      const { id } = req.params;

      const portfolio = await Portfolio.findByPk(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      await portfolio.increment('views');
      await portfolio.reload();

      res.json({
        success: true,
        message: 'View count incremented',
        data: { views: portfolio.views }
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle like (requires authentication)
  async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?.userId;

      // Check if user is authenticated
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to like portfolio'
        });
      }

      const portfolio = await Portfolio.findByPk(id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Check if user already liked this portfolio
      const existingLike = await PortfolioLike.findOne({
        where: { portfolioId: id, userId }
      });

      if (existingLike) {
        // Unlike: remove the like record
        await existingLike.destroy();
        await portfolio.decrement('likes');
        await portfolio.reload();

        return res.json({
          success: true,
          message: 'Portfolio unliked successfully',
          data: { 
            likes: portfolio.likes,
            isLiked: false
          }
        });
      } else {
        // Like: create new like record
        await PortfolioLike.create({
          portfolioId: id,
          userId
        });
        await portfolio.increment('likes');
        await portfolio.reload();

        return res.json({
          success: true,
          message: 'Portfolio liked successfully',
          data: { 
            likes: portfolio.likes,
            isLiked: true
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Check if user liked a portfolio
  async checkUserLike(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        return res.json({
          success: true,
          data: { isLiked: false }
        });
      }

      const like = await PortfolioLike.findOne({
        where: { portfolioId: id, userId }
      });

      res.json({
        success: true,
        data: { isLiked: !!like }
      });
    } catch (error) {
      next(error);
    }
  }

  // Re-index all published portfolios to search service
  async reindexAllPortfolios(req, res, next) {
    try {
      const portfolios = await Portfolio.findAll({
        where: {
          status: 'published',
          isPublic: true
        }
      });

      console.log(`Re-indexing ${portfolios.length} portfolios...`);

      for (const portfolio of portfolios) {
        await publishToSearchIndex({
          action: 'index',
          portfolio: portfolio.toJSON()
        });
      }

      res.json({
        success: true,
        message: `Re-indexed ${portfolios.length} portfolios successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortfolioController();
