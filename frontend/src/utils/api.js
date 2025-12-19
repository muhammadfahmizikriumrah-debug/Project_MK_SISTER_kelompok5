import axios from 'axios'
import toast from 'react-hot-toast'

// API Gateway base URL
const API_GATEWAY_URL = 'http://localhost:8080'

// Auth Service API (through gateway)
const authApi = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Portfolio Service API (through gateway)
const portfolioApi = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// User Service API (through gateway)
const userApi = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor untuk semua API
const setupInterceptors = (api) => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const auth = JSON.parse(token)
        const accessToken = auth.state?.token || auth.token
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
      
      if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.')
      }
      
      return Promise.reject(error)
    }
  )
}

setupInterceptors(authApi)
setupInterceptors(portfolioApi)
setupInterceptors(userApi)

export { authApi, portfolioApi, userApi }
