import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.post('/api/auth/login', credentials)
          let { user, accessToken } = response.data.data
          
          // Create fullName from firstName and lastName if not present
          if (!user.fullName && (user.firstName || user.lastName)) {
            user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          }
          
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed'
          }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await authApi.post('/api/auth/register', userData)
          let { user, accessToken } = response.data.data
          
          // Create fullName from firstName and lastName if not present
          if (!user.fullName && (user.firstName || user.lastName)) {
            user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          }
          
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed'
          }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      initializeAuth: () => {
        const state = get()
        if (state.token && state.user) {
          set({ isAuthenticated: true })
        }
      },

      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
