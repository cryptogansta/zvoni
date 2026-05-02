import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, ApiError } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null, token?: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user, token) => set({ user, token: token ?? get().token }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const data = await api.post<{ user: AuthUser; token: string }>('/api/auth/login', { email, password })
          set({ user: data.user, token: data.token })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, name, password) => {
        set({ isLoading: true })
        try {
          const data = await api.post<{ user: AuthUser; token: string }>('/api/auth/register', { email, name, password })
          set({ user: data.user, token: data.token })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try { await api.post('/api/auth/logout') } catch {}
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        try {
          const user = await api.get<AuthUser>('/api/me')
          set({ user })
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            set({ user: null, token: null })
          }
        }
      },
    }),
    { name: 'zvoni-auth', partialize: (s) => ({ token: s.token }) }
  )
)
