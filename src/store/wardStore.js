import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncPatientsToCloud, loadPatientsFromCloud } from '../services/syncService'

export const useWardStore = create(
  persist(
    (set, get) => ({
      isWardOpen: false,
      setWardOpen: (isOpen) => set({ isWardOpen: isOpen }),
      
      activeTab: 'active',
      setActiveTab: (tab) => set({ activeTab: tab }),

      patients: [],
      activeCaseId: null,
      _userId: null,

      // Called once after Firebase auth resolves
      initSync: async (userId) => {
        if (!userId) return
        set({ _userId: userId })
        
        // Pull cloud data and merge with local
        const cloudPatients = await loadPatientsFromCloud(userId)
        if (cloudPatients && cloudPatients.length > 0) {
          const local = get().patients
          // Merge: cloud wins for same IDs, keep unique locals
          const cloudIds = new Set(cloudPatients.map(p => p.id))
          const uniqueLocal = local.filter(p => !cloudIds.has(p.id))
          const merged = [...cloudPatients, ...uniqueLocal]
          set({ patients: merged })
          // Push merged state back to cloud
          syncPatientsToCloud(userId, merged)
        } else if (get().patients.length > 0) {
          // No cloud data but we have local — push it up
          syncPatientsToCloud(userId, get().patients)
        }
      },

      setActiveCase: (id) => set({ activeCaseId: id }),
      
      addPatient: (pt) => set((state) => {
        const patients = [pt, ...state.patients]
        syncPatientsToCloud(state._userId, patients)
        return { patients }
      }),

      updatePatient: (id, data) => set((state) => {
        const patients = state.patients.map(p => p.id === id ? { ...p, ...data } : p)
        syncPatientsToCloud(state._userId, patients)
        return { patients }
      }),

      closeCase: (id) => set((state) => {
        const patients = state.patients.map(p => p.id === id ? { ...p, status: 'closed' } : p)
        syncPatientsToCloud(state._userId, patients)
        return { patients }
      }),

      reopenCase: (id) => set((state) => {
        const patients = state.patients.map(p => p.id === id ? { ...p, status: 'active' } : p)
        syncPatientsToCloud(state._userId, patients)
        return { patients }
      }),

    }),
    {
      name: 'pharmai-ward-storage',
      partialize: (state) => ({ patients: state.patients }),
    }
  )
)
