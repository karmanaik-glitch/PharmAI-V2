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
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="mov open" onClick={(e) => { if (e.target.classList.contains('mov')) onClose() }}
        >
          <motion.div 
            initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="msh" onClick={e => e.stopPropagation()}
          >
            <div className="mhdr">
              <div className="mtitle"><span className="ms md">settings</span> Settings</div>
              <button className="mclose" onClick={onClose}><span className="ms sm">close</span></button>
            </div>
            
            <div className="mbody">
              {/* Account / API */}
              <div className="sg">
                <div className="sg-title">Account</div>
                <div className="si">
                  <div className="si-l">
                    <div className="si-label">{user.displayName || 'Guest'}</div>
                    <div className="si-desc">{user.isAnonymous ? 'Guest Session' : user.email}</div>
                  </div>
                  {user.isAnonymous && <button className="dbtn" onClick={handleLogout} style={{color: 'var(--blue)', borderColor: 'rgba(56,189,248,0.3)', background: 'var(--bdim)'}}>Sign Up</button>}
                </div>
              </div>

              <div className="sg">
                <div className="sg-title">API Configuration</div>
                <div className="si" style={{flexDirection: 'column', alignItems: 'stretch', gap: '8px', borderBottom: 'none'}}>
                  <input 
                    type="password" 
                    className="finp" 
                    placeholder="Groq API Key (gsk_...)" 
                    value={apiKeyInput} 
                    onChange={e => setApiKeyInput(e.target.value)} 
                  />
                  <button className="bkbtn exp" onClick={handleSaveKey} disabled={loading} style={{marginTop: '4px'}}>
                    {loading ? <span className="ms sm animate-spin">progress_activity</span> : <span className="ms sm">save</span>} 
                    Save Key
                  </button>
                </div>
              </div>

              {/* Appearance */}
              <div className="sg">
                <div className="sg-title">Appearance</div>
                <div className="si">
                  <div className="si-l"><div className="si-label">Theme</div><div className="si-desc">Color scheme</div></div>
                  <div className="tpills">
                    <button className="tp-pill active"><span className="ms xs">desktop_windows</span> Auto</button>
                    <button className="tp-pill"><span className="ms xs">light_mode</span> Light</button>
                    <button className="tp-pill"><span className="ms xs">dark_mode</span> Dark</button>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="sg">
                <div className="sg-title">Feedback</div>
                <div className="si">
                  <div className="si-l"><div className="si-label">Haptic & Audio</div><div className="si-desc">Vibration and UI sounds</div></div>
                  <label className="stgl">
                    <input type="checkbox" defaultChecked />
                    <div className="stgl-t"></div><div className="stgl-th"></div>
                  </label>
                </div>
              </div>

              {/* Data */}
              <div className="sg">
                <div className="sg-title">Data</div>
                <button className="bkbtn exp"><span className="ms sm">download</span> Export All Data (Backup)</button>
                <div style={{position:'relative', marginBottom:'10px'}}>
                  <input type="file" accept=".json" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}}/>
                  <button className="bkbtn imp" style={{marginBottom:0}}><span className="ms sm">upload</span> Restore from Backup</button>
                </div>
                <div className="si"><div className="si-l"><div className="si-label" style={{color:'var(--danger)'}}>Clear Chat History</div><div className="si-desc">Removes all conversations</div></div><button className="dbtn">Clear</button></div>
              </div>

              {/* Danger / Logout */}
              <div className="si" style={{borderTop:'1px solid var(--b)', paddingTop:'16px', marginTop:'4px'}}>
                <div className="si-l"><div className="si-label">Account actions</div><div className="si-desc">—</div></div>
                <button className="dbtn" onClick={handleLogout}>Logout</button>
              </div>

              <div className="si">
                <div className="si-l"><div className="si-label" style={{color:'var(--danger)'}}>Delete Account</div><div className="si-desc">Permanently deletes your account & all data</div></div>
                <button className="dbtn" onClick={handleDeleteAccount}>Delete</button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
