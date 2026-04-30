import { Link, useParams } from 'react-router-dom'
import { findConstituencyBySlug } from '../data/constituencies'

export default function ConstituencyDetailPage() {
  const { slug } = useParams()
  const constituency = findConstituencyBySlug(slug || '')

  if (!constituency) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ color: 'var(--navy)', marginBottom: 8 }}>Constituency not found</h1>
        <p style={{ color: 'var(--ink-mid)', marginBottom: 12 }}>
          Try selecting a constituency from the home page finder.
        </p>
        <Link className="btn-secondary" to="/">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="home-page">
      <section className="card panel-pad">
        <p className="section-label">Constituency Intelligence</p>
        <h1 className="section-title">{constituency.name}, {constituency.state}</h1>
        <p className="section-subtitle">{constituency.trend} · Turnout {constituency.turnout}</p>
        <div className="home-trust-list">
          {constituency.keyIssues.map(issue => (
            <span key={issue} className="pill pill-inactive">{issue}</span>
          ))}
        </div>
      </section>

      <section className="quick-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {constituency.candidates.map(candidate => (
          <article key={candidate.name} className="quick-item">
            <h3>{candidate.name}</h3>
            <p>{candidate.party}</p>
            <p>{candidate.profile}</p>
            <span className="pill pill-active">Priority: {candidate.priority}</span>
          </article>
        ))}
      </section>

      <section className="card panel-pad">
        <h2 className="learn-title">Next actions</h2>
        <div className="home-hero-actions">
          <Link className="btn-secondary" to={`/compare?constituency=${constituency.slug}`}>Compare Candidates</Link>
          <Link className="btn-secondary" to="/fact-check">Verify Claims</Link>
          <Link className="btn-secondary" to="/chat">Ask Follow-up Questions</Link>
        </div>
      </section>
    </div>
  )
}
