import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User, ArrowRight, Check } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
      } else {
        // Collect validation errors
        let errorMsg = 'Registration failed. Please check your inputs.'
        if (data.email) {
          errorMsg = Array.isArray(data.email) ? data.email[0] : data.email
        } else if (data.username) {
          errorMsg = Array.isArray(data.username) ? data.username[0] : data.username
        } else if (data.password) {
          errorMsg = Array.isArray(data.password) ? data.password[0] : data.password
        } else if (data.detail) {
          errorMsg = data.detail
        }
        setError(errorMsg)
      }
    } catch {
      setError('Unable to connect to the server. Please check your network and try again.')
    } finally {
      setIsLoading(false)
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
            <h2 className="text-xl font-bold text-white">Create your account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Start organizing your tasks and tracking your velocity
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <Check className="w-6 h-6 stroke-[2.4]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your email</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-[#070B1A] p-3.5 rounded-xl border border-slate-800">
                Registration successful. Please check your email to verify your account.
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] transition-all"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-2.5 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-lg">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="janedoe"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                    />
                  </div>
                </div>

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
                      placeholder="jane@focusflow.app"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.3)] transition-all cursor-pointer disabled:opacity-70"
                >
                  <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Footer link to Login */}
              <div className="text-center mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#7C5CFF] hover:text-[#94A3B8] font-semibold">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
