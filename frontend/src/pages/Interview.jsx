import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Send, Bot, User, Trophy, LayoutDashboard, StopCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Navbar from '../components/Navbar'
import ScoreCard from '../components/ScoreCard'
import api from '../api'

function DifficultyBadge({ difficulty }) {
  const styles = {
    Easy:   'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Hard:   'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[difficulty] || styles.Medium}`}>
      {difficulty}
    </span>
  )
}

export default function Interview() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const [messages, setMessages] = useState([])
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [summary, setSummary] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(state.questionNumber || 1)
  const [currentDifficulty, setCurrentDifficulty] = useState(state.difficulty || 'Medium')
  const [endingSession, setEndingSession] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (state.question) {
      setCurrentQuestion({ id: state.questionId, text: state.question })
      setMessages([{ role: 'ai', text: state.question, questionNumber: 1, difficulty: state.difficulty }])
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleEndInterview = async () => {
    if (!window.confirm('End the interview and see your results?')) return
    setEndingSession(true)
    try {
      const { data } = await api.post('/end-interview', { session_id: parseInt(sessionId) })
      setSessionComplete(true)
      setSummary(data.summary)
      setCurrentQuestion(null)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `🎉 Interview complete! You answered ${data.summary.total_questions} questions with an average score of ${data.summary.average_score}/10. Grade: ${data.summary.grade}`,
        isCompletion: true
      }])
    } catch (err) {
      alert('Failed to end interview.')
    } finally {
      setEndingSession(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim() || loading || !currentQuestion) return
    const userAnswerText = answer.trim()
    setAnswer('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', text: userAnswerText }])
    setMessages(prev => [...prev, { role: 'ai', text: null, thinking: true }])

    try {
      const { data } = await api.post('/submit-answer', {
        session_id: parseInt(sessionId),
        question_id: currentQuestion.id,
        answer: userAnswerText
      })

      const prevDifficulty = currentDifficulty
      const newDifficulty = data.current_difficulty
      setCurrentDifficulty(newDifficulty)

      // Replace thinking bubble with evaluation
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'ai',
          evaluation: data.evaluation,
          difficultyChange: newDifficulty !== prevDifficulty ? { from: prevDifficulty, to: newDifficulty } : null
        }
        return updated
      })

      const nq = data.next_question
      setCurrentQuestion({ id: nq.id, text: nq.text })
      setQuestionNumber(nq.question_number)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: nq.text,
        questionNumber: nq.question_number,
        difficulty: newDifficulty
      }])

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'ai', text: 'Error evaluating answer. Please try again.' }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{state.company} · {state.interview_type}</span>
            <DifficultyBadge difficulty={currentDifficulty} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Q{questionNumber}</span>
            {!sessionComplete && (
              <button
                onClick={handleEndInterview}
                disabled={endingSession}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-all"
              >
                <StopCircle size={14} />
                {endingSession ? 'Ending…' : 'End Interview'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'ai' ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    {msg.thinking ? (
                      <div className="card py-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0,1,2].map(n => (
                            <span key={n} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: `${n * 0.15}s` }} />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm">Evaluating your answer…</span>
                      </div>
                    ) : msg.evaluation ? (
                      <div>
                        {/* Difficulty change notification */}
                        {msg.difficultyChange && (
                          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-2 ${
                            msg.difficultyChange.to === 'Hard' || 
                            (msg.difficultyChange.to === 'Medium' && msg.difficultyChange.from === 'Easy')
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {msg.difficultyChange.from === 'Easy' && msg.difficultyChange.to === 'Medium' ||
                             msg.difficultyChange.from === 'Medium' && msg.difficultyChange.to === 'Hard'
                              ? <TrendingUp size={14} />
                              : <TrendingDown size={14} />
                            }
                            Difficulty adjusted: <strong>{msg.difficultyChange.from}</strong> → <strong>{msg.difficultyChange.to}</strong>
                          </div>
                        )}
                        <ScoreCard evaluation={msg.evaluation} />
                      </div>
                    ) : (
                      <div className={`card ${msg.isCompletion ? 'border-green-600/30 bg-green-900/10' : ''}`}>
                        {msg.questionNumber && !msg.isCompletion && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-blue-400 font-medium">Question {msg.questionNumber}</span>
                            {msg.difficulty && <DifficultyBadge difficulty={msg.difficulty} />}
                          </div>
                        )}
                        <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  <div className="max-w-xl card bg-blue-600/10 border-blue-600/20">
                    <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={16} className="text-gray-300" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {sessionComplete ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy size={20} />
                <span className="font-semibold">
                  {summary ? `Score: ${summary.average_score}/10 · ${summary.grade}` : 'Session Complete!'}
                </span>
              </div>
              <button onClick={() => navigate('/setup')} className="btn-primary">New Interview</button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={loading || !currentQuestion}
                className="input-field flex-1 resize-none"
                placeholder="Type your answer… (Enter to submit, Shift+Enter for new line)"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !answer.trim() || !currentQuestion}
                className="btn-primary self-end px-4"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}