import { useEffect, useState } from 'react'
import { getQuiz, trackEvent } from '../api'

const TOPICS = [
  { id: 'evm', label: 'EVM and Voting' },
  { id: 'voter_rights', label: 'Voter Rights' },
  { id: 'constitution', label: 'Constitution' },
  { id: 'election_process', label: 'Election Process' },
  { id: 'political_parties', label: 'Political Parties' },
  { id: 'mcc', label: 'Model Code of Conduct' },
]

const STATIC_QUIZ = {
  topic: 'evm',
  questions: [
    { question: 'What does EVM stand for?', options: ['Electronic Voting Machine', 'Electronic Voter Model', 'Electorate Vote Method', 'Electoral Verification Mechanism'], correct: 0, explanation: 'EVM stands for Electronic Voting Machine. India has used EVMs in all elections since 2004.' },
    { question: 'How many Lok Sabha seats are there?', options: ['525', '543', '552', '500'], correct: 1, explanation: 'There are 543 Lok Sabha constituencies. A party or coalition needs 272 seats for a majority government.' },
    { question: 'What is the minimum voting age in India?', options: ['21', '25', '18', '20'], correct: 2, explanation: 'The voting age was lowered from 21 to 18 by the 61st Constitutional Amendment in 1988.' },
    { question: 'What does NOTA mean?', options: ['Not One To Accept', 'None Of The Above', 'No Other Than Approved', 'National Option To Abstain'], correct: 1, explanation: 'NOTA — None Of The Above — was introduced by Supreme Court order in 2013 to allow voters to reject all candidates.' },
    { question: 'VVPAT slip is visible for how long?', options: ['3 seconds', '5 seconds', '7 seconds', '10 seconds'], correct: 2, explanation: 'The VVPAT slip showing your candidate\'s name and symbol is visible for exactly 7 seconds before dropping into a sealed compartment.' },
  ],
}

export default function QuizPage() {
  const [topic, setTopic] = useState('evm')
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    trackEvent('page_view', { page: 'quiz' })
  }, [])

  const loadQuiz = async (t = topic) => {
    trackEvent('quiz_started', { topic: t })
    setTopic(t); setQuiz(null); setAnswers({}); setSubmitted(false); setLoading(true)
    try {
      const data = await getQuiz(t, 'English')
      setQuiz(data?.questions?.length ? data : STATIC_QUIZ)
    } catch {
      setQuiz(STATIC_QUIZ)
    } finally { setLoading(false) }
  }

  const score = submitted ? Object.entries(answers).filter(([i, a]) => quiz.questions[i].correct === a).length : 0

  return (
    <div className="home-page">
      <section className="card panel-pad">
        <p className="section-label">Quiz</p>
        <h1 className="section-title">Test your election literacy.</h1>
        <p className="section-subtitle">Answer five questions and review explanations immediately.</p>
      </section>

      <section className="card panel-pad">
        <div className="section-label" style={{ marginBottom: 8 }}>Choose topic</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => setTopic(t.id)} className={`pill ${topic === t.id ? 'pill-active' : 'pill-inactive'}`} style={{ fontSize: 'var(--size-sm)', padding: '7px 14px' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => loadQuiz(topic)} disabled={loading}>
          {loading ? 'Generating quiz...' : 'Start quiz'}
        </button>
      </section>

      {/* Loading */}
      {loading && (
        <div className="card panel-pad" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
          <p style={{ color: 'var(--ink-mid)' }}>Preparing questions on "{TOPICS.find(t => t.id === topic)?.label}"...</p>
        </div>
      )}

      {/* Score banner */}
      {submitted && (
        <div className={`card fade-in ${score >= 4 ? 'card-green' : score >= 3 ? 'card-saffron' : ''}`} style={{ padding: '18px 22px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--size-lg)', color: 'var(--navy)' }}>
              {score}/{quiz.questions.length} correct
            </div>
            <div style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)' }}>
              {score === 5 ? 'Perfect. You are election-ready.' : score >= 3 ? 'Good performance. Keep going.' : 'Good effort. Review the explanations below.'}
            </div>
          </div>
          <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => loadQuiz(topic)}>
            New Quiz
          </button>
        </div>
      )}

      {/* Questions */}
      {quiz && !loading && (
        <div>
          {quiz.questions.map((q, qi) => {
            const answered = qi in answers
            const correct = answers[qi] === q.correct
            return (
              <div key={qi} className="card" style={{ padding: '20px 22px', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: submitted ? (correct ? 'var(--green)' : 'var(--false)') : 'var(--saffron)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                  }}>{qi + 1}</div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--size-base)', color: 'var(--navy)', lineHeight: 1.5 }}>{q.question}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 40 }}>
                  {q.options.map((opt, oi) => {
                    let bg = 'var(--surface-3)', border = 'var(--border)', col = 'var(--ink)'
                    if (submitted) {
                      if (oi === q.correct) { bg = 'var(--verified-bg)'; border = 'var(--green)'; col = 'var(--green)' }
                      else if (oi === answers[qi] && !correct) { bg = 'var(--false-bg)'; border = 'var(--false)'; col = 'var(--false)' }
                    } else if (answers[qi] === oi) {
                      bg = 'var(--saffron-bg)'; border = 'var(--saffron)'; col = 'var(--saffron)'
                    }
                    return (
                      <button key={oi} onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))} style={{
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${border}`, background: bg, color: col,
                        cursor: submitted ? 'default' : 'pointer', textAlign: 'left',
                        fontSize: 'var(--size-sm)', fontWeight: 500, transition: 'var(--transition)',
                        fontFamily: 'var(--font-body)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: 'white', color }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                        {submitted && oi === q.correct && ' ✓'}
                        {submitted && oi === answers[qi] && oi !== q.correct && ' ✗'}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {submitted && (
                  <div className="fade-in" style={{ marginTop: 12, paddingLeft: 40, padding: '10px 14px 10px 40px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--saffron)', marginLeft: 40 }}>
                    <span className="section-label">Explanation: </span>
                    <span style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{q.explanation}</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Submit */}
          {!submitted && (
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 'var(--size-md)' }}
              onClick={() => {
                const correctCount = Object.entries(answers).filter(([i, a]) => quiz.questions[i].correct === a).length
                const scorePct = Math.round((correctCount / quiz.questions.length) * 100)
                trackEvent('quiz_completed', { topic, score_pct: scorePct, correct_count: correctCount })
                setSubmitted(true)
              }}
              disabled={Object.keys(answers).length < quiz.questions.length}
            >
              Submit Answers ({Object.keys(answers).length}/{quiz.questions.length} answered)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
