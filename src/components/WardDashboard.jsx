import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useWardStore } from '../store/wardStore'
import { CDSSWizard } from './CDSSWizard'

export function WardDashboard() {
  const { isWardOpen, setWardOpen, activeTab, setActiveTab, patients, setActiveCase } = useWardStore()
  const [showWiz, setShowWiz] = useState(false)

  const filteredPatients = patients.filter(p => p.status === activeTab)

  return (
    <AnimatePresence>
      {isWardOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWardOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%', boxShadow: 'none' }}
            animate={{ x: 0, boxShadow: '-20px 0 80px rgba(0,0,0,0.5)' }}
            exit={{ x: '100%', boxShadow: 'none' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[480px] h-screen bg-card/95 backdrop-blur-2xl border-l border-b1 z-50 flex flex-col"
          >
            {/* WARD HEADER */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-b1 shrink-0 bg-background/50">
              <div className="font-extrabold text-[17px] tracking-tight">Ward Dashboard</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowWiz(true)}
                  className="w-9 h-9 rounded-[10px] bg-primary text-background flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/5"
                >
                  <span className="ms sm">person_add</span>
                </button>
                <button 
                  onClick={() => setWardOpen(false)}
                  className="w-9 h-9 rounded-[10px] bg-transparent text-t2 flex items-center justify-center hover:bg-b1/30 hover:text-primary transition-all"
                >
                  <span className="ms sm">close</span>
                </button>
              </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 p-4 border-b border-b1 shrink-0">
              <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'active' ? 'bg-blue/15 text-blue' : 'text-t2 hover:bg-b1/30'}`}
              >
                Active Cases
              </button>
              <button 
                onClick={() => setActiveTab('closed')}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'closed' ? 'bg-white/10 text-primary' : 'text-t2 hover:bg-b1/30'}`}
              >
                Closed Cases
              </button>
            </div>

            {/* PATIENT LIST */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <span className="ms xxl text-b2 block mb-4">local_hospital</span>
                  <div className="font-bold text-primary mb-2">Ward is clear</div>
                  <div className="text-[13.5px] text-muted">Tap Admit to add your first patient.</div>
                </div>
              ) : (
                filteredPatients.map(p => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={p.id}
                    onClick={() => setActiveCase(p.id)}
                    className={`bg-card border border-b1 rounded-xl p-4 cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-95 border-l-4 ${p.status === 'active' ? 'border-l-primary' : 'border-l-t2 opacity-70'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-[17px] text-primary">{p.name}</div>
                      <div className="bg-blue/10 text-blue px-2 py-1 rounded-md text-[12px] font-bold tracking-wider uppercase border border-blue/20">
                        {p.bedId}
                      </div>
                    </div>
                    <div className="text-[13.5px] text-t2 flex flex-wrap gap-3 leading-relaxed">
                      <span>{p.age}y {p.sex}</span>
                      <span>{p.weight} kg</span>
                      <span className="truncate max-w-[200px]">CC: {p.cc}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
          <CDSSWizard isOpen={showWiz} onClose={() => setShowWiz(false)} />
        </>
      )}
    </AnimatePresence>
  )
}
