import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUnverified, setIsUnverified] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsUnverified(false)
    setResendMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.token, data.user)
        navigate(from, { replace: true })
      } else {
        if (data.unverified) {
          setIsUnverified(true)
          setError(data.detail || 'Email has not been verified. Please verify your email first.')
        } else if (data.detail) {
          setError(data.detail)
        } else if (data.email) {
          setError(Array.isArray(data.email) ? data.email[0] : data.email)
        } else if (data.password) {
          setError(Array.isArray(data.password) ? data.password[0] : data.password)
        } else {
          setError('Sign in failed. Please check your credentials.')
        }
      }
    } catch {
      setError('Unable to connect to the server. Please check your network and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) return
    setResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      if (response.ok) {
        setResendMessage('Verification email sent! Check your inbox or terminal.')
      } else {
        setResendMessage(data.detail || 'Failed to resend verification email.')
      }
    } catch {
      setResendMessage('Network error. Could not resend email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B1A] text-slate-100 flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-3.5 xs:p-4 sm:p-6 py-6 sm:py-8">
        <div className="w-full max-w-md bg-[#0D1326] rounded-2xl border border-slate-800 shadow-2xl p-4.5 xs:p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(108,77,246,0.35)] shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-bold text-white">Welcome back to FocusFlow</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your email and password to sign in
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>

              {isUnverified && (
                <div className="pt-2 border-t border-rose-500/30">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 underline cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Sending...' : 'Resend verification email'}</span>
                  </button>
                  {resendMessage && (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    alert('Password reset link will be available with the future backend.')
                  }}
                  className="text-xs text-[#7C5CFF] hover:text-[#94A3B8] font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.3)] transition-all cursor-pointer disabled:opacity-70"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in to FocusFlow'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer link to Register */}
          <div className="text-center mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#7C5CFF] hover:text-[#94A3B8] font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
