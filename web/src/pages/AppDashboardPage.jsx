import { Link } from 'react-router-dom'

const MODULES = [
  {
    title: 'Constituency Intelligence',
    body: 'Start from your seat, local context, and likely voter concerns.',
    action: 'Find Constituency',
    to: '/',
    status: 'Ready',
  },
  {
    title: 'Election Q&A',
    body: 'Ask plain-language questions with source-aware civic responses.',
    action: 'Open Ask',
    to: '/chat',
    status: 'Ready',
  },
  {
    title: 'Misinformation Check',
    body: 'Verify claims and forwards before sharing.',
    action: 'Open Verify',
    to: '/fact-check',
    status: 'Ready',
  },
  {
    title: 'Learning Journey',
    body: 'EVM simulation, timeline context, and quiz progression.',
    action: 'Open Learn Hub',
    to: '/learn',
    status: 'Ready',
  },
]

const NEXT_STEPS = [
  { label: 'Find your constituency', to: '/' },
  { label: 'Ask one election question', to: '/chat' },
  { label: 'Fact-check one claim', to: '/fact-check' },
]

export default function AppDashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="card panel-pad">
        <div>
          <p className="section-label">Workspace</p>
          <h1 className="section-title">Pick one civic task and complete it.</h1>
          <p className="section-subtitle">This page is your operational start point for Q&A, verification, learning, and constituency analysis.</p>
          <div className="home-hero-actions">
            <Link className="btn-primary" to="/chat">Start with Q&A</Link>
            <Link className="btn-secondary" to="/fact-check">Verify a claim</Link>
          </div>
        </div>
        <div className="dashboard-chip-group" style={{ marginTop: 12 }}>
          <span className="pill pill-active">Neutral</span>
          <span className="pill pill-inactive">Source-backed</span>
          <span className="pill pill-inactive">Constituency-first</span>
        </div>
      </section>

      <section className="dashboard-summary-grid">
        <article className="card panel-pad">
          <h2 className="learn-title">What to do now</h2>
          <p className="learn-subtitle">Follow this quick sequence to get immediate value.</p>
          <div className="dashboard-steps">
            {NEXT_STEPS.map((step) => (
              <Link key={step.label} className="pill pill-inactive" to={step.to}>
                {step.label}
              </Link>
            ))}
          </div>
        </article>
        <article className="card panel-pad">
          <h2 className="learn-title">Coverage</h2>
          <p className="learn-subtitle">Each module is wired as a focused workflow.</p>
          <div className="home-trust-list">
            <span className="trust-badge">Q&A with streaming answers</span>
            <span className="trust-badge">Claim-by-claim fact checks</span>
            <span className="trust-badge">Timeline, quiz, and EVM practice</span>
          </div>
        </article>
      </section>

      <section className="quick-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {MODULES.map(module => (
          <article key={module.title} className="quick-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <h3>{module.title}</h3>
              <span className="pill pill-active" style={{ fontSize: 11 }}>{module.status}</span>
            </div>
            <p>{module.body}</p>
            <Link className="btn-secondary" to={module.to}>
              {module.action}
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
