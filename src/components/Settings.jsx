import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { auth, db } from '../services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { deleteUser, signOut } from 'firebase/auth'

export function SettingsModal({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const { groqKey, setGroqKey } = useChatStore()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setApiKeyInput(groqKey)
      // Check firestore for key if not in local
      if (!groqKey && !user.isAnonymous) {
        getDoc(doc(db, 'config', 'keys')).then(cfg => {
          if (cfg.exists()) {
            setGroqKey(cfg.data().groq || '')
            setApiKeyInput(cfg.data().groq || '')
          }
        })
      }
    }
  }, [isOpen, user, groqKey, setGroqKey])

  if (!user) return null

  const handleSaveKey = async () => {
    setLoading(true)
    setGroqKey(apiKeyInput)
    if (!user.isAnonymous) {
      try {
        await setDoc(doc(db, 'config', 'keys'), { groq: apiKeyInput }, { merge: true })
      } catch (e) {
        console.warn("Failed to save to firestore", e)
      }
    }
    setLoading(false)
    onClose()
  }

  const handleLogout = async () => {
    if (user.isAnonymous) {
      try { await deleteUser(auth.currentUser) } catch(e) {}
    }
    await signOut(auth)
    logout()
    onClose()
  }

  const handleDeleteAccount = async () => {
    if (confirm("Permanently delete your account and all data? This cannot be undone.")) {
      try {
        await deleteUser(auth.currentUser)
        logout()
        onClose()
      } catch (e) {
        if (e.code === 'auth/requires-recent-login') {
          alert('Please log out and sign in again before deleting.')
        } else {
          alert('Delete failed: ' + e.message)
        }
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-b1 rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-b1 bg-card2/50">
              <div className="font-bold text-lg flex items-center gap-2 text-primary">
                <span className="ms">settings</span> Settings
              </div>
              <button onClick={onClose} className="text-t2 hover:text-danger"><span className="ms">close</span></button>
            </div>

            <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              
              {/* Account Section */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Account</label>
                <div className="bg-card2 border border-b2 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-background font-bold text-xl shrink-0 shadow-lg">
                      {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[16px] text-primary">{user.displayName || 'Guest'}</div>
                      <div className="text-[12px] text-muted">{user.isAnonymous ? 'Guest Session' : user.email}</div>
                    </div>
                  </div>
                  {user.isAnonymous && (
                    <button onClick={handleLogout} className="w-full bg-ok/10 text-ok border border-ok/30 rounded-xl font-bold text-[13px] py-2.5 transition-colors hover:bg-ok/20">
                      Create Full Account
                    </button>
                  )}
                </div>
              </div>

              {/* API Key */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">API Configuration</label>
                <div className="bg-card2 border border-b2 rounded-2xl p-4 flex flex-col gap-3">
                  <input 
                    type="password" 
                    className="w-full bg-background border border-b1 rounded-xl px-4 py-2.5 outline-none focus:border-blue transition-colors text-[13px]" 
                    placeholder="gsk_..." 
                    value={apiKeyInput} 
                    onChange={e => setApiKeyInput(e.target.value)} 
                  />
                  <button 
                    onClick={handleSaveKey} disabled={loading}
                    className="w-full bg-blue text-white rounded-xl font-bold text-[13px] py-2.5 shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="ms sm animate-spin">progress_activity</span> : <span className="ms sm">save</span>}
                    Save Key
                  </button>
                </div>
              </div>

              {/* Appearance */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Appearance</label>
                <div className="bg-card2 border border-b2 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[14px] font-bold text-primary">Theme</div>
                    <div className="text-[12px] text-muted">Color scheme</div>
                    <div className="flex bg-background border border-b1 rounded-xl p-1 mt-2">
                      <button className="flex-1 py-1.5 text-[12px] font-bold rounded-lg bg-card text-primary shadow-sm">Auto</button>
                      <button className="flex-1 py-1.5 text-[12px] font-bold rounded-lg text-t2 hover:text-primary">Light</button>
                      <button className="flex-1 py-1.5 text-[12px] font-bold rounded-lg text-t2 hover:text-primary">Dark</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Feedback</label>
                <div className="bg-card2 border border-b2 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[14px] font-bold text-primary">Haptic & Audio</div>
                    <div className="text-[12px] text-muted">Vibration and UI sounds</div>
                  </div>
                  <div className="relative w-12 h-6 bg-blue rounded-full">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Data Management</label>
                <div className="bg-card2 border border-b2 rounded-2xl p-4 flex flex-col gap-4">
                  <button className="w-full bg-background border border-b1 text-t2 rounded-xl font-bold text-[13px] py-2.5 transition-colors hover:text-primary hover:border-b2 flex items-center justify-center gap-2">
                    <span className="ms sm">upload</span> Restore from Backup
                  </button>
                  <div className="h-px w-full bg-b1"></div>
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-bold text-danger">Clear Chat History</div>
                    <button className="text-[12px] font-bold bg-danger/10 text-danger px-3 py-1.5 rounded-lg hover:bg-danger/20 transition-colors">Clear</button>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-card2/50 border-t border-b1 flex flex-col gap-2 shrink-0">
              <button onClick={handleLogout} className="w-full py-2.5 rounded-xl text-[13px] font-bold text-t2 bg-card border border-b1 hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <span className="ms sm">logout</span> Log Out
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
