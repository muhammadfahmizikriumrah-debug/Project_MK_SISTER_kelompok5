const { Media } = require('../models');
const { uploadToMinIO, deleteFromMinIO, getFileUrl } = require('../utils/minio');
const { publishThumbnailJob } = require('../utils/rabbitmq');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class MediaController {
  // Upload file
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const file = req.file;
      const fileExt = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExt}`;

      // Determine file type
      let fileType = 'other';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'document';
      }

      // Upload to MinIO
      const objectName = await uploadToMinIO(filename, file.buffer, file.mimetype);
      const url = await getFileUrl(objectName);

      // Create media record
      const media = await Media.create({
        userId,
        filename: objectName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        type: fileType,
        status: fileType === 'image' ? 'processing' : 'ready'
      });

      // If image, publish job to generate thumbnail
      if (fileType === 'image') {
        await publishThumbnailJob({
          mediaId: media.id,
          filename: objectName,
          userId
        });
      }

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: media
      });
    } catch (error) {
      next(error);
    }
  }

  // Get media by ID
  async getMediaById(req, res, next) {
    try {
      const { id } = req.params;

      const media = await Media.findByPk(id);

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      res.json({
        success: true,
        data: media
      });
    } catch (error) {
      next(error);
    }
  }

  // Get media by user
  async getMediaByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { type, page = 1, limit = 20 } = req.query;

      const where = { userId };
      if (type) {
        where.type = type;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Media.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          media: rows,
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

  // Delete media
  async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;

      const media = await Media.findByPk(id);

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      // Delete from MinIO
      await deleteFromMinIO(media.filename);

      // Delete thumbnail if exists
      if (media.thumbnailUrl) {
        const thumbnailFilename = media.filename.replace(/(\.[^.]+)$/, '_thumb$1');
        await deleteFromMinIO(thumbnailFilename);
      }

      // Delete from database
      await media.destroy();

      res.json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
