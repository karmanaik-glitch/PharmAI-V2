import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useWardStore } from '../store/wardStore'
import { CDSSWizard } from './CDSSWizard'

export function PatientFile() {
  const { patients, activeCaseId, setActiveCase, closeCase, reopenCase } = useWardStore()
  const [showWiz, setShowWiz] = useState(false)
  const [showDischarge, setShowDischarge] = useState(false)
  const [showADR, setShowADR] = useState(false)
  
  // ADR State
  const [adr, setAdr] = useState({ drug: '', rxn: '', onset: '', outcome: 'Recovering' })
  // Discharge State
  const [dxOutcome, setDxOutcome] = useState('Discharged')

  if (!activeCaseId) return null

  const pt = patients.find(p => p.id === activeCaseId)
  if (!pt) return null

  const renderSOAPHTML = (data) => {
    try {
      const soap = data.soap || data; // handle nested or direct
      const sS = soap.S || {}
      const sO = soap.O || {}
      const sA = soap.A || {}
      const sP = soap.P || {}
      
      const sContent = `<div class="mb-1.5"><strong>Chief Complaint:</strong> ${sS.chief_complaint || 'N/A'}</div><div><strong>History:</strong> ${sS.history || 'N/A'}</div>`
      
      const oContent = `
        <div class="mb-2"><strong>Vitals:</strong> ${sO.vitals || 'N/A'}</div>
        <div class="mb-2"><strong>Labs:</strong> ${sO.labs || 'N/A'}</div>
      `

      const drpItems = Array.isArray(sA.drug_related_problems) 
        ? sA.drug_related_problems.map(drp => `
          <div class="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-2 flex flex-col gap-1">
            <div class="font-bold text-[10px] uppercase text-danger">${drp.category || 'Issue'} [${drp.severity || 'UNKNOWN'} RISK]</div>
            <div class="text-danger text-sm"><strong>Issue:</strong> ${drp.issue || '-'}</div>
            <div class="text-danger text-sm"><strong>Intervention:</strong> ${drp.actionable_solution || '-'}</div>
          </div>
        `).join('')
        : '<div class="text-muted text-sm">No drug-related problems identified.</div>'

      const aContent = `<div class="mt-2"><strong class="text-xs uppercase tracking-wider">Drug-Related Problems</strong><div class="mt-2">${drpItems}</div></div>`
      
      const pContent = `
        <div class="mb-2"><strong>Interventions:</strong><ul class="list-disc pl-5 mt-1">
          ${(sP.pharmacist_interventions || []).map(i => `<li>${i}</li>`).join('')}
        </ul></div>
        <div class="mb-2"><strong>Monitoring:</strong><ul class="list-disc pl-5 mt-1">
          ${(sP.monitoring_plan || []).map(i => `<li>${i}</li>`).join('')}
        </ul></div>
      `

      return `
        <div class="flex flex-col gap-3 print:gap-1">
          <div class="flex gap-3 items-start"><div class="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 font-bold print:bg-transparent print:text-black">S</div><div class="text-sm pt-1 print:text-black">${sContent}</div></div>
          <div class="w-full h-px bg-b1 my-1 print:bg-gray-300"></div>
          <div class="flex gap-3 items-start"><div class="w-8 h-8 rounded-lg bg-blue text-white flex items-center justify-center shrink-0 font-bold print:bg-transparent print:text-black">O</div><div class="text-sm pt-1 print:text-black">${oContent}</div></div>
          <div class="w-full h-px bg-b1 my-1 print:bg-gray-300"></div>
          <div class="flex gap-3 items-start"><div class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold print:bg-transparent print:text-black">A</div><div class="text-sm pt-1 w-full print:text-black">${aContent}</div></div>
          <div class="w-full h-px bg-b1 my-1 print:bg-gray-300"></div>
          <div class="flex gap-3 items-start"><div class="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold print:bg-transparent print:text-black">P</div><div class="text-sm pt-1 print:text-black">${pContent}</div></div>
        </div>
      `
    } catch (e) {
      return '<div class="text-danger">Error rendering SOAP note format.</div>'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleADRSubmit = () => {
    if (!adr.drug || !adr.rxn) return
    const newEvent = { date: new Date().toISOString(), type: 'adr', data: adr }
    useWardStore.getState().updatePatient(pt.id, { timeline: [newEvent, ...(pt.timeline || [])] })
    setShowADR(false)
    setAdr({ drug: '', rxn: '', onset: '', outcome: 'Recovering' })
  }

  const handleDischargeSubmit = () => {
    const newEvent = { date: new Date().toISOString(), type: 'discharge', data: { outcome: dxOutcome } }
    useWardStore.getState().updatePatient(pt.id, { timeline: [newEvent, ...(pt.timeline || [])] })
    closeCase(pt.id)
    setShowDischarge(false)
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-background z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 px-6 border-b border-b1 shrink-0 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveCase(null)}
              className="w-10 h-10 rounded-xl bg-card border border-b1 flex items-center justify-center hover:bg-b1/30 transition-all text-t2"
            >
              <span className="ms sm">arrow_back</span>
            </button>
            <div>
              <div className="font-extrabold tracking-tight text-lg flex items-center gap-3">
                {pt.name}
                <div className="bg-blue/10 text-blue px-2 py-1 rounded-md text-[12px] font-bold tracking-wider uppercase border border-blue/20">
                  BED: {pt.bedId}
                </div>
                {pt.status === 'closed' && (
                  <div className="bg-danger/10 text-danger px-2 py-1 rounded-md text-[12px] font-bold tracking-wider uppercase border border-danger/20">
                    CLOSED
                  </div>
                )}
              </div>
              <div className="text-[12px] text-t2 font-semibold tracking-wide mt-0.5">
                {pt.age}y {pt.sex} &middot; {pt.weight}kg &middot; CC: {pt.cc}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {pt.status === 'active' ? (
              <>
                <button onClick={() => setShowWiz(true)} className="px-3 py-2 rounded-xl bg-card border border-b1 text-primary font-semibold text-sm hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                  <span className="ms sm">edit_note</span> Add Progress
                </button>
                <button onClick={() => setShowADR(true)} className="px-3 py-2 rounded-xl bg-card border border-b1 text-warn font-semibold text-sm hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                  <span className="ms sm">warning</span> Report ADR
                </button>
                <button onClick={() => setShowDischarge(true)} className="px-3 py-2 rounded-xl bg-danger text-white font-semibold text-sm shadow-lg shadow-danger/20 hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                  <span className="ms sm">logout</span> Discharge
                </button>
              </>
            ) : (
              <button onClick={() => reopenCase(pt.id)} className="px-4 py-2 rounded-xl bg-card border border-b1 text-primary font-semibold text-sm hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                <span className="ms sm">lock_open</span> Reopen Case
              </button>
            )}
            <button onClick={handlePrint} className="w-10 h-10 rounded-xl bg-card border border-b1 flex items-center justify-center hover:bg-b1/30 transition-all text-t2 ml-2 print:hidden">
              <span className="ms sm">print</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
          {(!pt.timeline || pt.timeline.length === 0) ? (
            <div className="text-center py-20 text-muted">
              <span className="ms xl mb-4 block">description</span>
              <p>No SOAP notes generated for this patient yet.</p>
            </div>
          ) : (
            pt.timeline.map((event, idx) => (
              <div key={idx} className={`bg-card border rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-l-4 ${event.type === 'adr' ? 'border-warn border-l-warn' : event.type === 'discharge' ? 'border-danger border-l-danger' : 'border-b1 border-l-primary'}`}>
                <div className="px-5 py-3 border-b border-b1 bg-card2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-t2 print:text-black">
                  <span className={`ms sm ${event.type==='adr'?'text-warn':event.type==='discharge'?'text-danger':'text-primary'}`}>
                    {event.type === 'adr' ? 'warning' : event.type === 'discharge' ? 'logout' : 'description'}
                  </span> 
                  {event.type === 'adr' ? 'ADR Report' : event.type === 'discharge' ? 'Discharge Summary' : 'SOAP Note'} &bull; {new Date(event.date).toLocaleString()}
                </div>
                {event.type === 'soap' && <div className="p-6" dangerouslySetInnerHTML={{ __html: renderSOAPHTML(event.data) }} />}
                {event.type === 'adr' && (
                  <div className="p-6 flex flex-col gap-2">
                    <div><strong>Suspected Drug:</strong> <span className="text-warn font-bold">{event.data.drug}</span></div>
                    <div><strong>Reaction:</strong> {event.data.rxn}</div>
                    <div><strong>Onset:</strong> {event.data.onset}</div>
                    <div><strong>Outcome:</strong> {event.data.outcome}</div>
                  </div>
                )}
                {event.type === 'discharge' && (
                  <div className="p-6 flex flex-col gap-2">
                    <div className="text-xl font-extrabold text-danger">Case Closed</div>
                    <div><strong>Outcome:</strong> {event.data.outcome}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* MODALS */}
        <CDSSWizard isOpen={showWiz} onClose={() => setShowWiz(false)} mode="progress" existingPtId={pt.id} />
        
        <AnimatePresence>
          {showDischarge && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card border border-b1 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-xl font-extrabold mb-4 text-danger flex items-center gap-2"><span className="ms">logout</span> Discharge Patient</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-muted">Clinical Outcome</label>
                  <select className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-danger" value={dxOutcome} onChange={e=>setDxOutcome(e.target.value)}>
                    <option value="Discharged (Stable)">Discharged (Stable)</option>
                    <option value="Transferred (Higher Care)">Transferred (Higher Care)</option>
                    <option value="LAMA/DAMA">LAMA / DAMA</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={()=>setShowDischarge(false)} className="flex-1 px-4 py-2 rounded-xl bg-card border border-b1 text-t2 font-bold hover:text-primary">Cancel</button>
                  <button onClick={handleDischargeSubmit} className="flex-1 px-4 py-2 rounded-xl bg-danger text-white font-bold hover:opacity-90">Confirm</button>
                </div>
              </motion.div>
            </div>
          )}

          {showADR && (
            <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card border border-b1 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-xl font-extrabold mb-4 text-warn flex items-center gap-2"><span className="ms">warning</span> Report ADR</h3>
                <div className="flex flex-col gap-3">
                  <input className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-warn" placeholder="Suspected Drug" value={adr.drug} onChange={e=>setAdr({...adr, drug: e.target.value})} />
                  <textarea className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-warn min-h-[80px]" placeholder="Detailed Reaction" value={adr.rxn} onChange={e=>setAdr({...adr, rxn: e.target.value})} />
                  <input className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-warn" placeholder="Date of Onset" type="date" value={adr.onset} onChange={e=>setAdr({...adr, onset: e.target.value})} />
                  <select className="w-full bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-warn" value={adr.outcome} onChange={e=>setAdr({...adr, outcome: e.target.value})}>
                    <option value="Recovered">Recovered</option><option value="Recovering">Recovering</option><option value="Not Recovered">Not Recovered</option><option value="Fatal">Fatal</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={()=>setShowADR(false)} className="flex-1 px-4 py-2 rounded-xl bg-card border border-b1 text-t2 font-bold hover:text-primary">Cancel</button>
                  <button onClick={handleADRSubmit} className="flex-1 px-4 py-2 rounded-xl bg-warn text-background font-bold hover:opacity-90">File Report</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  )
}
