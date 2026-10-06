import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function PublicNavbar() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <header className="sticky top-0 z-30 w-full bg-[#070B1A]/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] flex items-center justify-center text-white shadow-[0_0_15px_rgba(108,77,246,0.35)] group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Focus<span className="text-[#7C5CFF]">Flow</span>
          </span>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          {location.pathname !== '/login' && (
            <Link
              to="/login"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-[#11182D] transition-colors min-h-[38px] flex items-center"
            >
              Log in
            </Link>
          )}

          {!isAuthPage && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] px-3.5 sm:px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all min-h-[38px]"
            >
              <span>Start My Day</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {location.pathname === '/login' && (
            <Link
              to="/register"
              className="text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] px-3.5 py-2 rounded-lg shadow-[0_0_15px_rgba(108,77,246,0.25)] transition-all min-h-[38px] flex items-center"
            >
              Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
