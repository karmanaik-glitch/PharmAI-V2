import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CALCULATORS = [
  { id: 'ckd', name: 'CKD-EPI eGFR (2021)', icon: 'kidney', desc: 'Race-free glomerular filtration rate' },
  { id: 'crcl', name: 'Creatinine Clearance', icon: 'water_drop', desc: 'Cockcroft-Gault for drug dosing' },
  { id: 'meld', name: 'MELD-Na Score', icon: 'liver', desc: 'End-stage liver disease mortality' },
  { id: 'cp', name: 'Child-Pugh Score', icon: 'monitor_heart', desc: 'Cirrhosis severity staging' },
  { id: 'ped', name: 'Pediatric Dosing', icon: 'child_care', desc: 'Weight-based total dose' },
  { id: 'bsa', name: 'Body Surface Area', icon: 'accessibility', desc: 'Mosteller formula' },
  { id: 'ibw', name: 'Ideal Body Weight', icon: 'scale', desc: 'Devine formula (IBW & ABW)' },
  { id: 'ca', name: 'Corrected Calcium', icon: 'bloodtype', desc: 'Albumin-adjusted serum calcium' },
  { id: 'op', name: 'Opioid Equivalence', icon: 'medication', desc: 'Cross-tolerance reduction included' },
  { id: 'vanc', name: 'Vancomycin AUC', icon: 'vaccines', desc: 'Simplified AUC24 estimate' },
  { id: 'pheny', name: 'Phenytoin Correction', icon: 'science', desc: 'Winter-Tozer equation' },
  { id: 'curb', name: 'CURB-65 Score', icon: 'pulmonology', desc: 'Pneumonia mortality & site of care' },
  { id: 'wells', name: 'Wells Criteria (DVT)', icon: 'airline_seat_legroom_reduced', desc: 'DVT probability scoring' },
]

