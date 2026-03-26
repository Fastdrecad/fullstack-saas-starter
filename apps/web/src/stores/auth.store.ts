import { create } from 'zustand'
import { type AuthResponse } from '@starter/shared'

type User = AuthResponse['user']

type AuthState = {
  accessToken: string | null
  user: User | null
  isLoading: boolean
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: true,
  setAuth: (accessToken, user) => set({ accessToken, user, isLoading: false }),
  clearAuth: () => set({ accessToken: null, user: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
