import { Link } from 'react-router-dom'
import { Brain, Zap, BarChart2, Shield, ChevronRight, Bot, Database } from 'lucide-react'
import Navbar from '../components/Navbar'

const features = [
  { icon: Bot,       title: 'Dual AI Agents',       desc: 'Interviewer Agent asks adaptive questions. Evaluator Agent scores your answers in real time.' },
  { icon: Database,  title: 'RAG-Powered Questions', desc: 'Company-specific questions retrieved via vector search for Google, Amazon, Microsoft and more.' },
  { icon: Brain,     title: 'Persistent Memory',     desc: 'The system remembers your past sessions and adjusts difficulty to help you grow continuously.' },
  { icon: BarChart2, title: 'Performance Dashboard', desc: 'Track scores, feedback, and improvement trends across all your interview sessions.' },
  { icon: Zap,       title: 'Instant Feedback',      desc: 'Detailed evaluation on correctness, relevance, and clarity after every answer.' },
  { icon: Shield,    title: 'Secure & Private',      desc: 'JWT-based auth means only you can access your interview history and data.' },
]

export default function Landing() {
  const isLoggedIn = !!localStorage.getItem('coachlm_token')

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap size={14} /> AI-Powered Interview Preparation
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Ace Your Next Interview<br />
            <span className="text-blue-500">With CoachLM</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice with an AI coach that adapts to your skill level, remembers your progress,
            and gives real feedback — just like a real interview.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {isLoggedIn ? (
              <Link to="/setup" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
                Start Interview <ChevronRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
                  Get Started Free <ChevronRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary flex items-center gap-2 text-base px-7 py-3">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
          {[
            { val: 'RAG',    label: 'Retrieval-Augmented Generation' },
            { val: '2',      label: 'Specialized AI Agents' },
            { val: '∞',      label: 'Adaptive Learning Memory' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-blue-400">{val}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-3">Everything You Need to Prepare</h2>
        <p className="text-gray-500 text-center mb-12">Powered by cutting-edge Generative AI technology</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-gray-700 transition-colors">
              <div className="bg-blue-600/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="text-blue-400" size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="card bg-gradient-to-br from-blue-900/30 to-gray-900 border-blue-800/40">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Start Practicing?</h2>
          <p className="text-gray-400 mb-6">Join thousands of students preparing smarter with CoachLM.</p>
          <Link to={isLoggedIn ? '/setup' : '/register'} className="btn-primary inline-flex items-center gap-2">
            {isLoggedIn ? 'Start New Interview' : 'Create Free Account'} <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        CoachLM — Generative AI Mini Project · UE23CS342BA4
      </footer>
    </div>
  )
}
