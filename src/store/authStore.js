import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoaded: false,
  setUser: (userData) => set({ 
    user: userData, 
    isAuthenticated: !!userData,
    isAuthLoaded: true
  }),
  setAuthLoaded: (loaded) => set({ isAuthLoaded: loaded }),
  logout: () => set({ user: null, isAuthenticated: false })
}))
