const { validationResult } = require('express-validator');
const { Profile } = require('../models');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

class ProfileController {
  // Get profile by user ID
  async getProfileByUserId(req, res, next) {
    try {
      const { userId } = req.params;

      let profile = await Profile.findOne({ where: { userId } });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Get user data from user service
      try {
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
        profile = {
          ...profile.toJSON(),
          user: userResponse.data.data
        };
      } catch (error) {
        console.error('Error fetching user data:', error.message);
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  // Get public profile by username
  async getPublicProfile(req, res, next) {
    try {
      const { username } = req.params;

      // Get user by username from user service
      const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/username/${username}`);
      const user = userResponse.data.data;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get profile
      let profile = await Profile.findOne({ where: { userId: user.id } });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Check if profile is public
      if (!profile.isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Profile is private'
        });
      }

      res.json({
        success: true,
        data: {
          ...profile.toJSON(),
          user: {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          }
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

  // Create profile
  async createProfile(req, res, next) {
    try {
      const { userId, bio, title, institution, department, phone, website, location, socialLinks } = req.body;

      // Check if profile already exists
      const existingProfile = await Profile.findOne({ where: { userId } });

      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'Profile already exists for this user'
        });
      }

      const profile = await Profile.create({
        userId,
        bio,
        title,
        institution,
        department,
        phone,
        website,
        location,
        socialLinks
      });

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const updateData = req.body;

      let profile = await Profile.findOne({ where: { userId } });

      if (!profile) {
        // Create profile if it doesn't exist
        profile = await Profile.create({
          userId,
          ...updateData
        });
      } else {
        await profile.update(updateData);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete profile
  async deleteProfile(req, res, next) {
    try {
      const { userId } = req.params;

      const profile = await Profile.findOne({ where: { userId } });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      await profile.destroy();

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Increment profile view count
  async incrementView(req, res, next) {
    try {
      const { userId } = req.params;

      const profile = await Profile.findOne({ where: { userId } });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      await profile.increment('profileViews');

      res.json({
        success: true,
        message: 'View count incremented'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
