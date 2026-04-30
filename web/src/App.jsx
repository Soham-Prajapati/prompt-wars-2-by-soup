import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import FactCheckPage from './pages/FactCheckPage'
import EvmPage from './pages/EvmPage'
import TimelinePage from './pages/TimelinePage'
import JawaabDoPage from './pages/JawaabDoPage'
import QuizPage from './pages/QuizPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LearnHubPage from './pages/LearnHubPage'
import AppDashboardPage from './pages/AppDashboardPage'
import ConstituencyDetailPage from './pages/ConstituencyDetailPage'
import CandidateComparePage from './pages/CandidateComparePage'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-shell">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Navbar />
        <main id="main-content" className="app-main" tabIndex={-1} aria-label="Main content">
          <div className="app-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/app" element={<AppDashboardPage />} />
              <Route path="/constituency/:slug" element={<ConstituencyDetailPage />} />
              <Route path="/compare" element={<CandidateComparePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/fact-check" element={<FactCheckPage />} />
              <Route path="/evm-simulator" element={<EvmPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/jawaab-do" element={<JawaabDoPage />} />
              <Route path="/ask" element={<Navigate to="/chat" replace />} />
              <Route path="/verify" element={<Navigate to="/fact-check" replace />} />
              <Route path="/learn" element={<LearnHubPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
