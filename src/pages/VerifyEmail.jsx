import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Mail, RefreshCw } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const [status, setStatus] = useState(() =>
    !uid || !token ? 'missing' : 'verifying'
  )
  const [message, setMessage] = useState(() =>
    !uid || !token
      ? 'No verification parameters were found in the URL. Please ensure you clicked the full link sent to your email.'
      : ''
  )
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)

  useEffect(() => {
    if (!uid || !token) {
      return
    }

    const verify = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.detail || 'Email verified successfully! You can now log in.')
        } else {
          setStatus('error')
          setMessage(data.detail || 'Verification link is invalid or has expired.')
        }
      } catch {
        setStatus('error')
        setMessage('Network error while verifying email. Please check your connection and try again.')
      }
    }

    verify()
  }, [uid, token])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail) return
    setResendLoading(true)
    setResendStatus(null)

    try {
      const response = await fetch('/api/auth/resend-verification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
      const data = await response.json()
      if (response.ok) {
        setResendStatus({ type: 'success', message: data.detail || 'Verification email resent! Please check your terminal or inbox.' })
      } else {
        setResendStatus({ type: 'error', message: data.detail || 'Failed to resend verification email.' })
      }
    } catch {
      setResendStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B1A] text-slate-100 flex flex-col">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-3.5 xs:p-4 sm:p-6 py-6 sm:py-8">
        <div className="w-full max-w-md bg-[#0D1326] rounded-2xl border border-slate-800 shadow-2xl p-4.5 xs:p-6 sm:p-8">
          {status === 'verifying' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF] flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 animate-spin stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-bold text-white">Verifying your email</h2>
              <p className="text-xs text-slate-400 mt-2">
                Please wait a moment while we confirm your account...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-bold text-white">Email Verified!</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {message}
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.3)] transition-all"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'missing') && (
            <div className="py-2">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                <p className="text-xs text-rose-300 mt-2 leading-relaxed bg-rose-500/15 p-2.5 rounded-lg border border-rose-500/30">
                  {message}
                </p>
              </div>

              {/* Resend Verification Box */}
              <div className="border-t border-slate-800 pt-5">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Need a new verification link?
                </h3>
                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all"
                      />
                    </div>
                  </div>

                  {resendStatus && (
                    <div className={`p-2.5 text-xs rounded-lg border ${
                      resendStatus.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      {resendStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-[#151C35] hover:bg-[#1a2342] active:bg-[#11182D] rounded-xl transition-colors cursor-pointer disabled:opacity-60 border border-slate-700/80"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>{resendLoading ? 'Sending...' : 'Resend Verification Email'}</span>
                  </button>
                </form>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                Already verified?{' '}
                <Link to="/login" className="text-[#7C5CFF] hover:text-[#94A3B8] font-semibold">
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
