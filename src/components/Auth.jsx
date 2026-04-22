import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { auth, db } from '../services/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useWardStore } from '../store/wardStore'

export function AuthWrapper({ children }) {
  const { user, isAuthenticated, isAuthLoaded, setUser, setAuthLoaded } = useAuthStore()

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        if (!fbUser.displayName && !fbUser.isAnonymous) {
          // If a new email user has no display name, we hold off on full auth
          setUser({ ...fbUser, needsName: true })
        } else {
          setUser(fbUser)
          // Trigger Supabase cloud sync
          const uid = fbUser.uid
          useChatStore.getState().initSync(uid)
          useWardStore.getState().initSync(uid)
        }
      } else {
        setUser(null)
      }
      setAuthLoaded(true)
    })
    return unsub
  }, [setUser, setAuthLoaded])

  if (!isAuthLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-t2">
        <div className="flex flex-col items-center gap-4">
          <span className="ms md animate-spin text-primary">progress_activity</span>
          <div className="text-sm font-bold tracking-wider uppercase">Loading PharmAI...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated && !user.needsName) {
    return children
  }

  return <AuthScreen user={user} setUser={setUser} />
}

function AuthScreen({ user, setUser }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass)
      } else {
        await createUserWithEmailAndPassword(auth, email, pass)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    setError('')
    try {
      await signInAnonymously(auth)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) { setError("Please enter your email to reset password."); return }
    try {
      await sendPasswordResetEmail(auth, email)
      alert("Password reset email sent!")
    } catch (err) {
      setError(err.message)
    }
  }

  const saveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      if (!auth.currentUser.isAnonymous) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { name }, { merge: true })
      }
      setUser({ ...auth.currentUser, displayName: name, needsName: false })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // If user signed up but needs a display name
  if (user?.needsName) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card/80 backdrop-blur-2xl border border-b1 rounded-3xl p-8 max-w-sm w-full z-10 shadow-2xl">
          <div className="w-14 h-14 bg-primary text-background rounded-2xl flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(56,189,248,0.25)]">
            <span className="ms xl fill">badge</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Welcome to PharmAI</h1>
          <p className="text-sm text-t2 mb-6">What should we call you in the clinical workspace?</p>
          
          <form onSubmit={saveName} className="flex flex-col gap-4">
            {error && <div className="text-danger text-sm font-semibold bg-danger/10 p-3 rounded-lg border border-danger/20">{error}</div>}
            <input 
              required
              placeholder="Dr. Smith / Pharmacist Jane" 
              className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors text-[15px]" 
              value={name} onChange={e => setName(e.target.value)} 
            />
            <button disabled={loading} type="submit" className="w-full bg-blue text-white rounded-xl font-bold text-[15px] py-3.5 hover:shadow-[0_8px_24px_rgba(56,189,248,0.25)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="ms sm animate-spin">progress_activity</span> : <span className="ms sm">check</span>}
              Save Profile
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Main Login Screen
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card/80 backdrop-blur-2xl border border-b1 rounded-3xl p-8 max-w-sm w-full z-10 shadow-2xl">
        <div className="w-14 h-14 bg-primary text-background rounded-2xl flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(56,189,248,0.25)]">
          <span className="ms xl fill">cardiology</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h1>
        <p className="text-sm text-t2 mb-6">Enter the clinical decision workspace.</p>
        
        {error && <div className="text-danger text-[13px] font-semibold bg-danger/10 p-3 rounded-lg border border-danger/20 mb-4 flex items-start gap-2"><span className="ms sm shrink-0">error</span>{error}</div>}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <input required type="email" placeholder="Clinical Email" className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors text-[15px]" value={email} onChange={e => setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors text-[15px]" value={pass} onChange={e => setPass(e.target.value)} />
          </div>
          
          <button disabled={loading} type="submit" className="w-full mt-2 bg-primary text-background rounded-xl font-bold text-[15px] py-3.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="ms sm animate-spin">progress_activity</span> : <span className="ms sm">{isLogin ? 'login' : 'person_add'}</span>}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-b2" />
          <span className="text-xs font-bold text-muted uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-b2" />
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleGoogle} disabled={loading} className="w-full bg-card2 border border-b2 text-t2 rounded-xl font-semibold text-[14px] py-3 hover:border-primary hover:text-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          
          <button onClick={handleGuest} disabled={loading} className="w-full bg-card border border-b1 text-muted rounded-xl font-semibold text-[13px] py-2.5 hover:text-t2 transition-all disabled:opacity-50">
            Continue as Guest
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-[13px] text-muted">
          <div>
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-1 text-primary font-bold hover:underline">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
          {isLogin && <button onClick={handleReset} className="hover:text-t2 transition-colors">Forgot Password?</button>}
        </div>

      </motion.div>
    </div>
  )
}
