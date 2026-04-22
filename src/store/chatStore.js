import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncSessionsToCloud, loadSessionsFromCloud, deleteSessionFromCloud, syncSettingsToCloud, loadSettingsFromCloud } from '../services/syncService'

export const useChatStore = create(
  persist(
    (set, get) => ({
      groqKey: '',
      setGroqKey: (key) => {
        set({ groqKey: key })
        syncSettingsToCloud(get()._userId, { groqKey: key, filters: get().filters })
      },
      
      sessions: [],
      currentSessionId: null,
      _userId: null,
      
      filters: {
        preg: false,
        peds: false,
        geri: false,
        counsel: false,
        steward: false
      },
      toggleFilter: (key) => {
        set((state) => ({
          filters: { ...state.filters, [key]: !state.filters[key] }
        }))
        // Sync filters to cloud (debounced via enqueueOrExec)
        const s = get()
        syncSettingsToCloud(s._userId, { groqKey: s.groqKey, filters: s.filters })
      },

      messages: [],
      isLoading: false,

      // Called once after Firebase auth resolves
      initSync: async (userId) => {
        if (!userId) return
        set({ _userId: userId })

        // Load cloud sessions
        const cloudSessions = await loadSessionsFromCloud(userId)
        if (cloudSessions && cloudSessions.length > 0) {
          const local = get().sessions
          const cloudIds = new Set(cloudSessions.map(s => s.id))
          const uniqueLocal = local.filter(s => !cloudIds.has(s.id))
          const merged = [...cloudSessions, ...uniqueLocal].sort((a, b) => b.id - a.id)
          set({ sessions: merged })
          syncSessionsToCloud(userId, merged)
        } else if (get().sessions.length > 0) {
          syncSessionsToCloud(userId, get().sessions)
        }

        // Load cloud settings
        const cloudSettings = await loadSettingsFromCloud(userId)
        if (cloudSettings) {
          if (cloudSettings.groqKey && !get().groqKey) {
            set({ groqKey: cloudSettings.groqKey })
          }
          if (cloudSettings.filters) {
            set({ filters: { ...get().filters, ...cloudSettings.filters } })
          }
        }
      },

      startNewChat: () => set({ messages: [], currentSessionId: null }),
      
      loadSession: (id) => {
        const session = get().sessions.find(s => s.id === id);
        if (session) {
          set({ currentSessionId: id, messages: session.messages });
        }
      },

      addMessage: (msg) => set((state) => {
        const newMessages = [...state.messages, msg];
        
        let sessions = [...state.sessions];
        let currId = state.currentSessionId;
        
        if (!currId) {
          currId = Date.now();
          const title = (() => { const c = newMessages.find(m => m.role === 'user')?.content; return (typeof c === 'string' ? c : JSON.stringify(c) || '').substring(0, 28) + '...'; })() || 'New Chat';
          sessions.unshift({ id: currId, title, messages: newMessages });
        } else {
          const idx = sessions.findIndex(s => s.id === currId);
          if (idx !== -1) {
            sessions[idx].messages = newMessages;
          } else {
            const title = (() => { const c = newMessages.find(m => m.role === 'user')?.content; return (typeof c === 'string' ? c : JSON.stringify(c) || '').substring(0, 28) + '...'; })() || 'New Chat';
            sessions.unshift({ id: currId, title, messages: newMessages });
          }
        }

        // Sync to cloud
        syncSessionsToCloud(state._userId, sessions)
        
        return { messages: newMessages, sessions, currentSessionId: currId };
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      deleteSession: (id) => {
        const state = get()
        const sessions = state.sessions.filter(s => s.id !== id)
        const isCurrent = state.currentSessionId === id
        
        // Delete from cloud
        deleteSessionFromCloud(state._userId, id)
        
        set({
          sessions,
          ...(isCurrent ? { messages: [], currentSessionId: null } : {})
        })
      }
    }),
    {
      name: 'pharmai-chat-storage',
      partialize: (state) => ({ 
        groqKey: state.groqKey, 
        sessions: state.sessions,
        filters: state.filters
      }),
    }
  )
)
