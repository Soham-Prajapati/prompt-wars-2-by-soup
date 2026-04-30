import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Volume2, VolumeX, Trash2, ShieldCheck, Globe, Zap, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react'
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
  'What is NOTA and when to use it?',
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
  const [liveTranscript, setLiveTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [speechRate, setSpeechRate] = useState(1)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const lastSpokenIdRef = useRef(null)

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
    switch (language) {
      case 'हिन्दी': return 'hi-IN'; case 'বাংলা': return 'bn-IN'; case 'தமிழ்': return 'ta-IN';
      case 'తెలుగు': return 'te-IN'; case 'मराठी': return 'mr-IN'; case 'ગુજરાતી': return 'gu-IN';
      default: return 'en-IN'
    }
  }

  const startListening = () => {
    if (!sttSupported || loading) return
    if (isListening) { recognitionRef.current?.stop(); return }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = languageCode(); recognition.continuous = false; recognition.interimResults = true
    recognition.onstart = () => { setIsListening(true); setLiveTranscript('') }
    recognition.onresult = (event) => {
      let finalText = ''; let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += `${chunk} `
        else interimText += chunk
      }
      const merged = `${finalText}${interimText}`.trim()
      setLiveTranscript(merged); setInput(merged)
    }
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition; recognition.start()
  }

  const send = async (query) => {
    if (!query.trim() || loading) return
    trackEvent('chat_question_submitted', { query_len: query.length, language, expertise_level: expertise, input_mode: inputMode })
    const userMsg = { role: 'user', text: query, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setLoading(true)

    const aiId = Date.now() + 1
    setMessages(prev => [...prev, { role: 'model', text: '', sources: [], id: aiId, streaming: true }])

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
    <div className="chat-page" style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', padding: '10px' }}>
      
      {/* ── Sidebar (Glassmorphic Premium) ── */}
      <aside className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} strokeWidth={3} /> SELECT LANGUAGE
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLanguage(l)} style={{ 
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1px solid var(--border)',
                background: language === l ? 'var(--saffron)' : 'rgba(255,255,255,0.03)',
                color: language === l ? '#fff' : 'var(--ink-mid)',
                cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: language === l ? '0 4px 12px rgba(232, 119, 34, 0.3)' : 'none'
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} strokeWidth={3} /> CIVIC DEPTH
          </h3>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setExpertise('beginner')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', background: expertise === 'beginner' ? 'var(--saffron)' : 'transparent', color: expertise === 'beginner' ? '#fff' : 'var(--ink-light)', cursor: 'pointer', transition: 'all 0.3s' }}>BEGINNER</button>
            <button onClick={() => setExpertise('expert')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', background: expertise === 'expert' ? 'var(--saffron)' : 'transparent', color: expertise === 'expert' ? '#fff' : 'var(--ink-light)', cursor: 'pointer', transition: 'all 0.3s' }}>EXPERT</button>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glow-button-secondary" onClick={() => setMessages([])} style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '14px', borderRadius: '12px', background: 'rgba(255,75,75,0.05)', color: '#ff4b4b', borderColor: 'rgba(255,75,75,0.2)' }}>
            <Trash2 size={16} /> CLEAR CONVERSATION
          </motion.button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--green)', fontSize: '11px', fontWeight: 700 }}>
              <CheckCircle2 size={12} /> SECURE & ENCRYPTED
            </div>
            <p style={{ fontSize: '11px', color: 'var(--ink-light)', textAlign: 'center', lineHeight: 1.5, opacity: 0.7 }}>
              Official data from Election Commission of India. Strictly neutral AI guide.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <main className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Chat Header */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--saffron)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>EI</div>
            <div>
               <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Election Guide</h2>
               <p style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, margin: 0 }}>● ONLINE & ACTIVE</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Sparkles size={18} color="var(--saffron)" />
          </div>
        </div>

        {/* Chat Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div style={{ maxWidth: '440px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'var(--saffron-bg)', color: 'var(--saffron)', display: 'grid', placeItems: 'center', margin: '0 auto 28px', border: '1px solid var(--saffron-border)' }}>
                    <MessageSquare size={36} strokeWidth={2.5} />
                  </div>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-1px' }}>Jai Hind. <br/> How can I guide you?</h2>
                  <p style={{ color: 'var(--ink-mid)', marginBottom: '40px', fontSize: '16px' }}>Understand the world's largest democratic exercise in your own language.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {STARTER_QS.slice(0, 4).map(q => (
                      <motion.button whileHover={{ scale: 1.02, borderColor: 'var(--saffron)' }} key={q} onClick={() => send(q)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'var(--ink)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>{q}</motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    maxWidth: '85%', padding: '20px 24px', borderRadius: '20px', fontSize: '15px', lineHeight: 1.7,
                    background: msg.role === 'user' ? 'var(--saffron)' : 'rgba(255,255,255,0.04)',
                    color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: msg.role === 'user' ? '0 10px 30px rgba(232, 119, 34, 0.25)' : '0 4px 24px rgba(0,0,0,0.15)',
                    position: 'relative'
                  }}>
                    <FormattedText text={msg.text || (msg.streaming && '...') } />
                  </div>
                  {msg.role === 'model' && msg.text && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                      <motion.button whileHover={{ scale: 1.1 }} onClick={() => speakMessage(msg.id, msg.text)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-light)', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                        {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </motion.button>
                      {msg.sources?.map((s, i) => (
                        <span key={i} style={{ fontSize: '11px', color: 'var(--saffron)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOURCE: {s}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Floating Input (Stitch-Level) */}
        <div style={{ padding: '0 40px 40px', background: 'linear-gradient(to top, var(--surface-2) 40%, transparent)' }}>
          <div className="glass-panel shadow-raised" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 10px 10px 24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(30, 34, 51, 0.6)' }}>
            <input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask anything about Indian elections..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '16px', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button whileHover={{ scale: 1.1 }} onClick={startListening} style={{ background: isListening ? 'rgba(255,75,75,0.2)' : 'rgba(255,255,255,0.05)', border: 'none', color: isListening ? '#ff4b4b' : 'var(--ink-mid)', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '16px', display: 'grid', placeItems: 'center', transition: 'all 0.3s' }}>
                <Mic size={22} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} disabled={loading || !input.trim()} onClick={() => send(input)} style={{
                background: 'var(--saffron)', color: '#fff', border: 'none', padding: '0 24px', height: '44px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(232, 119, 34, 0.3)'
              }}>
                {loading ? 'WAITING...' : <><Send size={18} strokeWidth={3} /> SEND</>}
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
