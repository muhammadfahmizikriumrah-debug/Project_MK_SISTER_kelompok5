import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'
import { Eye, Heart, FolderKanban, Plus } from 'lucide-react'
import { portfolioApi } from '../utils/api'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalProjects: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id && !user?.userId) {
        setIsLoading(false)
        return
      }

      try {
        const userId = user.id || user.userId
        const response = await portfolioApi.get(`/api/portfolios/user/${userId}`)
        
        if (response.data && response.data.success) {
          const portfolios = response.data.data
          
          // Calculate stats
          const totalViews = portfolios.reduce((sum, p) => sum + (p.views || 0), 0)
          const totalLikes = portfolios.reduce((sum, p) => sum + (p.likes || 0), 0)
          const totalProjects = portfolios.length
          
          setStats({
            totalViews,
            totalLikes,
            totalProjects
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        toast.error('Failed to load dashboard stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user?.id, user?.userId])

  return (
    <div className="dashboard-batik">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gh-text">
          Welcome, {user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gh-text-secondary mt-2">
          Manage your portfolio and track your progress
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/portfolios"
          className="card p-6 hover:shadow-lg transition-shadow text-center flex flex-col items-center"
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
            <FolderKanban className="h-6 w-6 text-primary-600 dark:text-primary-200" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gh-text mb-2">Management My Portfolio</h3>
          <p className="text-sm text-gray-600 dark:text-gh-text-secondary max-w-xs">
            Kelola seluruh portofolio Anda dari satu tempat: buat, edit, dan publikasi.
          </p>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats.totalViews}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats.totalLikes}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats.totalProjects}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No recent activity</p>
          <Link
            to="/portfolios/create"
            className="btn btn-primary"
          >
            Create Your First Portfolio
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}
