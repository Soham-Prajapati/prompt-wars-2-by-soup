import { useState, useRef, useEffect } from 'react'
import { getEvmData, trackEvent } from '../api'

const STATIC_EVM = {
  constituency: 'Varanasi (UP-72)',
  election: 'Lok Sabha General Election 2024',
  total_voters: 1811300,
  evm_model: 'M3 (2020)',
  candidates: [
    { id: 1, name: 'Narendra Modi', party: 'Bharatiya Janata Party', symbol: '01', serial: 1, colour: '#FF6B35' },
    { id: 2, name: 'Ajay Rai', party: 'Indian National Congress', symbol: '02', serial: 2, colour: '#1E40AF' },
    { id: 3, name: 'Sanjay Chauhan', party: 'Bahujan Samaj Party', symbol: '03', serial: 3, colour: '#3B1C8C' },
    { id: 4, name: 'Athar Jamal Lari', party: 'AIMIM', symbol: '04', serial: 4, colour: '#065F46' },
    { id: 5, name: 'NOTA', party: 'None Of The Above', symbol: '05', serial: 5, colour: '#6B7280' },
  ],
  evm_facts: [
    'This EVM has NO WiFi, Bluetooth, or internet connection',
    'Your vote is secret — it cannot be traced back to you',
    'The VVPAT slip is visible for 7 seconds so you can confirm',
    'Indelible ink on your finger ensures you vote only once',
  ],
}

const BOOTH_STEPS = [
  ['1', 'Show voter ID (EPIC card, Aadhaar, etc.) to the Booth Officer'],
  ['2', 'Sign or put thumb impression in the electoral register'],
  ['3', 'Receive indelible ink mark on your left index finger'],
  ['4', 'Enter the voting compartment — alone, no photos allowed'],
  ['5', 'Press the blue button next to your candidate — only once'],
  ['6', 'VVPAT slip appears for 7 seconds — verify your choice'],
]

