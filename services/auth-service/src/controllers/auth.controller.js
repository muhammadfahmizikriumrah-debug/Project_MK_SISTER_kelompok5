const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const axios = require('axios');
const { User } = require('../models');
const redisClient = require('../utils/redis');

const PRIMARY_USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://api-gateway:80';
const FALLBACK_USER_SERVICE_URL = process.env.USER_SERVICE_FALLBACK_URL || 'http://localhost:8080';

const getUserServiceUrls = () => {
  const urls = [PRIMARY_USER_SERVICE_URL];
  if (FALLBACK_USER_SERVICE_URL && !urls.includes(FALLBACK_USER_SERVICE_URL)) {
    urls.push(FALLBACK_USER_SERVICE_URL);
  }
  return urls;
};

const postToUserService = async (path, payload) => {
  const urls = getUserServiceUrls();
  for (const baseUrl of urls) {
    try {
      await axios.post(`${baseUrl}${path}`, payload);
      return true;
    } catch (error) {
      console.error(`Failed to POST ${path} to ${baseUrl}:`, error.message);
    }
  }
  return false;
};

const getFromUserService = async (path) => {
  const urls = getUserServiceUrls();
  for (const baseUrl of urls) {
    try {
      const response = await axios.get(`${baseUrl}${path}`);
      if (response.data?.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error(`Failed to GET ${path} from ${baseUrl}:`, error.message);
    }
  }
  return null;
};

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create new user
      const user = await User.create({
        email,
        username,
        password
      });

      // Create user in user service
      const userCreated = await postToUserService('/api/users', {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: '',
        lastName: ''
      });

      if (!userCreated) {
        console.error('Failed to create user in user service via all configured URLs');
        // Continue anyway - user is created in auth service
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token to database
      await user.update({ refreshToken });

      // Cache user data in Redis
      await cacheUserData(user.id, user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Update last login and refresh token
      await user.update({
        lastLogin: new Date(),
        refreshToken
      });

      // Fetch profile data from user service
      let userProfile = user.toJSON();
      const fetchedProfile = await getFromUserService(`/api/users/${user.id}`);
      if (fetchedProfile) {
        userProfile = fetchedProfile;
      } else {
        console.error('Failed to fetch user profile via all configured URLs');
        // Continue with basic user data
      }

      // Cache user data in Redis
      await cacheUserData(user.id, userProfile);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userProfile,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Find user
      const user = await User.findByPk(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Update refresh token
      await user.update({ refreshToken: newRefreshToken });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout user
  async logout(req, res, next) {
    try {
      const userId = req.user.userId;

      // Remove refresh token from database
      await User.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      // Remove user data from Redis cache
      await redisClient.del(`user:${userId}`);

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify token
  async verifyToken(req, res) {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  }

  // Get current user
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.userId;

      // Try to get from cache first
      const cachedUser = await redisClient.get(`user:${userId}`);
      
      if (cachedUser) {
        return res.json({
          success: true,
          data: JSON.parse(cachedUser)
        });
      }

      // Get from database
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Cache user data
      await cacheUserData(userId, user);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper functions
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

async function cacheUserData(userId, user) {
  try {
    // Handle both Sequelize instances and plain objects
    const userData = typeof user.toJSON === 'function' ? user.toJSON() : user;
    await redisClient.setEx(
      `user:${userId}`,
      3600, // 1 hour
      JSON.stringify(userData)
    );
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

module.exports = new AuthController();
