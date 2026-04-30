import { Link } from 'react-router-dom'

const LEARN_MODULES = [
  {
    title: 'EVM Simulator',
    body: 'Practice the exact voting flow before election day.',
    to: '/evm-simulator',
    cta: 'Start Simulation',
  },
  {
    title: 'Election Timeline',
    body: 'Understand phases, what changes now, and what to do next.',
    to: '/timeline',
    cta: 'Open Timeline',
  },
  {
    title: 'Civic Quiz',
    body: 'Measure your election comprehension and improve quickly.',
    to: '/quiz',
    cta: 'Take Quiz',
  },
]

export default function LearnHubPage() {
  return (
    <div className="home-page">
      <section className="card panel-pad">
        <p className="section-label">Learn Hub</p>
        <h1 className="section-title">Learn the election journey end-to-end.</h1>
        <p className="section-subtitle">Move through simulation, context, and assessment in one structured track.</p>
      </section>

      <section className="quick-list">
        {LEARN_MODULES.map(item => (
          <article key={item.title} className="quick-item">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <Link className="btn-secondary" to={item.to}>{item.cta}</Link>
          </article>
        ))}
      </section>

      <section className="card panel-pad">
        <h2 className="learn-title">Recommended flow</h2>
        <div className="home-trust-list">
          <span className="pill pill-inactive">1. Simulate voting</span>
          <span className="pill pill-inactive">2. Review phase timeline</span>
          <span className="pill pill-inactive">3. Validate understanding by quiz</span>
        </div>
      </section>
    </div>
  )
}
