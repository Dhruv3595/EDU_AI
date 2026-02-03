import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthResponse, LoginCredentials, RegisterData } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  setAuth: (auth: AuthResponse) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,

      login: async (credentials) => {
        const response = await api.post<AuthResponse>('/auth/login', credentials)
        get().setAuth(response.data)
      },

      register: async (data) => {
        const response = await api.post<AuthResponse>('/auth/register', data)
        get().setAuth(response.data)
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false
        })
      },

      setAuth: (auth) => {
        set({
          user: auth.user,
          token: auth.access_token,
          refreshToken: auth.refresh_token,
          isAuthenticated: true,
          isAdmin: auth.user.role === 'admin'
        })
      }
    }),
    {
      name: 'eduai-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      })
    }
  )
)