export default function EvmPage() {
  const [data, setData] = useState(STATIC_EVM)
  const [voted, setVoted] = useState(null)
  const [vvpatVisible, setVvpatVisible] = useState(false)
  const [vvpatCandidate, setVvpatCandidate] = useState(null)
  const [step, setStep] = useState(0)
  const [vvpatSerial] = useState(() => Math.floor(Math.random() * 9000 + 1000))
  const mountedRef = useRef(true)

  useEffect(() => {
    trackEvent('page_view', { page: 'evm-simulator' })
    trackEvent('evm_simulator_started', {})
    mountedRef.current = true
    getEvmData().then(d => { if (mountedRef.current && d) setData(d) }).catch(() => {})
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (step === 2 && voted) {
      trackEvent('evm_simulator_completed', { voted_candidate: voted })
    }
  }, [step, voted])

  const castVote = (candidate) => {
    if (voted) return
    trackEvent('evm_vote_cast', { candidate_id: candidate.id })
    setVvpatCandidate(candidate)
    setVvpatVisible(true)
    setVoted(candidate.id)
    setTimeout(() => {
      if (!mountedRef.current) return
      setVvpatVisible(false)
      setStep(2)
    }, 3500)
  }

  const reset = () => {
    setVoted(null); setVvpatVisible(false); setVvpatCandidate(null); setStep(1)
  }

  const votedCandidate = data.candidates.find(c => c.id === voted)

  return (
    <div className="home-page">
      <section className="card panel-pad">
        <p className="section-label">EVM simulator</p>
        <h1 className="section-title">Practice the booth flow before election day.</h1>
        <p className="section-subtitle">Simulate voting on an EVM interface and review each booth step.</p>
      </section>

      {/* ── Step 0: Instructions ── */}
      {step === 0 && (
        <div className="card panel-pad">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--size-md)', color: 'var(--navy)' }}>Before you enter the booth</div>
              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)' }}>{data.constituency} · {data.election}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {BOOTH_STEPS.map(([n, text]) => (
              <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--saffron)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}>{n}</div>
                <div style={{ fontSize: 'var(--size-base)', color: 'var(--ink)', paddingTop: 4, lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 'var(--size-md)' }} onClick={() => setStep(1)}>
            Enter voting booth
          </button>
        </div>
      )}

      {/* ── Step 1: Vote ── */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 200px', gap: 18 }}>

          {/* Info panel */}
          <div>
            <div className="card card-saffron" style={{ padding: '14px 18px', marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 4 }}>Constituency</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--size-md)', color: 'var(--navy)' }}>{data.constituency}</div>
              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', marginBottom: 10 }}>{data.election}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="pill pill-inactive">Model: {data.evm_model}</span>
                <span className="pill pill-inactive">Voters: {(data.total_voters / 100000).toFixed(1)}L</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.evm_facts.map((fact, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', fontSize: 16, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EVM Machine */}
          <div>
            <div className="evm-machine" style={{ padding: 14 }}>
              {/* Header panel */}
              <div style={{ textAlign: 'center', marginBottom: 10, background: 'rgba(0,0,0,0.1)', borderRadius: 6, padding: '6px' }}>
                <div style={{ fontSize: 9, color: '#444', letterSpacing: 2, fontWeight: 700 }}>BALLOTING UNIT</div>
                <div style={{ fontSize: 8, color: '#555' }}>M3 EVM · ELECTION COMMISSION OF INDIA</div>
              </div>

              {/* Candidate buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {data.candidates.map(c => (
                  <button
                    key={c.id}
                    onClick={() => castVote(c)}
                    disabled={!!voted}
                    className="evm-button"
                    style={{
                      padding: '8px 10px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: voted && voted !== c.id ? 0.35 : 1,
                      outline: voted === c.id ? `2px solid ${c.colour}` : 'none',
                      outlineOffset: 1,
                    }}
                  >
                    {/* Blue press button */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: voted === c.id ? c.colour : '#1E40AF',
                      border: '2px solid rgba(0,0,0,0.2)',
                      boxShadow: voted === c.id ? `0 0 8px ${c.colour}` : 'none',
                    }} />
                    <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 8, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.party.substring(0, 22)}</div>
                    </div>
                    <span style={{ fontSize: 13 }}>{c.symbol}</span>
                  </button>
                ))}
              </div>

              {/* LED status */}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: voted ? '#0B7B2A' : '#E87722',
                  boxShadow: `0 0 5px ${voted ? '#0B7B2A' : '#E87722'}`,
                }} />
                <span style={{ fontSize: 8, color: '#555', fontWeight: 600 }}>{voted ? 'VOTE CAST' : 'READY'}</span>
              </div>
            </div>

            {/* VVPAT window */}
            {vvpatVisible && vvpatCandidate && (
              <div style={{ overflow: 'hidden', height: 80, marginTop: 4, border: '2px solid #8A8B8C', borderRadius: 6, background: '#C8C9CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="vvpat-slip" style={{
                  background: '#FFFBF0', padding: '8px 12px', borderRadius: 3,
                  border: '1px dashed #B8A060', margin: '0 8px', fontSize: 10,
                }}>
                  <div style={{ color: '#888', fontSize: 8, marginBottom: 2 }}>VVPAT — ELECTION COMMISSION OF INDIA</div>
                  <div style={{ fontWeight: 700, color: '#1A1A2E' }}>{vvpatCandidate.name}</div>
                  <div style={{ color: '#555' }}>{vvpatCandidate.party.substring(0, 25)}</div>
                  <div style={{ color: '#999', fontSize: 8, marginTop: 2 }}>Serial No: {vvpatSerial}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Success ── */}
      {step === 2 && (
        <div className="card card-green fade-in" style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--size-xl)', fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
            Vote Cast Successfully!
          </h2>
          <p style={{ color: 'var(--ink-mid)', marginBottom: 6 }}>
            You voted for <strong style={{ color: 'var(--navy)' }}>{votedCandidate?.name}</strong>
          </p>
          <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-light)', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
            Your vote is encrypted and securely stored. The VVPAT slip drops into a sealed compartment for audit purposes.
          </p>
          <button className="btn-secondary" onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  )
}
