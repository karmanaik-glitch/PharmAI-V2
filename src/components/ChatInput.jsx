import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { indianDrugs } from '../utils/drugs'
import { Sounds } from '../utils/audio'

const FLAG_DEFS = {
  preg:    { icon: 'pregnant_woman', label: 'Pregnancy' },
  peds:    { icon: 'child_care',     label: 'Pediatric' },
  geri:    { icon: 'elderly',        label: 'Geriatric' },
  counsel: { icon: 'chat_bubble',    label: 'Counseling' },
  steward: { icon: 'shield',         label: 'Stewardship' },
}

export function ChatInput({ onSend, isLoading }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [imageStr, setImageStr] = useState(null)
  const [flags, setFlags] = useState({
    preg: false, peds: false, geri: false, counsel: false, steward: false
  })
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Autocomplete logic
  useEffect(() => {
    const words = query.split(/[\s,]+/)
    const lastWord = words[words.length - 1]
    if (lastWord && lastWord.length >= 2) {
      const l = lastWord.toLowerCase()
      const matches = indianDrugs.filter(d => d.toLowerCase().includes(l)).slice(0, 6)
      setSuggestions(matches)
    } else {
      setSuggestions([])
    }
  }, [query])

  const acceptSuggestion = (sug) => {
    const words = query.split(/[\s,]+/)
    words.pop()
    const newQuery = words.length > 0 ? words.join(' ') + ' ' + sug + ' ' : sug + ' '
    setQuery(newQuery)
    setSuggestions([])
    textareaRef.current?.focus()
    Sounds.play('tick')
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return }
    const reader = new FileReader()
    reader.onload = (event) => {
      setImageStr(event.target.result)
      Sounds.play('tick')
    }
    reader.readAsDataURL(file)
  }

  const submit = () => {
    if ((!query.trim() && !imageStr) || isLoading) return
    onSend({ text: query, flags, image: imageStr })
    setQuery('')
    setImageStr(null)
    setSuggestions([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    Sounds.play('tick')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="w-full max-w-[800px] mx-auto p-3 pb-4 shrink-0 relative z-20">

      {/* Autocomplete Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-3 right-3 bg-card border border-blue/40 shadow-[0_8px_32px_rgba(56,189,248,0.15)] rounded-xl mb-1.5 flex gap-2 p-2 overflow-x-auto hide-scrollbar z-50"
          >
            {suggestions.map(s => (
              <button 
                key={s} onClick={() => acceptSuggestion(s)} 
                className="whitespace-nowrap px-3 py-1.5 bg-blue/10 text-blue font-bold text-[13px] rounded-lg hover:bg-blue hover:text-white transition-colors shrink-0"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imageStr && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-2 bg-card border border-b1 rounded-2xl p-2 flex items-center gap-3 overflow-hidden"
          >
            <img src={imageStr} alt="Attached" className="w-14 h-14 rounded-lg object-cover border border-b2" />
            <div className="flex-1 text-xs text-t2 font-semibold">Image attached for Vision analysis</div>
            <button onClick={() => setImageStr(null)} className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 shrink-0">
              <span className="ms xs">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card/90 backdrop-blur-2xl border border-b1 rounded-[28px] p-1.5 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-2 transition-all focus-within:border-blue/50 focus-within:shadow-[0_8px_40px_rgba(56,189,248,0.12)]">

        {/* Attach Button */}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${imageStr ? 'bg-primary text-background' : 'bg-transparent text-t2 hover:bg-b1/30 hover:text-primary'}`}
        >
          <span className="ms sm">attach_file</span>
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          placeholder="Type or scan a clinical query..."
          className="flex-1 bg-transparent border-none text-primary font-sans text-[15px] p-2 outline-none resize-none max-h-[120px]"
          rows={1}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            // Auto-resize
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={handleKeyDown}
        />

        {/* Send Button */}
        <button
          onClick={submit}
          disabled={isLoading || (!query.trim() && !imageStr)}
          className="w-10 h-10 rounded-[14px] bg-card2 text-t2 border-none flex items-center justify-center shrink-0 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 enabled:bg-blue enabled:text-white enabled:shadow-[0_4px_14px_rgba(56,189,248,0.25)] cursor-pointer"
        >
          <span className="ms sm">arrow_upward</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted mt-2">
        <span className="ms xs text-t2 shrink-0">info</span> Clinical reference only — always consult a licensed healthcare professional.
      </div>
    </div>
  )
}
