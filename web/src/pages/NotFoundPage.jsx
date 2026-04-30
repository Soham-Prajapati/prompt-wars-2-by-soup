import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="card panel-pad" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
      <p className="section-label" style={{ marginBottom: 8 }}>404</p>
      <h1 className="section-title" style={{ fontSize: 44, marginBottom: 12 }}>Page not found</h1>
      <p className="section-subtitle" style={{ marginBottom: 20 }}>
        The page you requested does not exist. Go back to the ElectIQ home dashboard.
      </p>
      <Link to="/" className="btn-primary">Go to Home</Link>
    </div>
  )
}
