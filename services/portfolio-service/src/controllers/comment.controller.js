const { Op } = require('sequelize')
const { Portfolio, PortfolioComment } = require('../models')
const { validationResult, body } = require('express-validator')
const axios = require('axios')

const PRIMARY_USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002'
const FALLBACK_USER_SERVICE_URL = process.env.USER_SERVICE_FALLBACK_URL || 'http://localhost:3002'

const commentValidationRules = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 2000 }).withMessage('Comment must be at most 2000 characters')
]

const buildUserCache = () => new Map()

const fetchUserProfile = async (userId, cache) => {
  if (!userId) return null
  if (cache.has(userId)) return cache.get(userId)

  const baseUrls = [PRIMARY_USER_SERVICE_URL]
  if (FALLBACK_USER_SERVICE_URL && !baseUrls.includes(FALLBACK_USER_SERVICE_URL)) {
    baseUrls.push(FALLBACK_USER_SERVICE_URL)
  }

  for (const baseUrl of baseUrls) {
    try {
      const response = await axios.get(`${baseUrl}/api/users/${userId}`)
      if (response.data?.success) {
        const user = response.data.data
        const computedName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        const profile = {
          id: user.id,
          username: user.username,
          email: user.email || null,
          fullName: computedName || user.email || user.username,
          avatar: user.avatar || null
        }
        cache.set(userId, profile)
        return profile
      }
    } catch (error) {
      console.error(`Failed to fetch user profile from ${baseUrl}:`, error.message)
    }
  }

  cache.set(userId, null)
  return null
}

const serializeComment = (comment, user) => ({
  id: comment.id,
  content: comment.content,
  status: comment.status,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user,
  parentId: comment.parentId
})

class CommentController {
  validationRules () {
    return commentValidationRules
  }

  async getComments (req, res, next) {
    try {
      const { id } = req.params

      const portfolio = await Portfolio.findByPk(id)
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        })
      }

      const comments = await PortfolioComment.findAll({
        where: {
          portfolioId: id,
          [Op.or]: [
            { status: 'active' },
            { status: null }
          ]
        },
        order: [['createdAt', 'ASC']]
      })

      const userCache = buildUserCache()
      const serialized = []

      for (const comment of comments) {
        const userProfile = await fetchUserProfile(comment.userId, userCache)
        serialized.push(serializeComment(comment, userProfile))
      }

      res.json({
        success: true,
        data: serialized
      })
    } catch (error) {
      next(error)
    }
  }

  async createComment (req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { content, parentId = null } = req.body
      const userId = req.user?.id || req.user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const portfolio = await Portfolio.findByPk(id)
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        })
      }

      if (parentId) {
        const parentComment = await PortfolioComment.findOne({
          where: { id: parentId, portfolioId: id }
        })
        if (!parentComment) {
          return res.status(400).json({
            success: false,
            message: 'Parent comment not found'
          })
        }
      }

      const comment = await PortfolioComment.create({
        portfolioId: id,
        userId,
        parentId,
        content: content.trim(),
        status: 'active'
      })

      const userProfile = await fetchUserProfile(userId, buildUserCache())

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: serializeComment(comment, userProfile)
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteComment (req, res, next) {
    try {
      const { id, commentId } = req.params
      const userId = req.user?.id || req.user?.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const comment = await PortfolioComment.findOne({
        where: { id: commentId, portfolioId: id }
      })

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        })
      }

      if (comment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to delete this comment'
        })
      }

      comment.status = 'deleted'
      comment.content = '[deleted]'
      await comment.save()

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new CommentController()
