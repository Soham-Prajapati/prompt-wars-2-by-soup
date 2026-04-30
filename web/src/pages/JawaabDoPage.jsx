import { useState, useEffect } from 'react'
import { submitReport, getReports } from '../api'

const PARTIES = [
  'Bharatiya Janata Party (BJP)',
  'Indian National Congress (INC)',
  'Aam Aadmi Party (AAP)',
  'Samajwadi Party (SP)',
  'Bahujan Samaj Party (BSP)',
  'Trinamool Congress (TMC)',
  'Shiv Sena',
  'Nationalist Congress Party (NCP)',
  'Communist Party of India (Marxist)',
  'Telangana Rashtra Samithi (BRS)',
  'YSR Congress Party',
  'Dravida Munnetra Kazhagam (DMK)',
  'Other / Independent',
]

const CATEGORIES = [
  { id: 'infrastructure', label: 'Roads & Infrastructure', icon: '🛣️' },
  { id: 'water',          label: 'Water & Electricity',   icon: '💧' },
  { id: 'employment',     label: 'Jobs & Employment',     icon: '💼' },
  { id: 'health',         label: 'Healthcare',            icon: '🏥' },
  { id: 'education',      label: 'Schools & Education',   icon: '🏫' },
  { id: 'welfare',        label: 'Welfare Schemes',       icon: '🤝' },
  { id: 'other',          label: 'Other Promise',         icon: '📋' },
]

const PRIVACY_POINTS = [
  { icon: '🗑️', text: 'GPS location data stripped from your photo before upload' },
  { icon: '🚫', text: 'Your IP address and device info are never stored' },
  { icon: '👤', text: 'Zero personally identifiable information collected' },
  { icon: '🔍', text: 'AI + human moderators verify evidence before publishing' },
  { icon: '⏰', text: 'Report visible to public only after 24-hour review window' },
]

