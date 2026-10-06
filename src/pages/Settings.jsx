import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Sliders,
  LogOut,
  Check,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const navigate = useNavigate()
  const { openConfirm } = useTasks()
  const { user, logout } = useAuth()

  // In-memory UI settings state initialized with authenticated user data
  const [name, setName] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [prevUser, setPrevUser] = useState(user)

  if (user !== prevUser) {
    setPrevUser(user)
    setName(user?.username || '')
    setEmail(user?.email || '')
  }

  const [theme, setTheme] = useState('dark') // 'light' | 'dark' | 'system'
  const [startOfWeek, setStartOfWeek] = useState('monday')
  const [defaultPriority, setDefaultPriority] = useState('Medium')
  const [dailyDigest, setDailyDigest] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  const avatarInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'FF'

  const handleSave = (e) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleLogout = () => {
    openConfirm({
      title: 'Log out of FocusFlow',
      message: 'Are you sure you want to end your current productivity session?',
      confirmText: 'Log Out',
      confirmVariant: 'danger',
      onConfirm: () => {
        logout()
        navigate('/')
      },
    })
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 text-[#7C5CFF] flex items-center justify-center shrink-0">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal profile, appearance, and application preferences
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your settings preferences have been updated for this session.</span>
        </div>
      )}

      {/* Account Section */}
      <section className="bg-[#0D1326] rounded-xl border border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <User className="w-4 h-4 text-[#7C5CFF]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Account Profile
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#7C5CFF]/20 text-[#7C5CFF] border-2 border-[#7C5CFF]/40 font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
              {avatarInitials}
            </div>
            <div>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-lg transition-colors cursor-pointer min-h-[36px]"
                onClick={() => alert('Photo upload will be configured with cloud media storage.')}
              >
                Change Avatar
              </button>
              <p className="text-[11px] text-slate-500 mt-1">JPG, PNG or GIF up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 rounded-lg outline-none transition-all min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 rounded-lg outline-none transition-all min-h-[40px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-lg shadow-[0_0_15px_rgba(108,77,246,0.25)] transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      {/* Appearance Section */}
      <section className="bg-[#0D1326] rounded-xl border border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <Palette className="w-4 h-4 text-[#7C5CFF]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Appearance
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Interface Theme
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-2.5 xs:p-3 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[#7C5CFF] bg-[#7C5CFF]/15 text-white font-semibold shadow-xs ring-1 ring-[#7C5CFF]/40'
                  : 'border-slate-800 bg-[#070B1A] hover:bg-[#11182D] text-slate-400'
              }`}
            >
              <Sun className="w-4 sm:w-5 h-4 sm:h-5 mx-auto mb-1.5" />
              <span className="text-[11px] xs:text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-2.5 xs:p-3 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-[#7C5CFF] bg-[#7C5CFF]/15 text-white font-semibold shadow-xs ring-1 ring-[#7C5CFF]/40'
                  : 'border-slate-800 bg-[#070B1A] hover:bg-[#11182D] text-slate-400'
              }`}
            >
              <Moon className="w-4 sm:w-5 h-4 sm:h-5 mx-auto mb-1.5 text-[#7C5CFF]" />
              <span className="text-[11px] xs:text-xs">Dark (Active)</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-2.5 xs:p-3 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-[#7C5CFF] bg-[#7C5CFF]/15 text-white font-semibold shadow-xs ring-1 ring-[#7C5CFF]/40'
                  : 'border-slate-800 bg-[#070B1A] hover:bg-[#11182D] text-slate-400'
              }`}
            >
              <Laptop className="w-4 sm:w-5 h-4 sm:h-5 mx-auto mb-1.5" />
              <span className="text-[11px] xs:text-xs">System</span>
            </button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-[#0D1326] rounded-xl border border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-[#7C5CFF]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Task Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start of week */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start of Week
              </label>
              <select
                value={startOfWeek}
                onChange={(e) => setStartOfWeek(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-[#070B1A] border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-[#7C5CFF] cursor-pointer min-h-[40px]"
              >
                <option value="monday">Monday (Recommended)</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* Default Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Task Priority
              </label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-[#070B1A] border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-[#7C5CFF] cursor-pointer min-h-[40px]"
              >
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Productivity digest toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Daily Planning Reminders
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Show morning task suggestions when opening My Day
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dailyDigest}
              aria-label="Toggle daily planning reminders"
              onClick={() => setDailyDigest(!dailyDigest)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer shrink-0 ${
                dailyDigest ? 'bg-[#7C5CFF] justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </div>
      </section>

      {/* Logout / Danger Zone */}
      <section className="bg-rose-500/10 rounded-xl border border-rose-500/25 p-4 sm:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-rose-300">Session & Sign Out</h3>
        <p className="text-xs text-rose-400/90 leading-relaxed">
          Signing out will end your active session and return you to the home landing page.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer w-full sm:w-auto min-h-[40px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </section>
    </div>
  )
}
