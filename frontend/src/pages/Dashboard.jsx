import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  LayoutDashboard, Plus, ChevronRight, Clock, Building2,
  Code2, Users, Star, BookOpen, TrendingUp
} from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api'

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span className="text-gray-500 text-sm">—</span>
  const color =
    score >= 8 ? 'text-green-400' :
    score >= 6 ? 'text-yellow-400' :
    'text-red-400'
  return <span className={`font-semibold ${color}`}>{score.toFixed(1)}</span>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('coachlm_user') || '{}')

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionDetail, setSessionDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.get('/sessions')
      .then(({ data }) => setSessions(data.sessions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openDetail = async (session) => {
    if (selectedSession?.id === session.id) {
      setSelectedSession(null)
      setSessionDetail(null)
      return
    }
    setSelectedSession(session)
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/session-history/${session.id}`)
      setSessionDetail(data)
    } catch {}
    finally { setDetailLoading(false) }
  }

  // Build chart data from completed sessions (sorted chronologically)
  const chartData = sessions
    .filter(s => s.is_completed && s.average_score !== null)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((s, i) => ({
      name: `Session ${i + 1}`,
      score: s.average_score,
      company: s.company
    }))

  const completedSessions = sessions.filter(s => s.is_completed)
  const overallAvg = completedSessions.length
    ? (completedSessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / completedSessions.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user.name || 'User'}</p>
          </div>
          <Link to="/setup" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Interview
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions',    val: sessions.length,           icon: BookOpen,   color: 'text-blue-400' },
            { label: 'Completed',         val: completedSessions.length,  icon: Star,       color: 'text-green-400' },
            { label: 'Avg Score',         val: overallAvg ? `${overallAvg}/10` : '—', icon: TrendingUp, color: 'text-yellow-400' },
            { label: 'In Progress',       val: sessions.filter(s => !s.is_completed).length, icon: Clock, color: 'text-purple-400' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon size={20} className={`${color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-white">{val}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Sessions list */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <LayoutDashboard size={16} className="text-blue-400" /> Interview Sessions
            </h2>

            {loading && (
              <div className="card text-center text-gray-500 py-10">Loading sessions…</div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="card text-center py-12">
                <p className="text-gray-500 mb-4">No sessions yet. Start your first interview!</p>
                <Link to="/setup" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} /> Start Interview
                </Link>
              </div>
            )}

            {sessions.map(session => (
              <div key={session.id}>
                <button
                  onClick={() => openDetail(session)}
                  className={`w-full card text-left transition-all hover:border-gray-700 ${
                    selectedSession?.id === session.id ? 'border-blue-600/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-800 rounded-lg p-2">
                        {session.interview_type === 'Technical'
                          ? <Code2 size={16} className="text-blue-400" />
                          : <Users size={16} className="text-purple-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{session.company}</span>
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                            {session.interview_type}
                          </span>
                          <span className="text-xs text-gray-500">{session.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={12} className="text-gray-600" />
                          <span className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            session.is_completed
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-yellow-900/40 text-yellow-400'
                          }`}>
                            {session.is_completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={session.average_score} />
                      <ChevronRight size={16} className={`text-gray-600 transition-transform ${
                        selectedSession?.id === session.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {selectedSession?.id === session.id && (
                  <div className="card border-t-0 rounded-t-none border-blue-600/20 bg-gray-900/60 space-y-4">
                    {detailLoading ? (
                      <p className="text-gray-500 text-sm text-center py-4">Loading session details…</p>
                    ) : sessionDetail ? (
                      sessionDetail.questions.map((q, qi) => (
                        <div key={q.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-sm font-medium text-blue-300">Q{qi + 1}. {q.question_text}</p>
                            {q.score !== null && (
                              <span className="flex-shrink-0 text-sm font-semibold text-white bg-gray-800 px-2 py-0.5 rounded">
                                {q.score.toFixed(1)}/10
                              </span>
                            )}
                          </div>
                          {q.answer_text && (
                            <p className="text-sm text-gray-400 mb-2 pl-3 border-l-2 border-gray-700">
                              {q.answer_text}
                            </p>
                          )}
                          {q.feedback && (
                            <p className="text-xs text-gray-500 italic">{q.feedback}</p>
                          )}
                        </div>
                      ))
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Performance chart */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" /> Performance Trend
            </h2>

            <div className="card">
              {chartData.length < 2 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Complete 2+ sessions to see your progress graph.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line
                      type="monotone" dataKey="score"
                      stroke="#3b82f6" strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent feedback summary */}
            {completedSessions.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {completedSessions.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 truncate">{s.company} · {s.interview_type}</span>
                      <ScoreBadge score={s.average_score} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
