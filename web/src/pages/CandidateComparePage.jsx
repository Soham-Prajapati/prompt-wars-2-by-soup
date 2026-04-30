import { Link, useSearchParams } from 'react-router-dom'
import { CONSTITUENCIES } from '../data/constituencies'

export default function CandidateComparePage() {
  const [params] = useSearchParams()
  const slug = params.get('constituency')
  const constituency = CONSTITUENCIES.find(c => c.slug === slug) || CONSTITUENCIES[0]
  const [left, right] = constituency.candidates

  return (
    <div className="home-page">
      <section className="card panel-pad">
        <p className="section-label">Candidate Compare</p>
        <h1 className="section-title">{constituency.name} candidate comparison</h1>
        <p className="section-subtitle">Compare core candidate profile, issue priority, and positioning in one view.</p>
      </section>

      <section className="quick-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {[left, right].map(candidate => (
          <article key={candidate.name} className="quick-item">
            <h3>{candidate.name}</h3>
            <p className="compare-party">{candidate.party}</p>
            <p>{candidate.profile}</p>
            <div className="home-trust-list">
              <span className="pill pill-active">Priority: {candidate.priority}</span>
              <span className="pill pill-inactive">Constituency: {constituency.name}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="card panel-pad">
        <h2 className="learn-title">Continue journey</h2>
        <div className="home-hero-actions">
          <Link className="btn-secondary" to={`/constituency/${constituency.slug}`}>Back to Constituency</Link>
          <Link className="btn-secondary" to="/fact-check">Fact-check Candidate Claims</Link>
          <Link className="btn-secondary" to="/quiz">Test Election Knowledge</Link>
        </div>
      </section>
    </div>
  )
}
