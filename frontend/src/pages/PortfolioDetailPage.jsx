import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Eye, Heart, ExternalLink, Github, Calendar, User, MessageCircle, Send, Trash2, MapPin, Mail, Globe, GraduationCap, Briefcase, Phone, Building2 } from 'lucide-react'
import { portfolioApi, userApi } from '../utils/api'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function PortfolioDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [comments, setComments] = useState([])
  const [areCommentsLoading, setAreCommentsLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [deletingCommentIds, setDeletingCommentIds] = useState([])
  const [uploaderProfile, setUploaderProfile] = useState(null)
  const [isUploaderLoading, setIsUploaderLoading] = useState(false)

  const fetchComments = useCallback(async (portfolioIdParam) => {
    const targetPortfolioId = portfolioIdParam || id
    if (!targetPortfolioId) return

    setAreCommentsLoading(true)
    try {
      const response = await portfolioApi.get(`/api/portfolios/${targetPortfolioId}/comments`)
      if (response.data?.success) {
        setComments(response.data.data || [])
      } else {
        setComments([])
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast.error('Failed to load comments')
      setComments([])
    } finally {
      setAreCommentsLoading(false)
    }
  }, [id])

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        // Increment view count
        await portfolioApi.post(`/api/portfolios/${id}/view`).catch(err => {
          console.log('View increment failed (expected for guests):', err.message)
        })

        // Load portfolio data
        const response = await portfolioApi.get(`/api/portfolios/${id}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.data && response.data.success) {
          setPortfolio(response.data.data)
          console.log('Loaded portfolio:', response.data.data)
          await fetchComments(response.data.data.id)
        } else if (response.status === 304) {
          // Handle 304 Not Modified - retry with fresh request
          console.log('Got 304, retrying...')
          const freshResponse = await portfolioApi.get(`/api/portfolios/${id}`)
          if (freshResponse.data && freshResponse.data.success) {
            setPortfolio(freshResponse.data.data)
            console.log('Loaded portfolio:', freshResponse.data.data)
            await fetchComments(freshResponse.data.data.id)
          } else {
            toast.error('Failed to load portfolio')
          }
        } else {
          toast.error('Failed to load portfolio')
        }
      } catch (error) {
        console.error('Failed to load portfolio:', error)
        toast.error('Failed to load portfolio')
      } finally {
        setIsLoading(false)
      }
    }

    loadPortfolio()
  }, [id])

  // Check if user liked this portfolio
  useEffect(() => {
    const checkLike = async () => {
      if (!isAuthenticated || !portfolio) return
      
      try {
        const response = await portfolioApi.get(`/api/portfolios/${portfolio.id}/like/check`)
        if (response.data && response.data.success) {
          setIsLiked(response.data.data.isLiked)
        }
      } catch (error) {
        console.error('Failed to check like status:', error)
      }
    }

    checkLike()
  }, [portfolio?.id, isAuthenticated])

  const handleLike = async () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to like portfolios')
      navigate('/login')
      return
    }

    if (!portfolio || isLiking) return

    setIsLiking(true)
    try {
      const response = await portfolioApi.post(`/api/portfolios/${portfolio.id}/like`)
      
      if (response.data && response.data.success) {
        setPortfolio(prev => ({
          ...prev,
          likes: response.data.data.likes
        }))
        setIsLiked(response.data.data.isLiked)
        
        if (response.data.data.isLiked) {
          toast.success('Portfolio liked!')
        } else {
          toast.success('Portfolio unliked')
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      if (error.response?.status === 401) {
        toast.error('Please login to like portfolios')
        navigate('/login')
      } else {
        toast.error(error.response?.data?.message || 'Failed to toggle like')
      }
    } finally {
      setIsLiking(false)
    }
  }

  const handleCommentSubmit = async (event) => {
    event.preventDefault()

    if (!isAuthenticated) {
      toast.error('Please login to comment')
      navigate('/login')
      return
    }

    if (!commentContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      setIsCommentSubmitting(true)
      const response = await portfolioApi.post(`/api/portfolios/${id}/comments`, {
        content: commentContent.trim()
      })

      if (response.data?.success) {
        setComments((prev) => [...prev, response.data.data])
        setCommentContent('')
        toast.success('Comment added')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to submit comment'
      toast.error(message)
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const fetchUploaderProfile = useCallback(async (userId) => {
    if (!userId) return

    setIsUploaderLoading(true)
    try {
      const response = await userApi.get(`/api/users/${userId}`)
      if (response.data?.success) {
        setUploaderProfile(response.data.data)
      } else {
        setUploaderProfile(null)
      }
    } catch (error) {
      console.error('Failed to load uploader profile:', error)
      setUploaderProfile(null)
    } finally {
      setIsUploaderLoading(false)
    }
  }, [])

  useEffect(() => {
    if (portfolio?.isPublic && portfolio?.userId) {
      fetchUploaderProfile(portfolio.userId)
    } else {
      setUploaderProfile(null)
    }
  }, [portfolio?.isPublic, portfolio?.userId, fetchUploaderProfile])

  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please login to continue')
      navigate('/login')
      return
    }

    setDeletingCommentIds((prev) => [...prev, commentId])
    try {
      const response = await portfolioApi.delete(`/api/portfolios/${id}/comments/${commentId}`)
      if (response.data?.success) {
        setComments((prev) => prev.map((comment) => (
          comment.id === commentId
            ? { ...comment, status: 'deleted', content: '[deleted]' }
            : comment
        )))
        toast.success('Comment deleted')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    } finally {
      setDeletingCommentIds((prev) => prev.filter((value) => value !== commentId))
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Portfolio not found</h1>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {portfolio.title}
        </h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(portfolio.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {portfolio.views} views
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`btn flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'btn-outline hover:bg-red-50'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isAuthenticated ? 'Like this portfolio' : 'Login to like'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{portfolio.likes}</span>
            </button>
            
            {portfolio.demoUrl && (
              <a
                href={portfolio.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Demo</span>
              </a>
            )}
            
            {portfolio.repositoryUrl && (
              <a
                href={portfolio.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex items-center space-x-2"
              >
                <Github className="h-4 w-4" />
                <span>Code</span>
              </a>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {portfolio.tags && portfolio.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Thumbnail */}
      {portfolio.thumbnail && (
        <div className="mb-8">
          <img 
            src={portfolio.thumbnail} 
            alt={portfolio.title}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Images */}
      {portfolio.images && portfolio.images.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4">
            {portfolio.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${portfolio.title} - Image ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          About This Project
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {portfolio.description}
          </p>
        </div>
      </div>

      {portfolio.isPublic && (
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start space-x-4">
              {isUploaderLoading ? (
                <div className="h-16 w-16 rounded-full bg-blue-200 animate-pulse" />
              ) : uploaderProfile?.avatar ? (
                <img
                  src={uploaderProfile.avatar}
                  alt={uploaderProfile.firstName || uploaderProfile.username}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-semibold">
                  {(uploaderProfile?.firstName && uploaderProfile?.firstName[0]) || uploaderProfile?.username?.[0] || '?'}
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-4 w-4 text-primary-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {(() => {
                      const fullName = `${uploaderProfile?.firstName || ''} ${uploaderProfile?.lastName || ''}`.trim()
                      return fullName || uploaderProfile?.username || 'Uploader'
                    })()}
                  </h2>
                </div>

                {isUploaderLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-blue-100 rounded w-48"></div>
                    <div className="h-3 bg-blue-50 rounded w-32"></div>
                  </div>
                ) : uploaderProfile ? (
                  <div className="space-y-2 text-gray-600">
                    {uploaderProfile.bio && (
                      <p className="text-gray-700 leading-relaxed">
                        {uploaderProfile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      {uploaderProfile.position && (
                        <span className="inline-flex items-center space-x-1 text-gray-600">
                          <Briefcase className="h-4 w-4 text-primary-500" />
                          <span>{uploaderProfile.position}</span>
                        </span>
                      )}
                      {uploaderProfile.university && (
                        <span className="inline-flex items-center space-x-1 text-gray-600">
                          <GraduationCap className="h-4 w-4 text-primary-500" />
                          <span>{uploaderProfile.university}</span>
                        </span>
                      )}
                      {uploaderProfile.department && (
                        <span className="inline-flex items-center space-x-1 text-gray-600">
                          <Building2 className="h-4 w-4 text-primary-500" />
                          <span>{uploaderProfile.department}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {uploaderProfile.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary-500" />
                          <span>{uploaderProfile.location}</span>
                        </div>
                      )}
                      {uploaderProfile.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-primary-500" />
                          <a
                            href={uploaderProfile.website.startsWith('http') ? uploaderProfile.website : `https://${uploaderProfile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {uploaderProfile.website}
                          </a>
                        </div>
                      )}
                      {uploaderProfile.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-primary-500" />
                          <a href={`mailto:${uploaderProfile.email}`} className="text-primary-600 hover:text-primary-700">
                            {uploaderProfile.email}
                          </a>
                        </div>
                      )}
                      {uploaderProfile.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-primary-500" />
                          <span>{uploaderProfile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Uploader information is not available.
                  </p>
                )}
              </div>
            </div>

            <div className="flex md:flex-col gap-2">
              <div className="text-sm text-gray-500">
                <span className="inline-flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-primary-500" />
                  <span>Uploaded on {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                </span>
              </div>

              {uploaderProfile?.username && (
                <Link
                  to={`/u/${uploaderProfile.username}`}
                  className="btn btn-outline text-center"
                >
                  View Public Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Details */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gh-text mb-4">
          Project Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gh-text mb-2">Category</h3>
            <p className="text-gray-600 dark:text-gh-text-secondary">{portfolio.category}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gh-text mb-2">Status</h3>
            <span className={`px-2 py-1 rounded text-sm font-semibold ${
              portfolio.status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-50'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/25 dark:text-yellow-50'
            }`}>
              {portfolio.status?.charAt(0).toUpperCase() + portfolio.status?.slice(1)}
            </span>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gh-text mb-2">Created</h3>
            <p className="text-gray-600 dark:text-gh-text-secondary">
              {new Date(portfolio.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gh-text mb-2">Last Updated</h3>
            <p className="text-gray-600 dark:text-gh-text-secondary">
              {new Date(portfolio.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gh-text">
              Comments ({comments.filter((comment) => comment.status === 'active').length})
            </h2>
          </div>
        </div>

        {isAuthenticated && (
          <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
            <textarea
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              rows={3}
              className="input"
              placeholder="Bagikan pendapat Anda mengenai proyek ini..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCommentSubmitting}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isCommentSubmitting ? 'Mengirim...' : 'Kirim Komentar'}</span>
              </button>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="p-4 bg-gray-50 dark:bg-gh-bg-tertiary border border-gray-200 dark:border-gh-border rounded-lg text-sm text-gray-600 dark:text-gh-text-secondary mb-6">
            <span>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login</Link>
              {' '}untuk meninggalkan komentar.
            </span>
          </div>
        )}

        {areCommentsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((skeleton) => (
              <div key={skeleton} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gh-bg-tertiary rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gh-bg-tertiary rounded"></div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gh-text-secondary">Belum ada komentar. Jadilah yang pertama memberikan tanggapan!</p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 dark:border-gh-border rounded-lg p-4 bg-white dark:bg-gh-bg-tertiary">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.fullName || comment.user.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-500/25 text-primary-700 dark:text-primary-100 flex items-center justify-center font-semibold">
                        {(comment.user?.fullName || comment.user?.email || comment.user?.username || '?')[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-gh-text">{comment.user?.fullName || comment.user?.email || comment.user?.username || 'User'}</span>
                        <span className="text-xs text-gray-400 dark:text-gh-text-tertiary">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gh-text mt-2 whitespace-pre-line">
                        {comment.status === 'deleted' ? <span className="italic text-gray-400 dark:text-gh-text-tertiary">[deleted]</span> : comment.content}
                      </p>
                    </div>
                  </div>

                  {comment.user?.id === user?.id && comment.status !== 'deleted' && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingCommentIds.includes(comment.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-md disabled:opacity-40"
                      title="Hapus komentar"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
