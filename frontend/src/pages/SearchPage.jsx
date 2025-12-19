import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { portfolioApi } from '../utils/api'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const initialQuery = searchParams.get('q')
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
  }, [])

  const performSearch = async (searchQuery) => {
    setIsLoading(true)
    
    try {
      const response = await portfolioApi.get(`/api/search/portfolios?q=${encodeURIComponent(searchQuery)}`)
      if (response.data.success) {
        setResults(response.data.data.hits || [])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearchParams({ q: query })
    performSearch(query)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Search Portfolios
        </h1>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search portfolios, projects, or tags..."
              className="input pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            className="btn btn-outline flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </form>
      </div>

      {/* Search Results */}
      <div>
        {query && (
          <p className="text-gray-600 mb-6">
            {isLoading ? 'Searching...' : `Search results for "${query}"`}
          </p>
        )}

        {!query && !isLoading && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search for portfolios
            </h3>
            <p className="text-gray-600">
              Enter keywords to find portfolios, projects, or tags
            </p>
          </div>
        )}

        {query && !isLoading && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse all portfolios
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((portfolio) => (
              <Link key={portfolio.id} to={`/portfolio/${portfolio.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow">
                {portfolio.thumbnail && (
                  <img 
                    src={portfolio.thumbnail} 
                    alt={portfolio.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{portfolio.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{portfolio.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
