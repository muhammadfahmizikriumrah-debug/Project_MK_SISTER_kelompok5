import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Eye, MessageCircle, Heart, Filter, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { portfolioApi } from '../utils/api'

const DEFAULT_LIMIT = 24

const SORT_OPTIONS = [
  { key: 'views', label: 'Terpopuler (Views)' },
  { key: 'comments', label: 'Respons Terbanyak (Komentar)' }
]

const formatStatusLabel = (status) => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusBadgeClasses = (status) => {
  const base = 'px-2 py-1 text-xs font-semibold rounded-full'
  if (!status) return `${base} bg-gray-100 text-gray-700 dark:bg-gray-600/70 dark:text-gray-100`

  switch (status.toLowerCase()) {
    case 'published':
      return `${base} bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-50`
    case 'draft':
      return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-500/25 dark:text-yellow-50`
    case 'archived':
      return `${base} bg-gray-200 text-gray-700 dark:bg-gray-600/70 dark:text-gray-100`
    default:
      return `${base} bg-primary-100 text-primary-700 dark:bg-primary-500/25 dark:text-primary-50`
  }
}

export default function BerandaPage() {
  const [portfolios, setPortfolios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortKey, setSortKey] = useState('views')
  const [refreshFlag, setRefreshFlag] = useState(0)

  useEffect(() => {
    const fetchPopularPortfolios = async () => {
      setIsLoading(true)
      try {
        const response = await portfolioApi.get('/api/portfolios', {
          params: {
            status: 'published',
            isPublic: true,
            limit: DEFAULT_LIMIT
          }
        })

        const rows = response.data?.data?.portfolios || response.data?.data || []
        if (!Array.isArray(rows)) {
          setPortfolios([])
          return
        }

        const enriched = await Promise.all(
          rows.map(async (portfolio) => {
            try {
              const commentsResponse = await portfolioApi.get(`/api/portfolios/${portfolio.id}/comments`)
              const rawComments = commentsResponse.data?.data || []
              const activeComments = rawComments.filter((comment) => comment.status === 'active')
              return {
                ...portfolio,
                commentCount: activeComments.length
              }
            } catch (error) {
              console.error('Failed to fetch comments for portfolio:', portfolio.id, error)
              return {
                ...portfolio,
                commentCount: 0
              }
            }
          })
        )

        setPortfolios(enriched)
      } catch (error) {
        console.error('Failed to fetch popular portfolios:', error)
        toast.error('Gagal memuat portfolio populer')
        setPortfolios([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopularPortfolios()
  }, [refreshFlag])

  const categories = useMemo(() => {
    const unique = new Set()
    portfolios.forEach((portfolio) => {
      if (portfolio.category) {
        unique.add(portfolio.category)
      }
    })
    return Array.from(unique)
  }, [portfolios])

  const sortedPortfolios = useMemo(() => {
    const filtered = portfolios.filter((portfolio) => {
      if (selectedCategory === 'all') return true
      return portfolio.category === selectedCategory
    })

    return [...filtered].sort((a, b) => {
      if (sortKey === 'comments') {
        return (b.commentCount || 0) - (a.commentCount || 0)
      }
      const viewDiff = (b.views || 0) - (a.views || 0)
      if (viewDiff !== 0) return viewDiff
      return (b.likes || 0) - (a.likes || 0)
    })
  }, [portfolios, selectedCategory, sortKey])

  const featuredPortfolio = sortedPortfolios[0] || null
  const remainingPortfolios = featuredPortfolio ? sortedPortfolios.slice(1) : []

  const handleRefresh = () => {
    setRefreshFlag((prev) => prev + 1)
  }

  return (
    <div className="dashboard-batik">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gh-text mb-2">Beranda Populer</h1>
              <p className="text-gray-600 dark:text-gh-text-secondary max-w-2xl">
                Jelajahi portofolio dosen terbaik yang sedang trend berdasarkan jumlah view dan interaksi komentar.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gh-bg-secondary border border-primary-200/60 text-primary-700 dark:text-gh-text hover:bg-white dark:hover:bg-gh-bg-tertiary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                <Filter className="h-4 w-4 mr-1" />
                Kategori
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white shadow'
                    : 'bg-white/70 dark:bg-white/80 text-gray-600 dark:text-gray-900 hover:bg-white dark:hover:bg-white'
                }`}
              >
                Semua
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white shadow'
                      : 'bg-white/70 dark:bg-white/80 text-gray-600 dark:text-gray-900 hover:bg-white dark:hover:bg-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortKey(option.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    sortKey === option.key
                      ? 'bg-primary-600 border-primary-600 text-white shadow'
                      : 'bg-white/70 dark:bg-white/80 border-primary-200/60 text-gray-600 dark:text-gray-900 hover:bg-white dark:hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="card p-6 animate-pulse space-y-4">
                <div className="h-40 bg-blue-100 rounded-lg" />
                <div className="h-6 bg-blue-100 rounded w-3/4" />
                <div className="h-4 bg-blue-50 rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-4 bg-blue-50 rounded w-16" />
                  <div className="h-4 bg-blue-50 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedPortfolios.length === 0 ? (
          <div className="card p-10 text-center">
            <Flame className="h-10 w-10 text-primary-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada portofolio populer</h2>
            <p className="text-gray-600 mb-6">
              Coba segarkan halaman atau ubah filter kategori untuk melihat karya lainnya.
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Muat ulang</span>
            </button>
          </div>
        ) : (
          <>
            {featuredPortfolio && (
              <div className="card p-6 mb-8 overflow-hidden relative">
                <div className="absolute top-6 right-6 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-600 text-white text-sm">
                  <Flame className="h-4 w-4" />
                  <span>Trending</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {featuredPortfolio.thumbnail && (
                      <img
                        src={featuredPortfolio.thumbnail}
                        alt={featuredPortfolio.title}
                        className="w-full h-72 object-cover rounded-lg shadow-md"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        <Link to={`/portfolio/${featuredPortfolio.id}`} className="hover:text-primary-600">
                          {featuredPortfolio.title}
                        </Link>
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-4">
                        {featuredPortfolio.description}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {featuredPortfolio.category && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-white/80 dark:text-gray-900">
                            {featuredPortfolio.category}
                          </span>
                        )}
                        {featuredPortfolio.status && (
                          <span className={getStatusBadgeClasses(featuredPortfolio.status)}>
                            {formatStatusLabel(featuredPortfolio.status)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-4 w-4 text-primary-500" />
                          {featuredPortfolio.views || 0} views
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-4 w-4 text-primary-500" />
                          {featuredPortfolio.commentCount || 0} komentar
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-4 w-4 text-primary-500" />
                          {featuredPortfolio.likes || 0} likes
                        </span>
                      </div>
                      {featuredPortfolio.tags && featuredPortfolio.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {featuredPortfolio.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="card p-5 flex flex-col hover:shadow-lg transition-shadow">
                  {portfolio.thumbnail && (
                    <img
                      src={portfolio.thumbnail}
                      alt={portfolio.title}
                      className="w-full h-44 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      <Link to={`/portfolio/${portfolio.id}`} className="hover:text-primary-600">
                        {portfolio.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {portfolio.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {portfolio.category && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-white/80 dark:text-gray-900">
                          {portfolio.category}
                        </span>
                      )}
                      {portfolio.status && (
                        <span className={getStatusBadgeClasses(portfolio.status)}>
                          {formatStatusLabel(portfolio.status)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-4 w-4 text-primary-500" />
                        {portfolio.views || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 text-primary-500" />
                        {portfolio.commentCount || 0}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-4 w-4 text-primary-500" />
                      {portfolio.likes || 0}
                    </span>
                  </div>

                  {portfolio.tags && portfolio.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {portfolio.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
