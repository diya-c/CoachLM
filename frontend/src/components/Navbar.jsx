import { Link, useNavigate } from 'react-router-dom'
import { Brain, LogOut, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('coachlm_user') || 'null')

  const logout = () => {
    localStorage.removeItem('coachlm_token')
    localStorage.removeItem('coachlm_user')
    navigate('/')
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Brain className="text-blue-500" size={26} />
          <span>Coach<span className="text-blue-500">LM</span></span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-400 text-sm hidden sm:block">Hi, {user.name}</span>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button onClick={logout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-sm transition">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white text-sm transition">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
