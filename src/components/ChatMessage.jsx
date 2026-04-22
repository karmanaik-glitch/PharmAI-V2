import { motion } from 'framer-motion'
import { useState } from 'react'
import { Sounds } from '../utils/audio'

export function ChatMessage({ msg, onRegenerate, filters = {} }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 flex-row-reverse mb-5"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-card2 border border-b2 text-t2">
          <span className="ms sm">person</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[84%] items-end">
          <div className="bg-card2 border border-b2 py-3 px-4 rounded-t-[20px] rounded-bl-[20px] rounded-br-[4px] text-[15px] font-normal leading-relaxed">
            {msg.content}
          </div>
          <div className="text-[10px] text-muted px-1">{msg.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      </motion.div>
    );
  }

  // AI Loading Skeleton
  if (msg.isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-5"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary text-background shadow-[0_4px_16px_rgba(255,255,255,0.15)]">
          <span className="ms sm fill">cardiology</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[84%] w-full">
          <div className="bg-gradient-to-br from-card to-card2 border border-b1 rounded-t-[4px] rounded-b-[20px] p-4 flex items-center gap-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative overflow-hidden">
            <motion.div 
              animate={{ translateX: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            />
            <div className="w-3 h-3 rounded-full bg-blue shadow-[0_0_12px_rgba(56,189,248,0.25)] animate-pulse" />
            <div className="font-semibold text-[13px] bg-clip-text text-transparent bg-gradient-to-r from-primary via-muted to-primary bg-[length:200%_auto] animate-[gradientText_2s_linear_infinite]">
              PharmAI is analyzing...
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error Message
  if (msg.isError) {
    return (
      <div className="flex gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary text-background shadow-[0_4px_16px_rgba(255,255,255,0.15)]">
          <span className="ms sm fill">cardiology</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[84%]">
          <div className="bg-card border border-b1 rounded-t-[4px] rounded-b-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden border-l-[3px] border-l-danger">
            <div className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide bg-white/5 border-b border-b1 text-danger">
              <span className="ms xs">error</span> Error
            </div>
            <div className="p-4 text-[14px] text-danger">{msg.content}</div>
          </div>
        </div>
      </div>
    );
  }

  // Parse JSON clinical response
  let p = {};
  try {
    p = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
  } catch (e) {
    p = { summary: msg.content, category: 'General Clinical' };
  }

  // Out of scope
  if (p.in_scope === false) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary text-background shadow-[0_4px_16px_rgba(255,255,255,0.15)]">
          <span className="ms sm fill">cardiology</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[85%]">
          <div className="bg-card2 border border-b1 rounded-t-[4px] rounded-b-[18px] p-[18px] flex gap-3 items-start">
            <div className="w-9 h-9 rounded-[9px] bg-danger/10 border border-danger/25 flex items-center justify-center text-danger shrink-0">
              <span className="ms sm">block</span>
            </div>
            <div>
              <div className="font-bold text-[0.9rem] mb-1">Outside Clinical Scope</div>
              <div className="text-[0.82rem] text-t2 leading-relaxed">PharmAI is a clinical decision support tool for licensed medical professionals. This query falls outside the scope of medicine, pharmacology, or clinical science.</div>
            </div>
          </div>
          <div className="text-[10px] text-muted px-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      </motion.div>
    )
  }

  const CM = {
    'Pharmacokinetics': { c: 'border-l-cat-mec', i: 'science', l: 'Pharmacokinetics' },
    'Drug Interaction': { c: 'border-l-cat-int', i: 'monitor_heart', l: 'Drug Interaction' },
    'Dosage & Administration': { c: 'border-l-cat-dos', i: 'medication', l: 'Dosage & Administration' },
    'Adverse Effects': { c: 'border-l-cat-se', i: 'bolt', l: 'Adverse Effects' },
    'Contraindication': { c: 'border-l-cat-con', i: 'block', l: 'Contraindication' },
    'Mechanism of Action': { c: 'border-l-cat-mec', i: 'biotech', l: 'Mechanism of Action' },
    'Clinical Therapeutics': { c: 'border-l-cat-gen', i: 'local_hospital', l: 'Clinical Therapeutics' },
    'Monitoring': { c: 'border-l-cat-dos', i: 'monitoring', l: 'Monitoring' },
    'Antimicrobial': { c: 'border-l-cat-int', i: 'coronavirus', l: 'Antimicrobial' },
    'General Clinical': { c: 'border-l-cat-gen', i: 'info', l: 'General Clinical' },
  };

  const cat = CM[p.category] || { c: 'border-l-cat-gen', i: 'info', l: p.category || 'Clinical Response' };
  const nullify = (v) => (v === null || v === 'null' || v === undefined || v === '') ? null : v;

  // Evidence grade badge
  const evClass = { 'A': 'bg-ok/20 text-ok border-ok/30', 'B': 'bg-blue/15 text-blue border-blue/25', 'C': 'bg-warn/15 text-warn border-warn/25' }[nullify(p.evidence_grade)] || '';
  
  // Active filter badges
  const activeBadges = Object.entries(filters).filter(([,v]) => v).map(([k]) => ({
    preg: 'Pregnancy', peds: 'Paediatric', geri: 'Geriatric', counsel: 'Counselling', steward: 'Stewardship'
  }[k])).filter(Boolean);

  // PK data
  const pkFields = p.pharmacokinetics ? [
    { l: 'Bioavailability', v: p.pharmacokinetics.bioavailability },
    { l: 'Tmax', v: p.pharmacokinetics.tmax },
    { l: 'Vd', v: p.pharmacokinetics.vd },
    { l: 'Protein Binding', v: p.pharmacokinetics.protein_binding },
    { l: 'Half-life', v: p.pharmacokinetics.half_life },
    { l: 'Metabolism', v: p.pharmacokinetics.metabolism },
    { l: 'Excretion', v: p.pharmacokinetics.excretion },
  ].filter(f => nullify(f.v)) : [];

  // Copy handler
  const handleCopy = () => {
    const text = p.summary + '\n\n' + (p.key_points || []).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); Sounds.play('tick')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // TTS handler
  const handleTTS = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(p.summary || '')
      u.rate = 0.9
      window.speechSynthesis.speak(u)
      Sounds.play('tick')
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mb-5"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary text-background shadow-[0_4px_16px_rgba(255,255,255,0.15)]">
        <span className="ms sm fill">cardiology</span>
      </div>
      
      <div className="flex flex-col gap-1 max-w-[87%]">
        <div className={`bg-card border border-b1 rounded-t-[4px] rounded-b-[20px] overflow-hidden border-l-[3px] ${cat.c}`}>
          
          {/* Category Tag + Evidence Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-wide bg-white/[0.02] border-b border-b1">
            <div className="flex items-center gap-2">
              <span className="ms xs">{cat.i}</span>
              <span className="text-primary">{cat.l}</span>
              {p.drug_name && <span className="text-t2 font-normal normal-case">— {p.drug_name}</span>}
            </div>
            <div className="flex items-center gap-2">
              {nullify(p.evidence_grade) && (
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold tracking-wider ${evClass}`}>
                  Evidence {p.evidence_grade}
                </span>
              )}
              {p.bbw && <span className="text-[10px] px-2 py-0.5 rounded bg-danger text-white font-bold tracking-wider animate-pulse">BBW</span>}
            </div>
          </div>

          {/* Active filter badges */}
          {activeBadges.length > 0 && (
            <div className="flex gap-[5px] flex-wrap px-3.5 py-[7px] border-b border-b1 bg-black/20">
              {activeBadges.map(b => (
                <span key={b} className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-card2 text-t2 border border-b2">{b}</span>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="px-3.5 py-3 font-semibold text-[14.5px] leading-relaxed border-b border-b1 flex items-start gap-2">
            <span className="ms xs text-primary mt-0.5 shrink-0">bookmark</span>
            <span>{p.summary || p.content || 'No summary available.'}</span>
          </div>

          {/* Black Box Warning */}
          {nullify(p.bbw) && (
            <div className="mx-3.5 mt-2.5 px-3 py-2.5 rounded-[9px] text-[12.5px] flex items-start gap-2 leading-relaxed font-medium bg-danger/10 border border-danger/30 text-danger">
              <span className="ms xs shrink-0">warning</span>
              <span><strong>BLACK BOX WARNING:</strong> {p.bbw}</span>
            </div>
          )}

          {/* Pharmacokinetics Grid */}
          {pkFields.length > 0 && (
            <div className="border-t border-b1 mt-2.5">
              <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                <span className="ms xs">science</span> Pharmacokinetics
              </div>
              <div className="grid grid-cols-2 gap-px bg-b1 mx-3.5 mb-3 rounded-lg overflow-hidden border border-b1">
                {pkFields.map((f, i) => (
                  <div key={i} className="bg-card2 px-[10px] py-2">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">{f.l}</div>
                    <div className="text-[13px] text-primary font-mono font-medium">{String(f.v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Details */}
          {p.clinical_details && (
             <div className="border-t border-b1 mt-2.5">
               <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                 <span className="ms xs">menu_book</span> Clinical Overview
               </div>
               <div 
                 className="px-3.5 pb-3 text-[14px] leading-relaxed text-t2 [&>p]:mb-2 [&>strong]:text-primary [&>strong]:font-semibold [&>ul]:pl-5 [&>ul]:mb-2 [&>ul>li]:mb-1"
                 dangerouslySetInnerHTML={{ __html: p.clinical_details }}
               />
             </div>
          )}

          {/* Monitoring Table */}
          {p.monitoring && p.monitoring.length > 0 && (
            <div className="border-t border-b1">
              <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                <span className="ms xs">monitoring</span> Monitoring Parameters
              </div>
              <div className="overflow-x-auto px-3.5 pb-3">
                <table className="w-full border-collapse text-[12.5px] mt-0.5">
                  <thead>
                    <tr>
                      <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted border-b border-b1">Parameter</th>
                      <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted border-b border-b1">Frequency</th>
                      <th className="px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted border-b border-b1">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.monitoring.map((m, i) => (
                      <tr key={i}>
                        <td className="px-2.5 py-1.5 border-b border-b1 text-primary font-semibold">{m.parameter}</td>
                        <td className="px-2.5 py-1.5 border-b border-b1 text-t2">{m.frequency}</td>
                        <td className="px-2.5 py-1.5 border-b border-b1 text-t2">{m.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drug Interactions */}
          {p.interactions && p.interactions.length > 0 && (
            <div className="border-t border-b1">
              <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                <span className="ms xs">compare_arrows</span> Drug Interactions
              </div>
              <div className="px-3.5 pb-3">
                {p.interactions.map((int, i) => (
                  <div key={i} className="py-[9px] border-b border-b1 last:border-none flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-[7px] py-0.5 rounded border ${
                        int.severity === 'Major' ? 'bg-danger/10 text-danger border-danger/30' :
                        int.severity === 'Moderate' ? 'bg-warn/10 text-warn border-warn/30' :
                        'bg-ok/10 text-ok border-ok/20'
                      }`}>{int.severity}</span>
                      <span className="font-bold text-[13px]">{int.drug}</span>
                    </div>
                    <div className="text-[12.5px] text-t2">{int.mechanism}</div>
                    <div className="text-[12.5px] text-primary italic">{int.management}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dose Adjustments */}
          {p.dose_adjustments && (nullify(p.dose_adjustments.renal) || nullify(p.dose_adjustments.hepatic) || nullify(p.dose_adjustments.other)) && (
            <div className="border-t border-b1">
              <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                <span className="ms xs">tune</span> Dose Adjustments
              </div>
              <div className="flex flex-col gap-[5px] px-3.5 pb-3">
                {nullify(p.dose_adjustments.renal) && (
                  <div className="flex gap-2 items-start text-[13px] leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-[6px] py-0.5 rounded bg-blue/15 text-blue shrink-0 mt-0.5">Renal</span>
                    <span className="text-t2">{p.dose_adjustments.renal}</span>
                  </div>
                )}
                {nullify(p.dose_adjustments.hepatic) && (
                  <div className="flex gap-2 items-start text-[13px] leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-[6px] py-0.5 rounded bg-warn/12 text-warn shrink-0 mt-0.5">Hepatic</span>
                    <span className="text-t2">{p.dose_adjustments.hepatic}</span>
                  </div>
                )}
                {nullify(p.dose_adjustments.other) && (
                  <div className="flex gap-2 items-start text-[13px] leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-[6px] py-0.5 rounded bg-white/7 text-t2 shrink-0 mt-0.5">Other</span>
                    <span className="text-t2">{p.dose_adjustments.other}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Points / Clinical Pearls */}
          {p.key_points && p.key_points.length > 0 && (
             <div className="border-t border-b1">
               <div className="flex items-center gap-2 px-3.5 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-t2">
                 <span className="ms xs">checklist</span> Clinical Pearls
               </div>
               <div className="px-3.5 pb-3 pt-1">
                 {p.key_points.map((k, i) => (
                   <div key={i} className="flex items-start gap-2 text-[13.5px] py-1 border-b border-b1 last:border-none text-t2 leading-relaxed">
                     <div className="w-5 h-5 rounded-full bg-black/50 border border-b2 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                       {i + 1}
                     </div>
                     <span>{k}</span>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* References */}
          {p.references && p.references.length > 0 && (
            <div className="px-3.5 py-2.5 flex flex-wrap gap-[5px] items-center bg-black/10 border-t border-b1">
              <span className="text-[10px] text-muted font-bold mr-1 uppercase tracking-wider">Refs</span>
              {p.references.map((r, i) => (
                <span key={i} className="text-[10.5px] px-2 py-0.5 rounded border border-b2 text-t2 bg-card2">{r}</span>
              ))}
            </div>
          )}

          {/* Action Bar — Copy, TTS, Regenerate */}
          <div className="flex border-t border-b1">
            <button 
              onClick={handleCopy}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-transparent border-none text-t2 text-[12.5px] font-semibold hover:bg-blue/10 hover:text-primary transition-all cursor-pointer"
            >
              <span className="ms xs">{copied ? 'check' : 'content_copy'}</span> {copied ? 'Copied!' : 'Copy'}
            </button>
            <div className="w-[1px] bg-b1" />
            <button 
              onClick={handleTTS}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-transparent border-none text-t2 text-[12.5px] font-semibold hover:bg-blue/10 hover:text-primary transition-all cursor-pointer"
            >
              <span className="ms xs">volume_up</span> Listen
            </button>
            <div className="w-[1px] bg-b1" />
            <button 
              onClick={onRegenerate}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-transparent border-none text-t2 text-[12.5px] font-semibold hover:bg-blue/10 hover:text-primary transition-all cursor-pointer"
            >
              <span className="ms xs">refresh</span> Regenerate
            </button>
          </div>

        </div>
        <div className="text-[10px] text-muted px-1">{msg.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    </motion.div>
  );
}
