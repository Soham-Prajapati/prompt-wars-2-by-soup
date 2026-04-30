import { useState, useEffect } from 'react'
import { getTimeline } from '../api'

const STATIC_PHASES = [
  {
    phase: 'Phase 1', date: '19 April 2024', seats: 102, states: 21,
    key_constituencies: ['Coimbatore', 'Nagaland', 'Arunachal Pradesh'],
    turnout: '66.1%', icon: 'P1',
  },
  {
    phase: 'Phase 2', date: '26 April 2024', seats: 89, states: 13,
    key_constituencies: ['Manipur', 'Kerala', 'Rajasthan'],
    turnout: '66.7%', icon: 'P2',
  },
  {
    phase: 'Phase 3', date: '7 May 2024', seats: 94, states: 12,
    key_constituencies: ['Surat', 'Banswara', 'Sambhal'],
    turnout: '65.7%', icon: 'P3',
  },
  {
    phase: 'Phase 4', date: '13 May 2024', seats: 96, states: 10,
    key_constituencies: ['Hyderabad', 'Jammu', 'Shrinagar'],
    turnout: '69.2%', icon: 'P4',
  },
  {
    phase: 'Phase 5', date: '20 May 2024', seats: 49, states: 8,
    key_constituencies: ['Lucknow', 'Rae Bareli', 'Amethi'],
    turnout: '62.2%', icon: 'P5',
  },
  {
    phase: 'Phase 6', date: '25 May 2024', seats: 58, states: 7,
    key_constituencies: ['Varanasi', 'Delhi North', 'Sahibabad'],
    turnout: '63.4%', icon: 'P6',
  },
  {
    phase: 'Phase 7', date: '1 June 2024', seats: 57, states: 8,
    key_constituencies: ['Patna Sahib', 'Nalanda', 'Chandigarh'],
    turnout: '62.2%', icon: 'P7',
  },
  {
    phase: 'Results', date: '4 June 2024', seats: 543, states: 36,
    key_constituencies: ['All 543 constituencies'],
    turnout: '65.8%', icon: 'RS', isResult: true,
  },
]

const STATS = [
  { icon: 'SE', value: '543', label: 'Lok Sabha Seats' },
  { icon: 'VR', value: '96.8 Cr', label: 'Registered Voters' },
  { icon: 'PS', value: '10.5L', label: 'Polling Stations' },
  { icon: 'DU', value: '44 Days', label: 'Election Duration' },
  { icon: 'TO', value: '65.8%', label: 'Avg Voter Turnout' },
  { icon: 'MM', value: '272', label: 'Seats for Majority' },
]

export default function TimelinePage() {
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getTimeline()
      .then(d => d?.phases && setData(d))
      .catch(() => {})
  }, [])

  const phases = (data?.phases || STATIC_PHASES).map((phaseItem, index) => {
    if (phaseItem.phase) return phaseItem
    const fallbackSeats = phaseItem.name?.toLowerCase().includes('phase')
      ? Number(phaseItem.description?.match(/(\d+)\s+constituencies/i)?.[1] || 0)
      : 543
    const fallbackStates = Number(phaseItem.description?.match(/in\s+(\d+)\s+states/i)?.[1] || 0)
    return {
      phase: phaseItem.name || `Phase ${phaseItem.number || index + 1}`,
      date: phaseItem.date || 'Date unavailable',
      seats: fallbackSeats,
      states: fallbackStates,
      key_constituencies: ['Details available in phase description'],
      turnout: 'N/A',
      icon: phaseItem.icon || `P${index + 1}`,
      isResult: phaseItem.name?.toLowerCase().includes('result') || false,
    }
  })

  return (
    <div className="home-page">

      {/* Header */}
      <div className="card timeline-header">
        <h1 className="section-title">Lok Sabha 2024 Timeline</h1>
        <p className="section-subtitle">
          India's largest democratic exercise — 7 phases, 44 days, 96.8 crore voters.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, margin: '14px 0 20px' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6, color: 'var(--ink-light)' }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--size-lg)', color: 'var(--navy)' }}>{s.value}</div>
            <div style={{ fontSize: 'var(--size-xs)', color: 'var(--ink-light)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 'var(--size-md)', marginBottom: 24 }}>
          Phase-by-Phase Guide
        </div>

        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {/* Vertical connector line */}
            {i < phases.length - 1 && (
              <div style={{
                position: 'absolute', left: 21, top: 44, bottom: 0, width: 2,
                background: p.isResult ? 'var(--green)' : 'var(--border)',
                zIndex: 0,
              }} />
            )}

            {/* Phase dot */}
            <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, marginRight: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: p.isResult ? 'var(--green)' : 'var(--saffron)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                border: '3px solid white',
              }}>{p.icon}</div>
            </div>

            {/* Content */}
            <div
              style={{ flex: 1, paddingBottom: 24, cursor: 'pointer' }}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--size-base)', color: p.isResult ? 'var(--green)' : 'var(--navy)' }}>
                  {p.phase}
                </span>
                <span className="pill pill-inactive" style={{ fontSize: 11 }}>{p.date}</span>
                {!p.isResult && (
                  <span className="pill pill-active" style={{ fontSize: 11 }}>{p.seats} seats</span>
                )}
              </div>

              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', marginBottom: 4 }}>
                {p.isResult
                  ? `Final results declared · Average turnout: ${p.turnout}`
                  : `${p.states} states/UTs · Voter turnout: ${p.turnout}`}
              </div>

              {/* Expanded detail */}
              {selected === i && (
                <div className="fade-in" style={{ marginTop: 10, padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div className="section-label" style={{ marginBottom: 8 }}>Key Constituencies</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(p.key_constituencies || []).map((c, ci) => (
                      <span key={ci} className="pill pill-inactive" style={{ fontSize: 12 }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ECI note */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <span className="trust-badge">All data sourced from Election Commission of India (eci.gov.in)</span>
      </div>
    </div>
  )
}
