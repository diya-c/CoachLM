import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Code2, Users, Gauge, ChevronRight, Brain } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api'

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Flipkart', 'Infosys', 'TCS', 'General']
const TYPES = [
  { value: 'Technical', icon: Code2, desc: 'Data structures, algorithms, system design' },
  { value: 'HR', icon: Users, desc: 'Behavioral, situational, culture fit questions' },
]
const DIFFICULTIES = [
  { value: 'Easy',   color: 'border-green-500/40 bg-green-500/10 text-green-400',  dot: 'bg-green-400' },
  { value: 'Medium', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-400' },
  { value: 'Hard',   color: 'border-red-500/40 bg-red-500/10 text-red-400',        dot: 'bg-red-400' },
]

export default function SetupInterview() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ interview_type: 'Technical', company: 'Google', difficulty: 'Medium' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/start-interview', form)
      // Pass session metadata + first question via router state
      navigate(`/interview/${data.session_id}`, {
        state: {
          sessionId: data.session_id,
          questionId: data.question_id,
          question: data.question,
          questionNumber: data.question_number,
          totalQuestions: data.total_questions,
          ...form
        }
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Set Up Your Interview</h1>
          <p className="text-gray-500">Customize your practice session to match your target role.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Interview Type */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Interview Type</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(({ value, icon: Icon, desc }) => (
              <button key={value}
                onClick={() => set('interview_type', value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  form.interview_type === value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Icon size={20} className={form.interview_type === value ? 'text-blue-400' : 'text-gray-400'} />
                <div className="font-medium text-white mt-2">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Company */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Target Company</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map(c => (
              <button key={c}
                onClick={() => set('company', c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  form.company === c
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Difficulty</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(({ value, color, dot }) => (
              <button key={value}
                onClick={() => set('difficulty', value)}
                className={`p-3 rounded-lg border-2 text-center transition-all font-medium ${
                  form.difficulty === value ? color : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${form.difficulty === value ? dot : 'bg-gray-600'}`} />
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Start */}
        <div className="card bg-gradient-to-br from-blue-900/20 to-gray-900 border-blue-800/30 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Ready to start</p>
            <p className="font-semibold text-white mt-0.5">
              {form.company} · {form.interview_type} · {form.difficulty}
            </p>
          </div>
          <button onClick={handleStart} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Starting…' : 'Start Interview'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
