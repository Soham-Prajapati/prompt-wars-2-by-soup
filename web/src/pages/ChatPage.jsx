import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Volume2, VolumeX, Trash2, ShieldCheck, Globe, Zap, MessageSquare, Landmark, Search, Sparkles } from 'lucide-react'
import { chatStream, trackEvent } from '../api'
import { FormattedText } from '../components/chat/FormattedText'

const LANGUAGES = ['English', 'हिन्दी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'मराठी', 'ગુજરાતી']

const STARTER_QS = [
  'How does EVM voting work?',
  'What is VVPAT and why does it matter?',
  'How do I check voter registration?',
  'What is the Model Code of Conduct?',
  'How are election results counted?',
  'What documents do I need to vote?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('English')
  const [expertise, setExpertise] = useState('beginner')
  const [inputMode, setInputMode] = useState('text')
  const [sttSupported, setSttSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [speechRate, setSpeechRate] = useState(1)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    trackEvent('page_view', { page: 'chat' })
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    const supportsRecognition = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setSttSupported(supportsRecognition)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const stopSpeaking = () => {
    if (!speechSupported) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }

  const speakMessage = (id, text) => {
    if (!speechSupported || !text?.trim()) return
    if (speakingId === id) { stopSpeaking(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    utterance.lang = languageCode()
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)
    setSpeakingId(id)
    window.speechSynthesis.speak(utterance)
  }

  const languageCode = () => {
    const map = {
      'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
      'Marathi': 'mr-IN', 'Gujarati': 'gu-IN', 'Kannada': 'kn-IN', 'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN', 'Urdu': 'ur-IN', 'Odia': 'or-IN'
    }
    return map[language] || 'en-IN'
  }

  const startListening = () => {
    if (!sttSupported || loading) return
    if (isListening) { recognitionRef.current?.stop(); return }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = languageCode(); recognition.continuous = false; recognition.interimResults = true
    recognition.onstart = () => { setIsListening(true) }
    recognition.onresult = (event) => {
      let finalText = ''; let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += `${chunk} `
        else interimText += chunk
      }
      setInput(`${finalText}${interimText}`.trim())
    }
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition; recognition.start()
  }

  const send = async (query) => {
    if (!query.trim() || loading) return
    trackEvent('chat_question_submitted', { query_len: query.length, language, expertise_level: expertise })
    const userMsg = { role: 'user', text: query, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setLoading(true)

    const aiId = Date.now() + 1
    setMessages(prev => [...prev, { role: 'model', text: '', sources: [], id: aiId, streaming: true }])

    // On-Device AI (Gemini Nano) Fallback
    if (window.ai && window.ai.createTextSession && !navigator.onLine) {
        try {
            const session = await window.ai.createTextSession()
            const response = await session.prompt(query)
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: response, streaming: false } : m))
            setLoading(false); return
        } catch (e) { console.warn("Nano failed", e) }
    }

    const history = [...messages, userMsg].slice(-6).map(m => ({ role: m.role, text: m.text }))

    await chatStream(
      { query, language, expertise_level: expertise, conversation_history: history },
      (chunk) => setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: m.text + chunk } : m)),
      (sources) => setMessages(prev => prev.map(m => m.id === aiId ? { ...m, sources } : m)),
      () => setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m)),
      (err) => { setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `⚠️ ${err}`, streaming: false, error: true } : m)); setLoading(false) }
    )
    setLoading(false)
  }

  return (
    <div className="chat-page" style={{ height: 'calc(100vh - 84px)', display: 'grid', gridTemplateColumns: '340px 1fr' }}>
      
      {/* ── Sidebar (Civic Aside) ── */}
      <aside style={{ background: 'var(--bg-aside)', borderRight: '1px solid var(--border)', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} strokeWidth={3} /> Language Support
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLanguage(l)} style={{ 
                padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)',
                background: language === l ? 'var(--ashoka-blue)' : '#fff',
                color: language === l ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'var(--transition)'
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} strokeWidth={3} /> Response Depth
          </h3>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px' }}>
            <button onClick={() => setExpertise('beginner')} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', background: expertise === 'beginner' ? '#fff' : 'transparent', color: expertise === 'beginner' ? 'var(--ashoka-blue)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: expertise === 'beginner' ? 'var(--shadow-sm)' : 'none' }}>CITIZEN</button>
            <button onClick={() => setExpertise('expert')} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', background: expertise === 'expert' ? '#fff' : 'transparent', color: expertise === 'expert' ? 'var(--ashoka-blue)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: expertise === 'expert' ? 'var(--shadow-sm)' : 'none' }}>LEGAL</button>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button className="gov-button gov-button-outline" onClick={() => setMessages([])} style={{ width: '100%', justifyContent: 'center', fontSize: '13px', borderColor: '#E2E8F0', color: '#64748B' }}>
            <Trash2 size={14} /> Clear Conversation
          </button>
          <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShieldCheck size={16} color="var(--india-green)" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--india-green)' }}>ECI VERIFIED DATA</span>
             </div>
             <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
               Information provided is generated based on official ECI handbooks and legal documents.
             </p>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
        
        {/* Workspace Header */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Landmark size={20} color="var(--ashoka-blue)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Civic Intelligence Assistant</h2>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', fontSize: '12px', fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--india-green)' }} />
              SECURE PORTAL
           </div>
        </div>

        {/* Chat Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0, 51, 102, 0.05)', color: 'var(--ashoka-blue)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                    <MessageSquare size={32} />
                  </div>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '16px' }}>How can I help you <br/> with the election process?</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Select a topic below or type your query to begin your civic learning journey.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {STARTER_QS.map(q => (
                      <button key={q} onClick={() => send(q)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--eci-saffron)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>{q}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    maxWidth: '80%', padding: '20px 24px', borderRadius: '16px', fontSize: '15px', lineHeight: 1.7,
                    background: msg.role === 'user' ? 'var(--eci-saffron)' : 'var(--bg-aside)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(232, 119, 34, 0.2)' : 'none'
                  }}>
                    <FormattedText text={msg.text || (msg.streaming && 'Processing official records...') } />
                  </div>
                  {msg.role === 'model' && msg.text && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                      <button onClick={() => speakMessage(msg.id, msg.text)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                        {speakingId === msg.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      {msg.sources?.map((s, i) => (
                        <span key={i} style={{ fontSize: '10px', color: 'var(--ashoka-blue)', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(0,51,102,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input Control */}
        <div style={{ padding: '0 40px 40px' }}>
          <div style={{ border: '2px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 8px 8px 20px', background: '#fff', transition: 'var(--transition)' }} onFocusWithin={e => e.currentTarget.style.borderColor = 'var(--ashoka-blue)'} onBlurWithin={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <Search size={20} color="var(--text-light)" />
            <input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Search ECI records or ask a question..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '15px', fontWeight: 500 }}
            />
            <button onClick={startListening} style={{ background: isListening ? 'rgba(232, 119, 34, 0.1)' : 'transparent', border: 'none', color: isListening ? 'var(--eci-saffron)' : 'var(--text-light)', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'grid', placeItems: 'center' }}>
              <Mic size={20} />
            </button>
            <button onClick={() => send(input)} disabled={loading || !input.trim()} className="gov-button" style={{ padding: '10px 24px', borderRadius: '12px' }}>
              {loading ? '...' : <><Send size={18} /> SEND</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
