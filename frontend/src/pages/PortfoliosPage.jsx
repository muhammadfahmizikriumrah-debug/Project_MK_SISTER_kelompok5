import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Heart, Edit, Trash2 } from 'lucide-react'
import { portfolioApi } from '../utils/api'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, portfolioId: null, portfolioTitle: null })
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchPortfolios()
    
    // Refresh portfolios when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPortfolios()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, user?.userId])

  const fetchPortfolios = async () => {
    if (!user) {
      console.warn('User not authenticated')
      setPortfolios([])
      return
    }

    const userId = user.id || user.userId
    if (!userId) {
      console.warn('User ID not available in user object:', user)
      setPortfolios([])
      return
    }

    setIsLoading(true)
    try {
      console.log('Fetching portfolios for user:', userId)
      const response = await portfolioApi.get(`/api/portfolios/user/${userId}`)
      console.log('Portfolios response:', response.data)
      
      if (response.data && response.data.success) {
        // The API returns data as an array directly, not nested
        const portfolioData = response.data.data
        console.log('Portfolios data:', portfolioData)
        
        if (Array.isArray(portfolioData)) {
          setPortfolios(portfolioData)
        } else {
          console.warn('Portfolio data is not an array:', portfolioData)
          setPortfolios([])
        }
      } else {
        console.warn('Unexpected response format:', response.data)
        setPortfolios([])
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
      toast.error('Failed to load portfolios')
      setPortfolios([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (portfolioId, portfolioTitle) => {
    setDeleteConfirm({
      isOpen: true,
      portfolioId,
      portfolioTitle
    })
  }

  const handleConfirmDelete = async () => {
    const { portfolioId } = deleteConfirm
    setDeleteConfirm({ isOpen: false, portfolioId: null, portfolioTitle: null })

    try {
      const response = await portfolioApi.delete(`/api/portfolios/${portfolioId}`)
      
      if (response.data && response.data.success) {
        toast.success('Portfolio deleted successfully!')
        // Remove from local state
        setPortfolios(portfolios.filter(p => p.id !== portfolioId))
      } else {
        toast.error('Failed to delete portfolio')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      toast.error(error.response?.data?.message || 'Failed to delete portfolio')
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, portfolioId: null, portfolioTitle: null })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Portfolios</h1>
          <p className="text-gray-600 mt-2">
            Manage and organize your portfolio projects
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPortfolios}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <Link
            to="/portfolios/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Portfolio</span>
          </Link>
        </div>
      </div>

      {/* Portfolio Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading portfolios...</p>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No portfolios yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first portfolio to showcase your work
          </p>
          <Link
            to="/portfolios/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Create Your First Portfolio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="card p-6 hover:shadow-lg transition-shadow">
              {portfolio.thumbnail && (
                <img
                  src={portfolio.thumbnail}
                  alt={portfolio.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <h3 className="text-xl font-semibold mb-2">{portfolio.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {portfolio.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {portfolio.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {portfolio.views || 0}
                  </span>
                  <span className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {portfolio.likes || 0}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  portfolio.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : portfolio.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {portfolio.status}
                </span>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/portfolios/${portfolio.id}/edit`}
                  className="btn btn-outline flex-1 flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={() => handleDeleteClick(portfolio.id, portfolio.title)}
                  className="btn btn-outline text-red-600 hover:bg-red-50 flex items-center justify-center px-3"
                  title="Delete portfolio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Portfolio"
        message={`Are you sure you want to delete "${deleteConfirm.portfolioTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  )
}
