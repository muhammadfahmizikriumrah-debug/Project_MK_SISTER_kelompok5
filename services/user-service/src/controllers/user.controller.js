const { validationResult } = require('express-validator');
const { User } = require('../models');
const { Op } = require('sequelize');

class UserController {
  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const where = search ? {
        [Op.or]: [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ]
      } : {};

      const { count, rows } = await User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users: rows,
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

  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by username
  async getUserByUsername(req, res, next) {
    try {
      const { username } = req.params;

      const user = await User.findOne({ where: { username } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Create user (called from auth service)
  async createUser(req, res, next) {
    try {
      const { id, email, username, role } = req.body;

      const user = await User.create({
        id,
        email,
        username,
        role: role || 'user'
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user
  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { firstName, lastName, email, username, avatar, bio, phone, website, location, university, department, position } = req.body;

      let user = await User.findByPk(id);

      // If user profile doesn't exist yet, create it using provided data
      if (!user) {
        if (!email || !username) {
          return res.status(400).json({
            success: false,
            message: 'Email and username are required to create user profile'
          });
        }

        user = await User.create({
          id,
          email,
          username,
          firstName: firstName || '',
          lastName: lastName || '',
          avatar: avatar || null,
          bio: bio || '',
          phone: phone || '',
          website: website || '',
          location: location || '',
          university: university || '',
          department: department || '',
          position: position || ''
        });

        return res.json({
          success: true,
          message: 'User profile created successfully',
          data: user
        });
      }

      await user.update({
        firstName,
        lastName,
        email,
        username,
        avatar,
        bio,
        phone,
        website,
        location,
        university,
        department,
        position
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
