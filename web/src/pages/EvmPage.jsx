import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, CheckCircle, Info, ChevronRight, Fingerprint, ShieldCheck } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Identification', body: 'Show your Voter ID (EPIC card) to the Polling Officer.', icon: <CheckCircle size={20} /> },
  { id: 2, title: 'Marking', body: 'The officer will mark your left index finger with indelible ink.', icon: <CheckCircle size={20} /> },
  { id: 3, title: 'Ballot Activation', body: 'The Presiding Officer enables the Balloting Unit from the Control Unit.', icon: <CheckCircle size={20} /> },
  { id: 4, title: 'Casting Vote', body: 'Press the blue button next to your chosen candidate on the EVM.', icon: <CheckCircle size={20} /> },
  { id: 5, title: 'VVPAT Verification', body: 'A slip is visible for 7 seconds behind the glass to confirm your choice.', icon: <CheckCircle size={20} /> },
]

export default function EvmPage() {
  const [step, setStep] = useState(0)

  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Header ── */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(232, 119, 34, 0.05)', padding: '8px 16px', borderRadius: '30px', marginBottom: '16px' }}>
           <Smartphone size={18} color="var(--eci-saffron)" />
           <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--eci-saffron)', textTransform: 'uppercase' }}>Voting Literacy Module</span>
        </div>
        <h1 className="section-title" style={{ fontSize: '42px' }}>Interactive EVM Simulator</h1>
        <p className="section-subtitle">Practice the voting booth flow to build confidence for polling day.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* ── Left: Steps Guide ── */}
        <section className="gov-card">
           <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '24px', color: 'var(--ashoka-blue)' }}>THE 5-STEP BOOTH PROTOCOL</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ 
                  display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', border: '1.5px solid var(--border)',
                  background: step === i ? 'rgba(0, 51, 102, 0.03)' : '#fff',
                  borderColor: step === i ? 'var(--ashoka-blue)' : 'var(--border)',
                  transition: 'var(--transition)'
                }}>
                   <div style={{ 
                     width: '28px', height: '28px', borderRadius: '50%', background: step >= i ? 'var(--ashoka-blue)' : 'var(--border)', 
                     color: '#fff', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 900, flexShrink: 0
                   }}>{s.id}</div>
                   <div>
                      <p style={{ fontWeight: 800, color: step === i ? 'var(--ashoka-blue)' : 'var(--text-main)', fontSize: '15px' }}>{s.title}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.body}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* ── Right: Visual Simulator ── */}
        <section style={{ position: 'sticky', top: '120px' }}>
           <div className="gov-card" style={{ height: '500px', background: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'var(--ashoka-blue)', padding: '16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '12px', fontWeight: 800 }}>EVM BU-M3 (SIMULATED)</span>
                 <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--india-green)', boxShadow: '0 0 8px var(--india-green)' }} />
              </div>

              <div style={{ padding: '32px', flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                 <AnimatePresence mode="wait">
                    <motion.div 
                      key={step}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                       <div style={{ marginBottom: '24px', opacity: 0.6 }}><Fingerprint size={64} color="var(--ashoka-blue)" style={{ margin: '0 auto' }} /></div>
                       <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>{STEPS[step].title}</h2>
                       <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '300px' }}>Please follow the instruction on the left to proceed.</p>
                    </motion.div>
                 </AnimatePresence>
              </div>

              <div style={{ padding: '24px', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                 <button className="gov-button gov-button-outline" onClick={() => setStep(Math.max(0, step - 1))}>Previous</button>
                 <button className="gov-button" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}>
                   {step === STEPS.length - 1 ? 'Finish Simulation' : 'Next Step'} <ChevronRight size={18} />
                 </button>
              </div>
           </div>

           <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-light)' }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>This is a safe, educational simulation. No actual data is recorded.</span>
           </div>
        </section>

      </div>
    </div>
  )
}
