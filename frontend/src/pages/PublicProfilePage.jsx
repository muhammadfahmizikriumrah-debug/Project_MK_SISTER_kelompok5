import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Globe, Mail, Phone, Eye, Heart } from 'lucide-react'
import { userApi, portfolioApi } from '../utils/api'

export default function PublicProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [portfolios, setPortfolios] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Fetch user profile by username
        const userResponse = await userApi.get(`/api/users/username/${username}`)
        if (userResponse.data && userResponse.data.success) {
          const userData = userResponse.data.data
          
          // Create fullName from firstName and lastName
          const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
          
          setProfile({
            ...userData,
            fullName: fullName || userData.username,
            views: userData.views || 0,
            createdAt: userData.createdAt
          })
          
          // Fetch user's public portfolios
          try {
            const portfolioResponse = await portfolioApi.get(`/api/portfolios/user/${userData.id}`)
            if (portfolioResponse.data && portfolioResponse.data.success) {
              // Filter only public portfolios
              const publicPortfolios = portfolioResponse.data.data.filter(p => p.isPublic)
              setPortfolios(publicPortfolios)
            }
          } catch (error) {
            console.error('Failed to load portfolios:', error)
            setPortfolios([])
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (username) {
      loadProfile()
    }
  }, [username])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {profile.fullName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.fullName}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              @{profile.username}
            </p>
            
            {profile.bio && (
              <p className="text-gray-700 mb-4">
                {profile.bio}
              </p>
            )}
            
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {profile.views} profile views
              </span>
              <span>
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            
            <div className="space-y-3">
              {profile.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center text-gray-600">
                  <Globe className="h-4 w-4 mr-2" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              
              {profile.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              
              {profile.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Info */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Academic Information
            </h2>
            
            <div className="space-y-3">
              {profile.university && (
                <div>
                  <h3 className="font-medium text-gray-900">University</h3>
                  <p className="text-gray-600">{profile.university}</p>
                </div>
              )}
              
              {profile.department && (
                <div>
                  <h3 className="font-medium text-gray-900">Department</h3>
                  <p className="text-gray-600">{profile.department}</p>
                </div>
              )}
              
              {profile.position && (
                <div>
                  <h3 className="font-medium text-gray-900">Position</h3>
                  <p className="text-gray-600">{profile.position}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolios */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Portfolios ({portfolios.length})
            </h2>
          </div>

          {portfolios.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No public portfolios yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="card p-6 hover:shadow-lg transition-shadow">
                  {portfolio.thumbnail && (
                    <img
                      src={portfolio.thumbnail}
                      alt={portfolio.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <h3 className="text-xl font-semibold mb-2">
                    <Link
                      to={`/portfolio/${portfolio.id}`}
                      className="text-gray-900 hover:text-primary-600"
                    >
                      {portfolio.title}
                    </Link>
                  </h3>
                  
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

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {portfolio.views}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {portfolio.likes}
                      </span>
                    </div>
                    <span>
                      {new Date(portfolio.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
