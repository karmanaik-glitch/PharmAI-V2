import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from './store/chatStore'
import { sendToGroq } from './services/groqService'
import { ChatMessage } from './components/ChatMessage'
import { ChatInput } from './components/ChatInput'
import { WardDashboard } from './components/WardDashboard'
import { PatientFile } from './components/PatientFile'
import { Calculators } from './components/Calculators'
import { SettingsModal } from './components/Settings'
import { useWardStore } from './store/wardStore'
import { useAuthStore } from './store/authStore'
import { Sounds } from './utils/audio'

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isCalcsOpen, setCalcsOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [searchQuery, setSearchQuery] = useState('')
  const chatEndRef = useRef(null)

  const { user } = useAuthStore()

  const { 
    messages, addMessage, 
    isLoading, setLoading,
    startNewChat, sessions,
    loadSession, deleteSession,
    filters, toggleFilter
  } = useChatStore()

  const { setWardOpen, patients } = useWardStore()
  const activePatientsCount = patients.filter(p => p.status === 'active').length

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Dynamic greeting
  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  }
  const userName = user?.displayName || 'Doctor'

  const handleSend = async (payload) => {
    const isObj = typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    const queryText = isObj ? payload.text : payload
    const queryImage = isObj ? payload.image : null

    addMessage({ role: 'user', content: queryText })
    setLoading(true)

    try {
      const formattedHist = messages.slice(-4).map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      }))

      const response = await sendToGroq(queryText, formattedHist, filters, queryImage)
      addMessage({ role: 'assistant', content: response })
    } catch (error) {
      addMessage({ role: 'assistant', content: error.message, isError: true })
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = searchQuery 
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {!isOnline && (
        <div className="bg-warn/10 border-b border-warn/30 text-warn px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 z-50">
          <span className="ms xs">wifi_off</span> Offline Mode — Changes saved locally
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between p-4 px-6 z-10 border-b border-b1 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { Sounds.play('tick'); setSidebarOpen(true) }}
            className="text-t2 hover:bg-b1/30 hover:text-primary p-2 rounded-xl transition-all"
          >
            <span className="ms md">menu</span>
          </button>
          
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-background shadow-lg shadow-white/10 cursor-pointer">
            <span className="ms md fill">cardiology</span>
          </div>
          
          <div>
            <div className="font-extrabold tracking-tight text-lg leading-none">PharmAI</div>
            <div className="text-[10px] text-t2 mt-0.5 font-semibold uppercase tracking-wider">Clinical Assistant</div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button 
            onClick={() => { Sounds.play('tick'); setWardOpen(true) }}
            className="bg-card border border-b1 text-t2 rounded-xl w-10 h-10 flex items-center justify-center hover:-translate-y-0.5 hover:bg-blue/10 hover:text-primary transition-all relative"
            title="Ward Dashboard"
          >
            <span className="ms sm">local_hospital</span>
            {activePatientsCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {activePatientsCount}
              </div>
            )}
          </button>
          <button 
            onClick={() => { Sounds.play('tick'); setCalcsOpen(true) }}
            className="bg-card border border-b1 text-t2 rounded-xl w-10 h-10 flex items-center justify-center hover:-translate-y-0.5 hover:bg-blue/10 hover:text-primary transition-all"
            title="Calculators"
          >
            <span className="ms sm">calculate</span>
          </button>
          <button 
            onClick={() => { Sounds.play('tick'); setSettingsOpen(true) }}
            className="bg-card border border-b1 text-t2 rounded-xl w-10 h-10 flex items-center justify-center hover:-translate-y-0.5 hover:bg-blue/10 hover:text-primary transition-all"
            title="Settings"
          >
            <span className="ms sm">settings</span>
          </button>
          <button 
            onClick={() => { Sounds.play('tick'); setSettingsOpen(true) }}
            className="w-[34px] h-[34px] rounded-full bg-primary flex items-center justify-center text-background font-bold text-sm cursor-pointer transition-transform hover:scale-105"
          >
            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </button>
        </div>
      </header>

      {/* FILTER BAR — Toggle Switches matching original design */}
      <div className="flex gap-2 p-2.5 px-6 border-b border-b1 shrink-0 overflow-x-auto justify-start hide-scrollbar bg-background z-10">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center whitespace-nowrap mr-1">Filters</span>
        {[
          { key: 'preg', icon: 'pregnant_woman', label: 'Pregnancy' },
          { key: 'peds', icon: 'child_care', label: 'Pediatric' },
          { key: 'geri', icon: 'elderly', label: 'Geriatric' },
        ].map(f => (
          <div 
            key={f.key}
            onClick={() => { toggleFilter(f.key); Sounds.play('tick') }}
            className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full border cursor-pointer transition-all select-none whitespace-nowrap min-h-[36px] active:scale-[0.93] ${filters[f.key] ? 'bg-blue/10 border-blue/25 text-blue' : 'bg-card border-b1 text-t2'}`}
          >
            <span className={`ms xs transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.icon}</span>
            {/* Toggle Track */}
            <div className={`relative w-8 h-[18px] rounded-[9px] transition-colors shrink-0 ${filters[f.key] ? 'bg-blue' : 'bg-b2'}`}>
              <div className={`absolute w-3 h-3 rounded-full bg-white top-[3px] shadow-sm transition-transform ${filters[f.key] ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
            </div>
            <span className={`text-xs font-semibold transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.label}</span>
          </div>
        ))}
        <div className="w-[1px] h-[22px] bg-b1 self-center shrink-0 mx-0.5" />
        {[
          { key: 'counsel', icon: 'chat_bubble', label: 'Counseling' },
        ].map(f => (
          <div 
            key={f.key}
            onClick={() => { toggleFilter(f.key); Sounds.play('tick') }}
            className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full border cursor-pointer transition-all select-none whitespace-nowrap min-h-[36px] active:scale-[0.93] ${filters[f.key] ? 'bg-blue/10 border-blue/25 text-blue' : 'bg-card border-b1 text-t2'}`}
          >
            <span className={`ms xs transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.icon}</span>
            <div className={`relative w-8 h-[18px] rounded-[9px] transition-colors shrink-0 ${filters[f.key] ? 'bg-blue' : 'bg-b2'}`}>
              <div className={`absolute w-3 h-3 rounded-full bg-white top-[3px] shadow-sm transition-transform ${filters[f.key] ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
            </div>
            <span className={`text-xs font-semibold transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.label}</span>
          </div>
        ))}
        <div className="w-[1px] h-[22px] bg-b1 self-center shrink-0 mx-0.5" />
        {[
          { key: 'steward', icon: 'shield', label: 'Stewardship' },
        ].map(f => (
          <div 
            key={f.key}
            onClick={() => { toggleFilter(f.key); Sounds.play('tick') }}
            className={`flex items-center gap-[7px] px-3 py-1.5 rounded-full border cursor-pointer transition-all select-none whitespace-nowrap min-h-[36px] active:scale-[0.93] ${filters[f.key] ? 'bg-blue/10 border-blue/25 text-blue' : 'bg-card border-b1 text-t2'}`}
          >
            <span className={`ms xs transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.icon}</span>
            <div className={`relative w-8 h-[18px] rounded-[9px] transition-colors shrink-0 ${filters[f.key] ? 'bg-blue' : 'bg-b2'}`}>
              <div className={`absolute w-3 h-3 rounded-full bg-white top-[3px] shadow-sm transition-transform ${filters[f.key] ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
            </div>
            <span className={`text-xs font-semibold transition-colors ${filters[f.key] ? 'text-blue' : 'text-t2'}`}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '-100%', boxShadow: 'none' }}
              animate={{ x: 0, boxShadow: '20px 0 80px rgba(0,0,0,0.5)' }}
              exit={{ x: '-100%', boxShadow: 'none' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-[280px] h-screen bg-card/90 backdrop-blur-2xl border-r border-b1 z-50 flex flex-col"
            >
              <div className="p-5 border-b border-b1 flex flex-col gap-3">
                <div className="flex items-center gap-3 py-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setSidebarOpen(false); setSettingsOpen(true); }}>
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-background font-bold text-lg shrink-0">
                    {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-[15px] tracking-tight truncate max-w-[150px]">{user?.displayName || 'Guest'}</div>
                    <div className="text-[11px] text-t2 font-semibold uppercase tracking-wider mt-0.5 truncate max-w-[150px]">{user?.email || 'Clinical User'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => { startNewChat(); setSidebarOpen(false); }}
                  className="bg-primary text-background border-none rounded-full px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 w-full active:scale-95 transition-transform hover:shadow-lg hover:shadow-white/10"
                >
                  <span className="ms sm">add</span> New Chat
                </button>
                {/* Search chats */}
                <input
                  type="search"
                  placeholder="Search chats…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card2 border border-b2 rounded-full px-4 py-2 text-[13px] outline-none focus:border-blue placeholder:text-muted"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
                {filteredSessions.length === 0 && sessions.length > 0 && (
                  <div className="text-center py-5 text-sm text-muted">No matches found.</div>
                )}
                {filteredSessions.map(s => (
                  <div 
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors text-t2 hover:text-primary group"
                  >
                    <div 
                      className="flex items-center gap-2 flex-1 overflow-hidden"
                      onClick={() => { loadSession(s.id); setSidebarOpen(false); }}
                    >
                      <span className="ms xs">chat</span>
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                      className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    >
                      <span className="ms xs">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto flex flex-col relative px-4 py-6 scroll-smooth">
        <div className="max-w-[800px] w-full mx-auto flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* ═══ WELCOME STATE — matches original exactly ═══ */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-[68px] h-[68px] bg-primary rounded-[20px] flex items-center justify-center text-background mb-6 shadow-[var(--logo-shadow)]"
              >
                <span className="ms lg fill">cardiology</span>
              </motion.div>
              
              <div className="text-[1.8rem] font-extrabold tracking-tight mb-2 leading-tight">
                <motion.span initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-block">
                  {getGreeting().split(' ')[0]}&nbsp;
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="inline-block">
                  {getGreeting().split(' ')[1]},&nbsp;
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="inline-block text-blue">
                  {userName}.
                </motion.span>
              </div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="text-t2 text-[0.9rem] max-w-[280px] leading-relaxed mb-2"
              >
                How can I assist you today?
              </motion.p>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-muted text-[0.74rem] mb-7"
              >
                You can ask follow-up questions naturally.
              </motion.p>
              
              {/* 4-card quick-prompt grid — matches original */}
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.9 }}
                className="grid grid-cols-2 gap-3 w-full max-w-[400px]"
              >
                <button 
                  onClick={() => handleSend("Analyze polypharmacy interactions — clinical significance, mechanism, and monitoring parameters")}
                  className="bg-card border border-b1 rounded-[20px] p-5 flex flex-col items-center gap-[10px] text-t2 text-[0.82rem] font-semibold hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-white/5 transition-all min-h-[88px]"
                  style={{ animationDelay: '0.9s' }}
                >
                  <span className="ms lg">monitor_heart</span>
                  Drug Interactions
                </button>
                <button 
                  onClick={() => handleSend("Beers Criteria — high-risk medications to avoid in elderly patients")}
                  className="bg-card border border-b1 rounded-[20px] p-5 flex flex-col items-center gap-[10px] text-t2 text-[0.82rem] font-semibold hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-white/5 transition-all min-h-[88px]"
                  style={{ animationDelay: '1.0s' }}
                >
                  <span className="ms lg">elderly</span>
                  Beers Criteria
                </button>
                <button 
                  onClick={() => handleSend("Standard pediatric dose for Amoxicillin 40mg/kg/day?")}
                  className="bg-card border border-b1 rounded-[20px] p-5 flex flex-col items-center gap-[10px] text-t2 text-[0.82rem] font-semibold hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-white/5 transition-all min-h-[88px]"
                  style={{ animationDelay: '1.1s' }}
                >
                  <span className="ms lg">child_care</span>
                  Peds Dosing
                </button>
                <button 
                  onClick={() => { Sounds.play('tick'); setCalcsOpen(true) }}
                  className="bg-card border border-b1 rounded-[20px] p-5 flex flex-col items-center gap-[10px] text-t2 text-[0.82rem] font-semibold hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-white/5 transition-all min-h-[88px]"
                  style={{ animationDelay: '1.2s' }}
                >
                  <span className="ms lg">water_drop</span>
                  eGFR Calc
                </button>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col pt-4 pb-2">
              {messages.map((m, i) => (
                <ChatMessage key={i} msg={m} onRegenerate={() => {
                  if (i > 0 && messages[i-1].role === 'user') {
                    handleSend(messages[i-1].content)
                  }
                }} filters={filters} />
              ))}
              {isLoading && <ChatMessage msg={{ isLoading: true }} />}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM INPUT PANEL */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {/* WARD DASHBOARD */}
      <WardDashboard />
      <PatientFile />

      {/* CALCULATORS MODAL */}
      <Calculators isOpen={isCalcsOpen} onClose={() => setCalcsOpen(false)} />

      {/* SETTINGS MODAL */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

    </div>
  )
}

export default App
