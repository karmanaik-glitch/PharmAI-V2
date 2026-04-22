import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWardStore } from '../store/wardStore'
import { Sounds } from '../utils/audio'

export function CDSSWizard({ isOpen, onClose, mode = 'admit', existingPtId = null }) {
  const { patients, addPatient, updatePatient, setActiveCase } = useWardStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // States
  const [demo, setDemo] = useState({ doa: '', name: '', id: '', age: '', sex: 'M', wt: '', ht: '', preg: 'N' })
  const [hist, setHist] = useState({ dx: '', cc: '', pmh: '', pmx: '', alg: '', soc: '', fam: '' })
  const [vitals, setVitals] = useState({ bp: '', hr: '', rr: '', temp: '', spo2: '', cns: '', resp: '' })
  const [anchors, setAnchors] = useState({ scr: '', ast: '', alt: '', bil: '', urine: '', img: '' })
  const [fresh, setFresh] = useState('')
  
  const [labParam, setLabParam] = useState('')
  const [labVal, setLabVal] = useState('')
  const [labSys, setLabSys] = useState('')
  const [labTags, setLabTags] = useState([])

  const [txDrug, setTxDrug] = useState('')
  const [txDose, setTxDose] = useState('')
  const [txFreq, setTxFreq] = useState('')
  const [txRoute, setTxRoute] = useState('')
  const [txTags, setTxTags] = useState([])

  const cdssLabOpts = {
    hemato: ['Hb (g/dL)', 'RBC (millions/µL)', 'WBC (cells/mm³)', 'Platelets (lakhs/µL)', 'MCV (fL)', 'MCH (pg)', 'MCHC (g/dL)', 'PCV/HCT (%)', 'ESR (mm/hr)', 'Neutrophils (%)', 'Lymphocytes (%)', 'INR', 'aPTT (sec)'],
    biochem: ['Na+ (mEq/L)', 'K+ (mEq/L)', 'Cl- (mEq/L)', 'HCO3- (mEq/L)', 'BUN (mg/dL)', 'Ca2+ (mg/dL)', 'Mg2+ (mg/dL)', 'PO4 (mg/dL)', 'Uric Acid (mg/dL)', 'Albumin (g/dL)', 'Globulin (g/dL)', 'Total Protein (g/dL)', 'RBS (mg/dL)', 'FBS (mg/dL)', 'HbA1c (%)', 'Lactic Acid (mmol/L)', 'Procalcitonin (ng/mL)'],
    cardio: ['Troponin (ng/mL)', 'BNP (pg/mL)', 'PT (sec)']
  }

  const handleAddLab = () => {
    if (!labParam || !labVal) return
    setLabTags([...labTags, { param: labParam, val: labVal }])
    setLabVal(''); Sounds.play('tick')
  }

  const handleAddTx = () => {
    if (!txDrug) return
    setTxTags([...txTags, { drug: txDrug, dose: txDose, freq: txFreq, route: txRoute }])
    setTxDrug(''); setTxDose(''); setTxFreq(''); setTxRoute(''); Sounds.play('tick')
  }

  // Pre-fill on progress mode
  if (isOpen && mode === 'progress' && existingPtId && !demo.name) {
    const pt = patients.find(p => p.id === existingPtId)
    if (pt) {
      setDemo(pt.demo || demo)
      setHist(pt.hist || hist)
      setTxTags(pt.currentTx || [])
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    
    const newPtId = existingPtId || `PT-${Date.now()}`
    
    // Exact Payload structure from cdss.js
    const payload = {
      isUpdate: mode === 'progress',
      demographics: demo,
      history: hist,
      updates: { fresh },
      vitals,
      labs: { anchors, specifics: labTags, urine: anchors.urine, img: anchors.img },
      treatment: txTags
    }

    // Auto-calculate BMI/CrCl Note for AI
    let age = parseFloat(demo.age), wt = parseFloat(demo.wt), scr = parseFloat(anchors.scr), ht = parseFloat(demo.ht);
    if (!isNaN(age) && !isNaN(wt) && !isNaN(scr) && scr > 0) {
      let dosingWt = wt;
      if (!isNaN(ht) && ht > 0) {
        const hi = ht / 2.54;
        const ibw = demo.sex === 'F' ? 45.5 + 2.3 * (hi - 60) : 50 + 2.3 * (hi - 60);
        const ibwClamped = Math.max(0, ibw);
        if (wt > 1.3 * ibwClamped && ibwClamped > 0) dosingWt = ibwClamped + 0.4 * (wt - ibwClamped);
      }
      let crcl = ((140 - age) * dosingWt) / (72 * scr); if (demo.sex === 'F') crcl *= 0.85;
      payload.labs.calculated_CrCl_CG = crcl.toFixed(1) + " mL/min (Cockcroft-Gault, for drug dosing only)";
    }
    payload.labs.renal_note = "The calculated_CrCl_CG above is a Cockcroft-Gault estimate for DRUG DOSING ONLY. Do NOT use it to stage CKD.";

    try {
      const groqKey = JSON.parse(localStorage.getItem('pharmai-chat-storage'))?.state?.groqKey || ''
      if (!groqKey) throw new Error("Groq API Key not configured in Settings.")

      const sysPrompt = `You are PharmAI, an elite Senior Clinical Pharmacist. Perform a rigorous, multi-variable Comprehensive Medication Review (CMR) and output it as a structured SOAP note.

UNIVERSAL CLINICAL RULES:
1. CUMULATIVE TOXICITY: Explicitly calculate and flag Anticholinergic burden, Serotonin Syndrome risk, combined CNS depression, QTc prolongation, and stacked bleeding risks.
2. RENAL/HEPATIC: Use 'calculated_CrCl_CG' for drug dose adjustments. This is Cockcroft-Gault for DRUG DOSING ONLY — do NOT use it to stage CKD.
3. PHARMACOKINETICS: Scan for enzyme inhibitors/inducers interacting with NTI drugs.
4. DRUG-DISEASE: Cross-reference all medications against active PMH, Diagnoses, AND Social History.
5. ALLERGIES: Categorize known allergies strictly as "Contraindication" (Severity: Critical).
6. NTI DRUGS: If ANY narrow therapeutic index drug is present ALWAYS flag in the monitoring column.
7. WEIGHT-BASED DOSING: Verify dose appropriateness for patient's actual body weight.

Sort drug_related_problems in descending severity: Critical first, then High, Moderate, Low.

Output ONLY valid JSON in this exact SOAP schema:
{
  "soap": {
    "S": {
      "chief_complaint": "Primary reason for admission or today's visit in one sentence.",
      "history": "Demographics, diagnosis, PMH, medication history, allergies (flag as RED FLAGS), social history, family history."
    },
    "O": {
      "vitals": "All vitals with brief interpretation — flag abnormals explicitly.",
      "labs": "All lab values with reference-range flags. State calculated_CrCl_CG explicitly. Note trends if progress note.",
      "current_therapy": [ { "drug": "Name", "dose": "Dose", "freq": "Frequency", "route": "Route", "indication": "Inferred Indication", "moa": "Brief MOA", "monitoring": "Required monitoring parameters", "side_effects": "Key adverse effects to watch" } ]
    },
    "A": {
      "clinical_correlations": ["Connect objective findings to medications."],
      "drug_related_problems": [ { "category": "Contraindication | Drug-Drug Interaction | Drug-Disease Interaction | Dosing Error | Polypharmacy | Adverse Effect | Untreated Indication | Unnecessary Drug", "drug_pair": "For Drug-Drug Interaction ONLY — exact names of both drugs. Null for all other categories.", "issue": "Specific, patient-contextualised clinical description.", "severity": "Critical | High | Moderate | Low", "actionable_solution": "Precise, implementable clinical intervention." } ]
    },
    "P": {
      "pharmacist_interventions": ["Numbered, prioritised actions directly addressing each DRP."],
      "monitoring_plan": ["Specific parameter, target value, and frequency."],
      "follow_up": "Clear follow-up timeline and handoff instructions.",
      "references": ["Specific guideline or evidence source for each intervention."]
    }
  }
}`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
        body: JSON.stringify({ 
          model: 'llama-3.3-70b-versatile', 
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: JSON.stringify(payload) }], 
          temperature: 0.1, max_tokens: 3000, response_format: { type: 'json_object' } 
        })
      });
      
      const data = await res.json()
      if(data.error) throw new Error(data.error.message)
      const result = JSON.parse(data.choices[0].message.content)

      if (mode === 'admit') {
        addPatient({
          id: newPtId, status: 'active', name: demo.name || 'Unknown', bedId: demo.id || 'TBD',
          age: demo.age, sex: demo.sex, weight: demo.wt, cc: hist.cc || hist.dx || 'No complaints',
          demo: demo, hist: hist, currentTx: txTags,
          timeline: [{ date: new Date().toISOString(), type: 'soap', data: result }]
        })
      } else {
        const pt = patients.find(p => p.id === existingPtId)
        updatePatient(existingPtId, {
          currentTx: txTags,
          timeline: [{ date: new Date().toISOString(), type: 'soap', data: result }, ...(pt?.timeline || [])]
        })
      }

      Sounds.play('success')
      setActiveCase(newPtId)
      onClose()
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate BMI for display
  const renderBMI = () => {
    if (demo.wt && demo.ht) {
      const w = parseFloat(demo.wt), h = parseFloat(demo.ht)
      const bmi = (w / ((h/100) * (h/100))).toFixed(1)
      const color = (bmi < 18.5 || bmi >= 25) ? 'text-warn' : 'text-ok'
      return <span className={color}>{bmi} kg/m²</span>
    }
    return '--'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-card border border-b1 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-b1 bg-card2/50 shrink-0">
              <div className="font-bold text-xl flex items-center gap-2 text-primary">
                <span className="ms text-blue">{mode === 'admit' ? 'person_add' : 'edit_note'}</span>
                {mode === 'admit' ? 'Admit Patient' : 'Add Progress Note'}
              </div>
              <button onClick={onClose} className="text-t2 hover:text-danger w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"><span className="ms">close</span></button>
            </div>

            {/* FORM BODY */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* DEMO & HISTORY - Hide on progress mode */}
              {mode === 'admit' && (
                <div className="grid grid-cols-2 gap-6">
                  {/* Demographics */}
                  <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="ms sm">badge</span> Demographics</span>
                      <span>BMI: {renderBMI()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="col-span-2 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Patient Name" value={demo.name} onChange={e => setDemo({...demo, name: e.target.value})} />
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Bed ID" value={demo.id} onChange={e => setDemo({...demo, id: e.target.value})} />
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="DOA" type="date" value={demo.doa} onChange={e => setDemo({...demo, doa: e.target.value})} />
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Age" type="number" value={demo.age} onChange={e => setDemo({...demo, age: e.target.value})} />
                      <select className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" value={demo.sex} onChange={e => setDemo({...demo, sex: e.target.value})}>
                        <option value="M">Male</option><option value="F">Female</option>
                      </select>
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Weight (kg)" type="number" value={demo.wt} onChange={e => setDemo({...demo, wt: e.target.value})} />
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Height (cm)" type="number" value={demo.ht} onChange={e => setDemo({...demo, ht: e.target.value})} />
                      {demo.sex === 'F' && (
                        <select className="col-span-2 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" value={demo.preg} onChange={e => setDemo({...demo, preg: e.target.value})}>
                          <option value="N">Not Pregnant/Lactating</option><option value="Y">Pregnant</option><option value="L">Lactating</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2"><span className="ms sm">history_edu</span> Medical History</div>
                    <div className="flex flex-col gap-3">
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Primary Diagnosis" value={hist.dx} onChange={e => setHist({...hist, dx: e.target.value})} />
                      <textarea className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue min-h-[60px]" placeholder="Chief Complaint (HPI)" value={hist.cc} onChange={e => setHist({...hist, cc: e.target.value})} />
                      <textarea className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue min-h-[60px]" placeholder="Past Medical/Surgical History" value={hist.pmh} onChange={e => setHist({...hist, pmh: e.target.value})} />
                      <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-danger border-l-4 border-l-danger" placeholder="Allergies (Red Flags)" value={hist.alg} onChange={e => setHist({...hist, alg: e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Social History" value={hist.soc} onChange={e => setHist({...hist, soc: e.target.value})} />
                        <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Family History" value={hist.fam} onChange={e => setHist({...hist, fam: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRESS ONLY */}
              {mode === 'progress' && (
                <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2"><span className="ms sm">edit_note</span> Progress Updates</div>
                  <textarea className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue min-h-[80px]" placeholder="Fresh complaints, physician notes, interval events..." value={fresh} onChange={e => setFresh(e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* VITALS */}
                <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2"><span className="ms sm">monitor_heart</span> Vitals</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="BP (mmHg)" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="HR (bpm)" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="RR (bpm)" value={vitals.rr} onChange={e => setVitals({...vitals, rr: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Temp (°C/F)" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} />
                    <input className="col-span-2 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="SpO2 (%)" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: e.target.value})} />
                  </div>
                </div>

                {/* LABS */}
                <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2"><span className="ms sm">science</span> Laboratory</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Scr (mg/dL)" value={anchors.scr} onChange={e => setAnchors({...anchors, scr: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Bil (mg/dL)" value={anchors.bil} onChange={e => setAnchors({...anchors, bil: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="AST (U/L)" value={anchors.ast} onChange={e => setAnchors({...anchors, ast: e.target.value})} />
                    <input className="bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="ALT (U/L)" value={anchors.alt} onChange={e => setAnchors({...anchors, alt: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <select className="bg-card border border-b2 rounded-lg px-2 py-2 text-xs outline-none w-[100px]" value={labSys} onChange={e => {setLabSys(e.target.value); setLabParam('')}}>
                      <option value="">System</option><option value="hemato">Hemato</option><option value="biochem">Biochem</option><option value="cardio">Cardio</option>
                    </select>
                    <select className="bg-card border border-b2 rounded-lg px-2 py-2 text-xs outline-none flex-1" value={labParam} onChange={e => setLabParam(e.target.value)}>
                      <option value="">Parameter</option>
                      {labSys && cdssLabOpts[labSys].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className="bg-card border border-b2 rounded-lg px-2 py-2 text-xs outline-none w-[70px]" placeholder="Val" value={labVal} onChange={e => setLabVal(e.target.value)} />
                    <button onClick={handleAddLab} className="w-9 h-9 shrink-0 bg-card border border-b2 rounded-lg text-primary hover:bg-blue/10 flex items-center justify-center"><span className="ms sm">add</span></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {labTags.map((l, i) => (
                      <div key={i} className="bg-card border border-b2 px-2 py-1 rounded text-xs flex items-center gap-2">
                        {l.param}: <b>{l.val}</b> <button onClick={() => setLabTags(labTags.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger"><span className="ms xs">close</span></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TREATMENTS */}
              <div className="bg-card2 border border-b1 rounded-xl p-5 flex flex-col gap-4">
                <div className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2"><span className="ms sm">vaccines</span> Current Medications</div>
                <div className="flex gap-2">
                  <input className="flex-[2] bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Drug Name" value={txDrug} onChange={e => setTxDrug(e.target.value)} />
                  <input className="flex-1 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Dose" value={txDose} onChange={e => setTxDose(e.target.value)} />
                  <input className="flex-1 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Freq" value={txFreq} onChange={e => setTxFreq(e.target.value)} />
                  <input className="flex-1 bg-card border border-b2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Route" value={txRoute} onChange={e => setTxRoute(e.target.value)} />
                  <button onClick={handleAddTx} className="w-10 h-10 shrink-0 bg-blue text-white rounded-lg hover:opacity-90 flex items-center justify-center shadow-lg"><span className="ms sm">add</span></button>
                </div>
                <div className="flex flex-col gap-2">
                  {txTags.map((t, i) => (
                    <div key={i} className="bg-card border border-b2 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
                      <div><b>{t.drug}</b> — {t.dose} {t.freq} ({t.route})</div>
                      <button onClick={() => setTxTags(txTags.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger"><span className="ms sm">close</span></button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-b1 bg-card2/50 flex items-center justify-between shrink-0">
              <div className="text-danger text-sm font-bold w-[60%]">{error}</div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-card border border-b1 text-t2 hover:text-primary">Cancel</button>
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue text-white shadow-lg shadow-blue/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  {loading ? <span className="ms sm animate-spin">progress_activity</span> : <span className="ms sm">memory</span>}
                  {loading ? 'Analyzing...' : 'Generate Plan'}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
