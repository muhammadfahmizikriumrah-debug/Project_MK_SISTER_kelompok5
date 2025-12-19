import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Search, User, LogOut, Plus, Menu, X, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import BrainSketchLogo from './BrainSketchLogo'

export default function Navbar({ isDark, setIsDark }) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = e.target.search.value
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <nav className="navbar-batik dark:bg-gh-bg-secondary border-b border-gray-200 dark:border-gh-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BrainSketchLogo />
            <span className="font-bold text-xl text-white dark:text-gh-text">taskThink</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search portfolios..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gh-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gh-bg-tertiary text-gray-900 dark:text-gh-text placeholder-gray-500 dark:placeholder-gh-text-tertiary"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gh-text-tertiary" />
            </form>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-blue-100 dark:text-gh-text-secondary hover:bg-white/15 dark:hover:bg-gh-bg-tertiary transition-colors"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/beranda"
                  className="text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors"
                >
                  Beranda
                </Link>

                <Link
                  to="/portfolios/create"
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </Link>
                
                <Link
                  to="/dashboard"
                  className="text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/profile"
                  className="text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors"
                >
                  My Profil
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors">
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gh-bg-secondary rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 dark:border-gh-border">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-900 dark:text-gh-text-secondary hover:bg-blue-50 dark:hover:bg-gh-bg-tertiary transition-colors"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to={`/u/${user?.username}`}
                      className="block px-4 py-2 text-sm text-gray-900 dark:text-gh-text-secondary hover:bg-blue-50 dark:hover:bg-gh-bg-tertiary transition-colors"
                    >
                      Public Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gh-text-secondary hover:bg-blue-50 dark:hover:bg-gh-bg-tertiary flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/beranda"
                  className="text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors"
                >
                  Beranda
                </Link>
                <Link
                  to="/login"
                  className="text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent px-3 py-2 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-blue-100 dark:text-gh-text-tertiary hover:text-blue-200 dark:hover:text-gh-text-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 dark:border-gh-border">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search portfolios..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gh-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gh-bg-tertiary text-gray-900 dark:text-gh-text placeholder-gray-500 dark:placeholder-gh-text-tertiary"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gh-text-tertiary" />
              </div>
            </form>

            {/* Theme Toggle Mobile */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full text-left px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent flex items-center space-x-2 transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/beranda"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Beranda
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profil
                  </Link>
                  <Link
                    to="/portfolios/create"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Portfolio
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/beranda"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Beranda
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-blue-100 dark:text-gh-text-secondary hover:text-blue-200 dark:hover:text-gh-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