export function Calculators({ isOpen, onClose }) {
  const [activeId, setActiveId] = useState('ckd')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%', boxShadow: 'none' }}
            animate={{ y: 0, boxShadow: '0 -20px 80px rgba(0,0,0,0.5)' }}
            exit={{ y: '100%', boxShadow: 'none' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 w-full h-[85vh] bg-card/95 backdrop-blur-2xl border-t border-b1 z-50 rounded-t-3xl flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-b1 shrink-0 bg-background/50">
              <div className="font-extrabold text-[18px] tracking-tight text-primary flex items-center gap-2">
                <span className="ms text-blue">calculate</span>
                Clinical Calculators
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-transparent text-t2 flex items-center justify-center hover:bg-b1/30 hover:text-primary transition-all">
                <span className="ms sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-background">
              <div className="max-w-xl mx-auto flex flex-col gap-3">
                {CALCULATORS.map(c => {
                  const isActive = activeId === c.id
                  return (
                    <div key={c.id} className="bg-card border border-b1 rounded-2xl overflow-hidden transition-all shadow-sm">
                      <button 
                        onClick={() => setActiveId(isActive ? null : c.id)}
                        className={`w-full flex items-center justify-between p-4 transition-colors ${isActive ? 'bg-blue/5' : 'hover:bg-card2'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isActive ? 'bg-blue text-white shadow-md' : 'bg-card2 text-t2 border border-b2'}`}>
                            <span className="ms">{c.icon}</span>
                          </div>
                          <div className="text-left">
                            <div className={`font-bold text-[15px] ${isActive ? 'text-blue' : 'text-primary'}`}>{c.name}</div>
                            <div className="text-[12px] text-muted">{c.desc}</div>
                          </div>
                        </div>
                        <span className={`ms text-t2 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-b1/50"
                          >
                            <div className="p-5 bg-card2/30">
                              {activeId === 'ckd' && <CKDEPIForm />}
                              {activeId === 'crcl' && <CrClForm />}
                              {activeId === 'meld' && <MELDForm />}
                              {activeId === 'cp' && <ChildPughForm />}
                              {activeId === 'ped' && <PediatricForm />}
                              {activeId === 'bsa' && <BSAForm />}
                              {activeId === 'ibw' && <IBWForm />}
                              {activeId === 'ca' && <CalciumForm />}
                              {activeId === 'op' && <OpioidForm />}
                              {activeId === 'vanc' && <VancoForm />}
                              {activeId === 'pheny' && <PhenytoinForm />}
                              {activeId === 'curb' && <CURBForm />}
                              {activeId === 'wells' && <WellsForm />}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// =======================
// INDIVIDUAL CALCULATORS
// =======================

function CKDEPIForm() {
  const [age, setAge] = useState('')
  const [scr, setScr] = useState('')
  const [sex, setSex] = useState('M')

  let result = null
  if (age && scr) {
    const a = parseFloat(age), s = parseFloat(scr)
    const k = sex === 'F' ? 0.7 : 0.9
    const al = sex === 'F' ? -0.241 : -0.302
    const m = Math.min(s / k, 1)
    const mx = Math.max(s / k, 1)
    let e = 142 * Math.pow(m, al) * Math.pow(mx, -1.200) * Math.pow(0.9938, a)
    if (sex === 'F') e *= 1.012
    
    let stage = '', color = ''
    if (e >= 90) { stage = 'G1 (Normal/High)'; color = 'text-ok bg-ok/10 border-ok/30' }
    else if (e >= 60) { stage = 'G2 (Mildly ↓)'; color = 'text-ok bg-ok/10 border-ok/30' }
    else if (e >= 45) { stage = 'G3a (Mild/Mod ↓)'; color = 'text-warn bg-warn/10 border-warn/30' }
    else if (e >= 30) { stage = 'G3b (Mod/Sev ↓)'; color = 'text-warn bg-warn/10 border-warn/30' }
    else if (e >= 15) { stage = 'G4 (Severely ↓)'; color = 'text-danger bg-danger/10 border-danger/30' }
    else { stage = 'G5 (Kidney Failure)'; color = 'text-danger bg-danger/10 border-danger/30' }

    result = { e: e.toFixed(1), stage, color }
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">CKD-EPI (2021)</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Age (years)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={age} onChange={e => setAge(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Serum Cr (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={scr} onChange={e => setScr(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold text-muted uppercase">Sex at Birth</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={sex} onChange={e => setSex(e.target.value)}>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </label>
      </div>

      <div className={`mt-4 p-6 rounded-2xl border ${result ? result.color : 'border-b1 bg-card2 text-t2'}`}>
        {result ? (
          <>
            <div className="text-3xl font-extrabold mb-1">{result.e} <span className="text-lg font-semibold opacity-70">mL/min/1.73m²</span></div>
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Stage {result.stage}</div>
          </>
        ) : (
          <div className="text-sm font-medium">Enter all values to calculate eGFR.</div>
        )}
      </div>
    </div>
  )
}

function CrClForm() {
  const [age, setAge] = useState('')
  const [wt, setWt] = useState('')
  const [scr, setScr] = useState('')
  const [sex, setSex] = useState('M')

  let result = null
  if (age && wt && scr) {
    const a = parseFloat(age), w = parseFloat(wt), s = parseFloat(scr)
    let v = ((140 - a) * w) / (72 * s)
    if (sex === 'F') v *= 0.85
    v = Math.max(0, v)
    
    let stage = '', color = ''
    if (v >= 60) { stage = 'Normal Renal Function'; color = 'text-ok bg-ok/10 border-ok/30' }
    else if (v >= 30) { stage = 'Moderate Impairment'; color = 'text-warn bg-warn/10 border-warn/30' }
    else { stage = 'Severe Impairment (Dose Adjust)'; color = 'text-danger bg-danger/10 border-danger/30' }

    result = { v: v.toFixed(1), stage, color }
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Cockcroft-Gault CrCl</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Age (years)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={age} onChange={e => setAge(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Weight (kg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={wt} onChange={e => setWt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Serum Cr (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={scr} onChange={e => setScr(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Sex at Birth</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={sex} onChange={e => setSex(e.target.value)}>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </label>
      </div>

      <div className={`mt-4 p-6 rounded-2xl border ${result ? result.color : 'border-b1 bg-card2 text-t2'}`}>
        {result ? (
          <>
            <div className="text-3xl font-extrabold mb-1">{result.v} <span className="text-lg font-semibold opacity-70">mL/min</span></div>
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">{result.stage}</div>
          </>
        ) : (
          <div className="text-sm font-medium">Enter all values to calculate CrCl.</div>
        )}
      </div>
    </div>
  )
}

function MELDForm() {
  const [bil, setBil] = useState('')
  const [inr, setInr] = useState('')
  const [scr, setScr] = useState('')
  const [na, setNa] = useState('')

  let result = null
  if (bil && inr && scr && na) {
    const b = parseFloat(bil), i = parseFloat(inr), s = parseFloat(scr), n = parseFloat(na)
    const sc = Math.max(1, s), bc = Math.max(1, b), ic = Math.max(1, i)
    let m = 3.78 * Math.log(bc) + 11.2 * Math.log(ic) + 9.57 * Math.log(sc) + 6.43
    m = Math.round(m)
    
    const naC = Math.max(125, Math.min(n, 137))
    if (m > 11) { m = m + 1.32 * (137 - naC) - (0.033 * m * (137 - naC)) }

    result = { m: Math.round(m), clamped: (n < 125 || n > 137) }
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">MELD-Na Score</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Bilirubin (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={bil} onChange={e => setBil(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">INR</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={inr} onChange={e => setInr(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Serum Cr (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={scr} onChange={e => setScr(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Sodium (mEq/L)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={na} onChange={e => setNa(e.target.value)} />
        </label>
      </div>

      <div className={`mt-4 p-6 rounded-2xl border ${result ? 'text-warn bg-warn/10 border-warn/30' : 'border-b1 bg-card2 text-t2'}`}>
        {result ? (
          <>
            <div className="text-3xl font-extrabold mb-1">{result.m} <span className="text-lg font-semibold opacity-70">Points</span></div>
            {result.clamped && <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Na clamped for formula (125-137)</div>}
          </>
        ) : (
          <div className="text-sm font-medium">Enter all values to calculate MELD-Na.</div>
        )}
      </div>
    </div>
  )
}

function ChildPughForm() {
  const [bil, setBil] = useState('')
  const [alb, setAlb] = useState('')
  const [inr, setInr] = useState('')
  const [asc, setAsc] = useState('1')
  const [enc, setEnc] = useState('1')

  let result = null
  if (bil && alb && inr) {
    const b = parseFloat(bil), a = parseFloat(alb), i = parseFloat(inr)
    let sc = 0
    sc += b < 2 ? 1 : b <= 3 ? 2 : 3
    sc += a > 3.5 ? 1 : a >= 2.8 ? 2 : 3
    sc += i < 1.7 ? 1 : i <= 2.3 ? 2 : 3
    sc += parseInt(asc); sc += parseInt(enc)

    const cls = sc <= 6 ? 'A' : sc <= 9 ? 'B' : 'C'
    const color = sc <= 6 ? 'text-ok bg-ok/10 border-ok/30' : sc <= 9 ? 'text-warn bg-warn/10 border-warn/30' : 'text-danger bg-danger/10 border-danger/30'

    result = { sc, cls, color }
  }

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Child-Pugh Score</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Bilirubin (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={bil} onChange={e => setBil(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Albumin (g/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={alb} onChange={e => setAlb(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">INR</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={inr} onChange={e => setInr(e.target.value)} />
        </label>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Ascites</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={asc} onChange={e => setAsc(e.target.value)}>
            <option value="1">Absent</option>
            <option value="2">Slight</option>
            <option value="3">Moderate</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Encephalopathy</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={enc} onChange={e => setEnc(e.target.value)}>
            <option value="1">None</option>
            <option value="2">Grade 1-2</option>
            <option value="3">Grade 3-4</option>
          </select>
        </label>
      </div>

      <div className={`mt-4 p-6 rounded-2xl border ${result ? result.color : 'border-b1 bg-card2 text-t2'}`}>
        {result ? (
          <>
            <div className="text-3xl font-extrabold mb-1">{result.sc} <span className="text-lg font-semibold opacity-70">Points</span></div>
            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Class {result.cls} Cirrhosis</div>
          </>
        ) : (
          <div className="text-sm font-medium">Enter all values to calculate.</div>
        )}
      </div>
    </div>
  )
}

function PediatricForm() {
  const [wt, setWt] = useState('')
  const [dose, setDose] = useState('')
  let result = (wt && dose) ? (parseFloat(wt) * parseFloat(dose)).toFixed(2) : null
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Pediatric Dosing</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Weight (kg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={wt} onChange={e=>setWt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Dose (mg/kg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue transition-colors" value={dose} onChange={e=>setDose(e.target.value)} />
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${result ? 'text-ok bg-ok/10 border-ok/30' : 'border-b1 bg-card2 text-t2'}`}>
        {result ? <div className="text-3xl font-extrabold">{result} <span className="text-lg opacity-70">mg total</span></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function BSAForm() {
  const [ht, setHt] = useState('')
  const [wt, setWt] = useState('')
  let result = (ht && wt) ? Math.sqrt((parseFloat(ht)*parseFloat(wt))/3600).toFixed(2) : null
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Body Surface Area (BSA)</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Height (cm)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={ht} onChange={e=>setHt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Weight (kg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={wt} onChange={e=>setWt(e.target.value)} />
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${result ? 'text-ok bg-ok/10 border-ok/30' : 'border-b1 bg-card2 text-t2'}`}>
        {result ? <div className="text-3xl font-extrabold">{result} <span className="text-lg opacity-70">m²</span></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function IBWForm() {
  const [ht, setHt] = useState('')
  const [aw, setAw] = useState('')
  const [sex, setSex] = useState('M')
  let result = null
  if (ht && aw) {
    const hi = parseFloat(ht)/2.54, act = parseFloat(aw)
    const ibw = Math.max(0, sex === 'M' ? 50 + 2.3*(hi-60) : 45.5 + 2.3*(hi-60))
    const abw = act > ibw ? ibw + 0.4*(act-ibw) : act
    result = { ibw: ibw.toFixed(1), abw: abw.toFixed(1) }
  }
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Ideal/Adjusted Body Weight</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Height (cm)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={ht} onChange={e=>setHt(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Actual Weight (kg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={aw} onChange={e=>setAw(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold text-muted uppercase">Sex</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={sex} onChange={e=>setSex(e.target.value)}><option value="M">Male</option><option value="F">Female</option></select>
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${result ? 'text-ok bg-ok/10 border-ok/30' : 'border-b1 bg-card2 text-t2'}`}>
        {result ? <div><div className="text-2xl font-extrabold mb-2">IBW: {result.ibw} kg</div><div className="text-2xl font-extrabold text-blue">ABW: {result.abw} kg</div></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function CalciumForm() {
  const [ca, setCa] = useState('')
  const [alb, setAlb] = useState('')
  let r = null
  if (ca && alb) {
    const c = parseFloat(ca) + 0.8 * (4.0 - parseFloat(alb))
    r = { v: c.toFixed(2), col: (c>=8.5 && c<=10.5) ? 'text-ok bg-ok/10 border-ok/30' : c<8.5 ? 'text-warn bg-warn/10 border-warn/30' : 'text-danger bg-danger/10 border-danger/30' }
  }
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Corrected Calcium</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Serum Ca (mg/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={ca} onChange={e=>setCa(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Albumin (g/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={alb} onChange={e=>setAlb(e.target.value)} />
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${r ? r.col : 'border-b1 bg-card2 text-t2'}`}>
        {r ? <div className="text-3xl font-extrabold">{r.v} <span className="text-lg opacity-70">mg/dL</span></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function OpioidForm() {
  const [fr, setFr] = useState('15')
  const [dose, setDose] = useState('')
  const [to, setTo] = useState('15')
  let r = null
  if(dose) {
    const raw = (parseFloat(dose)*parseFloat(fr))/parseFloat(to)
    r = { eq: raw.toFixed(2), red: (raw*0.75).toFixed(2) }
  }
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Opioid Equivalence</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold text-muted uppercase">Current Daily Dose (mg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={dose} onChange={e=>setDose(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">From Drug</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={fr} onChange={e=>setFr(e.target.value)}>
            <option value="15">Morphine (PO) / Hydrocodone</option><option value="5">Morphine (IV)</option><option value="10">Oxycodone (PO)</option><option value="4">Hydromorphone (PO)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">To Drug</span>
          <select className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none focus:border-blue" value={to} onChange={e=>setTo(e.target.value)}>
            <option value="15">Morphine (PO) / Hydrocodone</option><option value="5">Morphine (IV)</option><option value="10">Oxycodone (PO)</option><option value="4">Hydromorphone (PO)</option>
          </select>
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${r ? 'text-warn bg-warn/10 border-warn/30' : 'border-b1 bg-card2 text-t2'}`}>
        {r ? <div><div className="text-2xl font-extrabold mb-1">Equiv: {r.eq} mg</div><div className="text-sm font-bold opacity-80">After 25% Reduction: {r.red} mg</div></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function VancoForm() {
  const [d, setD] = useState('')
  const [c, setC] = useState('')
  let r = null
  if(d&&c){
    const auc = parseFloat(d) / ((parseFloat(c)*0.06)*0.8)
    r = { a: Math.round(auc), c: auc>=400&&auc<=600?'text-ok bg-ok/10 border-ok/30':'text-warn bg-warn/10 border-warn/30' }
  }
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Vancomycin AUC Estimate</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Total Daily Dose (mg)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none" value={d} onChange={e=>setD(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">CrCl (mL/min)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none" value={c} onChange={e=>setC(e.target.value)} />
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${r ? r.c : 'border-b1 bg-card2 text-t2'}`}>
        {r ? <div><div className="text-3xl font-extrabold">{r.a} <span className="text-lg opacity-70">AUC24</span></div><div className="text-xs mt-2 text-danger font-bold">ASHP 2020: Use Bayesian tool for clinical decisions.</div></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function PhenytoinForm() {
  const [o, setO] = useState('')
  const [a, setA] = useState('')
  let r = null
  if(o&&a) {
    const c = parseFloat(o)/((0.2*parseFloat(a))+0.1)
    r = c.toFixed(1)
  }
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Phenytoin Correction</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Observed (mcg/mL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none" value={o} onChange={e=>setO(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-muted uppercase">Albumin (g/dL)</span>
          <input type="number" className="bg-card2 border border-b2 rounded-xl px-4 py-3 outline-none" value={a} onChange={e=>setA(e.target.value)} />
        </label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${r ? 'text-warn bg-warn/10 border-warn/30' : 'border-b1 bg-card2 text-t2'}`}>
        {r ? <div className="text-3xl font-extrabold">{r} <span className="text-lg opacity-70">mcg/mL</span></div> : <div className="text-sm">Enter values</div>}
      </div>
    </div>
  )
}

function CURBForm() {
  const [c, setC] = useState(false); const [u, setU] = useState(false); const [r, setR] = useState(false); const [b, setB] = useState(false); const [a, setA] = useState(false);
  const score = [c,u,r,b,a].filter(Boolean).length
  const col = score<=1 ? 'text-ok bg-ok/10 border-ok/30' : score===2 ? 'text-warn bg-warn/10 border-warn/30' : 'text-danger bg-danger/10 border-danger/30'
  const rec = score<=1 ? 'Outpatient' : score===2 ? 'Consider Ward' : 'Consider ICU'
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">CURB-65 Score</h3>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={c} onChange={e=>setC(e.target.checked)}/> Confusion</label>
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={u} onChange={e=>setU(e.target.checked)}/> BUN &gt; 19 mg/dL</label>
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={r} onChange={e=>setR(e.target.checked)}/> Resp Rate &ge; 30</label>
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={b} onChange={e=>setB(e.target.checked)}/> BP (SBP &lt; 90 or DBP &le; 60)</label>
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={a} onChange={e=>setA(e.target.checked)}/> Age &ge; 65</label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${col}`}>
        <div className="text-3xl font-extrabold mb-1">{score} <span className="text-lg opacity-70">Points</span></div>
        <div className="text-sm font-bold uppercase tracking-wide">{rec}</div>
      </div>
    </div>
  )
}

function WellsForm() {
  const [c, setC] = useState([false,false,false,false,false,false,false,false,false])
  const [alt, setAlt] = useState(false)
  const toggle = i => { const nx = [...c]; nx[i]=!nx[i]; setC(nx) }
  let s = c.filter(Boolean).length; if(alt) s-=2;
  const col = s>=3?'text-danger bg-danger/10 border-danger/30':s>=2?'text-warn bg-warn/10 border-warn/30':'text-ok bg-ok/10 border-ok/30'
  const p = s>=2 ? 'Mod/High Probability' : 'Low Probability'
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold tracking-tight mb-2">Wells Criteria (DVT)</h3>
      <div className="flex flex-col gap-2 h-[250px] overflow-y-auto pr-2">
        {['Active cancer','Paralysis / cast','Bedridden >3d or major surgery','Localized tenderness','Entire leg swollen','Calf swelling >3cm','Pitting edema','Collateral non-varicose veins','Prev documented DVT'].map((l,i)=>
          <label key={i} className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer"><input type="checkbox" className="w-5 h-5 shrink-0" checked={c[i]} onChange={()=>toggle(i)}/> {l} (+1)</label>
        )}
        <label className="flex items-center gap-3 p-3 bg-card2 border border-b2 rounded-xl cursor-pointer border-l-4 border-l-danger"><input type="checkbox" className="w-5 h-5 shrink-0" checked={alt} onChange={e=>setAlt(e.target.checked)}/> Alt Dx more likely (-2)</label>
      </div>
      <div className={`mt-4 p-6 rounded-2xl border ${col}`}>
        <div className="text-3xl font-extrabold mb-1">{s} <span className="text-lg opacity-70">Points</span></div>
        <div className="text-sm font-bold uppercase tracking-wide">{p}</div>
      </div>
    </div>
  )
}
