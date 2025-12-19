import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'

// Layout
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import PortfoliosPage from './pages/PortfoliosPage'
import PortfolioDetailPage from './pages/PortfolioDetailPage'
import CreatePortfolioPage from './pages/CreatePortfolioPage'
import EditPortfolioPage from './pages/EditPortfolioPage'
import PublicProfilePage from './pages/PublicProfilePage'
import SearchPage from './pages/SearchPage'
import NotFoundPage from './pages/NotFoundPage'
import BerandaPage from './pages/BerandaPage'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="u/:username" element={<PublicProfilePage />} />
        <Route path="portfolio/:id" element={<PortfolioDetailPage />} />
        <Route path="beranda" element={<BerandaPage />} />
        
        {/* Protected routes */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="portfolios" element={
          <ProtectedRoute>
            <PortfoliosPage />
          </ProtectedRoute>
        } />
        <Route path="portfolios/create" element={
          <ProtectedRoute>
            <CreatePortfolioPage />
          </ProtectedRoute>
        } />
        <Route path="portfolios/:id/edit" element={
          <ProtectedRoute>
            <EditPortfolioPage />
          </ProtectedRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