export default function JawaabDoPage() {
  const [tab, setTab] = useState('feed')
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [safetyRead, setSafetyRead] = useState(false)
  const [form, setForm] = useState({ claim_text: '', party: '', promise_text: '', category: 'infrastructure', constituency: '' })
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (tab !== 'feed') return
    setLoadingReports(true)
    getReports().then(r => setReports(r || [])).catch(() => setReports([])).finally(() => setLoadingReports(false))
  }, [tab])

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setFilePreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!form.claim_text || !form.party || !form.promise_text) return
    setSubmitting(true); setSubmitError(null)
    try {
      const fd = new FormData()
      fd.append('claim_text', form.claim_text)
      fd.append('party', form.party)
      fd.append('category', form.category)
      fd.append('constituency', form.constituency)
      fd.append('promise_id', '')
      if (file) fd.append('image', file)
      await submitReport(fd)
      setSubmitted(true)
    } catch (e) {
      setSubmitError(e.message || 'Submission failed — please try again.')
    } finally { setSubmitting(false) }
  }

  const resetForm = () => {
    setSubmitted(false); setSafetyRead(false)
    setForm({ claim_text: '', party: '', promise_text: '', category: 'infrastructure', constituency: '' })
    setFile(null); setFilePreview(null)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div className="card card-saffron" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--navy)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>JD</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--size-xl)', fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
            Jawaab Do — जवाब दो
          </h1>
          <p style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)', lineHeight: 1.6 }}>
            Hold politicians accountable for unfulfilled promises. Submit anonymous, evidence-backed reports.
            All submissions are AI-verified before publishing. <strong>Your identity is fully protected.</strong>
          </p>
        </div>
        <span className="trust-badge" style={{ flexShrink: 0 }}>100% Anonymous</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { id: 'feed', label: 'Verified Reports' },
          { id: 'submit', label: 'Submit Report' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 22px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? 'var(--saffron)' : 'var(--ink-mid)',
            borderBottom: tab === t.id ? '2px solid var(--saffron)' : '2px solid transparent',
            marginBottom: -2, fontSize: 'var(--size-base)',
            fontFamily: 'var(--font-body)', transition: 'var(--transition)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Feed tab ── */}
      {tab === 'feed' && (
        <div>
          {loadingReports ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
              <p style={{ color: 'var(--ink-mid)', marginTop: 12 }}>Loading verified reports…</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--size-md)', color: 'var(--navy)', marginBottom: 6 }}>
                No verified reports yet
              </div>
              <p style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)', maxWidth: 440, margin: '0 auto 20px' }}>
                Be the first to hold a politician accountable. Submit an evidence-backed report and it will appear here after verification.
              </p>
              <button className="btn-primary" onClick={() => setTab('submit')}>
                Submit First Report
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reports.map((r, i) => (
                <div key={i} className="card card-hover" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                    <span className="badge" style={{ color: 'var(--verified)', fontSize: 12 }}>✅ Verified</span>
                    <span className="pill pill-inactive" style={{ fontSize: 11 }}>{r.party}</span>
                    <span className="pill pill-inactive" style={{ fontSize: 11 }}>{r.category}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 'var(--size-xs)', color: 'var(--ink-light)' }}>
                      {new Date(r.verified_at || Date.now()).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Promise: {r.promise_text || 'Not linked to a manifesto line'}</p>
                  <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{r.claim_text}</p>
                  {r.constituency && (
                    <div style={{ fontSize: 'var(--size-xs)', color: 'var(--ink-light)', marginTop: 6 }}>
                      {r.constituency}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Submit tab ── */}
      {tab === 'submit' && (
        <div>
          {/* Success */}
          {submitted ? (
            <div className="card card-green fade-in" style={{ padding: '40px 28px', textAlign: 'center' }}>
              <h2 style={{ fontWeight: 800, fontSize: 'var(--size-xl)', color: 'var(--navy)', marginBottom: 8 }}>
                Report Submitted!
              </h2>
              <p style={{ color: 'var(--ink-mid)', maxWidth: 440, margin: '0 auto 24px', fontSize: 'var(--size-base)', lineHeight: 1.65 }}>
                Your report is under AI + human review. If verified, it will appear publicly within 24 hours. Your identity is permanently protected.
              </p>
              <div className="trust-badge" style={{ margin: '0 auto 24px', display: 'inline-flex' }}>Zero trace of your identity</div>
              <br />
              <button className="btn-secondary" onClick={resetForm}>Submit Another Report</button>
            </div>
          ) : !safetyRead ? (
            /* Safety briefing */
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--size-md)', color: 'var(--navy)', marginBottom: 6 }}>
                How we protect you
              </div>
              <p style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)', marginBottom: 20, lineHeight: 1.65 }}>
                Jawaab Do is built for citizen safety. Before you submit, please understand exactly how your privacy is protected:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {PRIVACY_POINTS.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
                    <span style={{ fontSize: 'var(--size-base)', color: 'var(--ink)', lineHeight: 1.5 }}>{p.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--false-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--false)', marginBottom: 20 }}>
                <p style={{ fontWeight: 700, color: 'var(--false)', marginBottom: 4 }}>Important Warning</p>
                <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                  Do not submit false claims. Deliberate misinformation harms democracy and weakens genuine accountability. 
                  Fabricated reports will be rejected and may be reported to authorities.
                </p>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 'var(--size-md)' }} onClick={() => setSafetyRead(true)}>
                I Understand - Proceed to Report
              </button>
            </div>
          ) : (
            /* Form */
            <div className="card" style={{ padding: '24px 28px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--size-md)', color: 'var(--navy)', marginBottom: 18 }}>
                Submit Accountability Report
              </div>

              {submitError && (
                <div style={{ padding: '12px 16px', background: 'var(--false-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--false)', marginBottom: 16 }}>
                  <p style={{ color: 'var(--false)', fontWeight: 600, fontSize: 'var(--size-sm)' }}>{submitError}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Party */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    Political Party / Leader *
                  </label>
                  <select className="input" value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}>
                    <option value="">Select party…</option>
                    {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    Category of Promise *
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))} className={`pill ${form.category === c.id ? 'pill-active' : 'pill-inactive'}`} style={{ fontSize: 'var(--size-sm)', padding: '7px 12px' }}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promise */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    What was the promise? *
                  </label>
                  <input
                    className="input"
                    value={form.promise_text}
                    onChange={e => setForm(f => ({ ...f, promise_text: e.target.value }))}
                    placeholder="e.g. Promised to build a pucca road by 2023..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    Describe what happened (or didn't) *
                  </label>
                  <textarea
                    className="input"
                    value={form.claim_text}
                    onChange={e => setForm(f => ({ ...f, claim_text: e.target.value }))}
                    placeholder="Explain the broken promise with as much detail as possible. Include dates, area names, what was promised vs reality..."
                    style={{ minHeight: 120 }}
                  />
                </div>

                {/* Location (optional) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    Location (optional — village/district/state)
                  </label>
                  <input
                    className="input"
                    value={form.constituency}
                    onChange={e => setForm(f => ({ ...f, constituency: e.target.value }))}
                    placeholder="e.g. Rampur village, Gorakhpur district, Uttar Pradesh"
                  />
                </div>

                {/* Photo evidence */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', marginBottom: 6, fontSize: 'var(--size-sm)' }}>
                    Photo Evidence (optional but strongly recommended)
                  </label>
                  <div
                    style={{
                      border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                      padding: '20px', textAlign: 'center', cursor: 'pointer',
                      background: 'var(--surface-3)', transition: 'var(--transition)',
                    }}
                    onClick={() => document.getElementById('evidence-upload').click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
                  >
                    {filePreview ? (
                      <img src={filePreview} alt="Evidence preview" style={{ maxHeight: 160, borderRadius: 8, maxWidth: '100%' }} />
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>IMG</div>
                        <p style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)' }}>
                          Click or drag a photo here
                        </p>
                        <p style={{ color: 'var(--ink-light)', fontSize: 'var(--size-xs)', marginTop: 4 }}>
                          GPS metadata is automatically stripped before upload
                        </p>
                      </div>
                    )}
                    <input id="evidence-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  {file && <p style={{ fontSize: 'var(--size-xs)', color: 'var(--green)', marginTop: 6 }}>Photo selected · EXIF data will be stripped before upload</p>}
                </div>

                {/* Anonymous assurance banner */}
                <div style={{ padding: '12px 16px', background: 'var(--green-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>ID</span>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 'var(--size-sm)', marginBottom: 2 }}>Your anonymity is guaranteed</p>
                    <p style={{ fontSize: 'var(--size-xs)', color: 'var(--ink-mid)' }}>No IP, no name, no location data is stored. This report cannot be traced back to you.</p>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 'var(--size-md)' }}
                  onClick={handleSubmit}
                  disabled={submitting || !form.claim_text || !form.party || !form.promise_text}
                >
                  {submitting ? 'Submitting securely...' : 'Submit Anonymous Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
