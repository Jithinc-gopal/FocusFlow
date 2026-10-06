import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  BarChart3,
  Check,
  Layers,
} from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070B1A] text-slate-100 flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-[#090E23] via-[#070B1A] to-[#070B1A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Motivational Quote Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#A78BFA] text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
              <span>"One task at a time."</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              Organize your day. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#7C5CFF]">
                Focus on what matters.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Plan your tasks, track your progress, and build better days one task at a time.
              Designed for clarity, intentional velocity, and peace of mind.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer min-h-[44px]"
              >
                <span>Start My Day</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 bg-[#11182D] hover:bg-[#151C35] border border-slate-700/80 shadow-xs transition-all cursor-pointer min-h-[44px]"
              >
                <span>Login</span>
              </Link>
            </div>
          </div>

          {/* Productivity Visual / UI Mockup Showcase */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-[#0D1326] shadow-2xl p-3.5 xs:p-4 sm:p-6 overflow-hidden">
              {/* App Mock Header */}
              <div className="flex flex-col xs:flex-row xs:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] flex items-center justify-center text-white shadow-[0_0_12px_rgba(108,77,246,0.35)] shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">FocusFlow Dashboard</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block">Monday, September 21, 2026</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start xs:self-auto">
                  <span className="text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                    7 Completed Today
                  </span>
                </div>
              </div>

              {/* Mock Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="p-2.5 sm:p-3 bg-[#070B1A] rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Today's Tasks</span>
                  <p className="text-base sm:text-lg font-bold text-white mt-0.5">12</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-[#070B1A] rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed</span>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">7</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-[#070B1A] rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</span>
                  <p className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">5</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-[#070B1A] rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Completion Rate</span>
                  <p className="text-base sm:text-lg font-bold text-[#7C5CFF] mt-0.5">58%</p>
                </div>
              </div>

              {/* Mock Task Items */}
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between p-2.5 sm:p-3 gap-2 bg-[#070B1A]/80 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-[#7C5CFF] flex items-center justify-center text-white shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-500 line-through truncate block">
                        Morning standup and sprint backlog grooming
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">
                          High
                        </span>
                        <span className="text-[10px] text-slate-400">Work</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium shrink-0 self-start xs:self-auto">Completed 10:30 AM</span>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center justify-between p-2.5 sm:p-3 gap-2 bg-[#070B1A]/80 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-md border border-slate-700 bg-[#070B1A] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-100 truncate block">
                        Review Q3 Engineering Roadmap and Milestone Deliverables
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/30">
                          High
                        </span>
                        <span className="text-[10px] text-slate-400">Work</span>
                        <span className="text-[10px] text-amber-400 font-medium">Due Today</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#7C5CFF] font-medium shrink-0 self-start xs:self-auto">In Progress</span>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center justify-between p-2.5 sm:p-3 gap-2 bg-[#070B1A]/80 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-md border border-slate-700 bg-[#070B1A] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-100 truncate block">
                        Finalize design tokens for design system v2
                      </span>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                          Medium
                        </span>
                        <span className="text-[10px] text-slate-400">Projects</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium shrink-0 self-start xs:self-auto">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-[#070B1A] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for intentional daily execution
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Everything you need to plan, track, and complete your tasks without cognitive overload.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-[#0D1326] hover:bg-[#11182D] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 text-[#7C5CFF] flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Smart Day Planning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter out distractions and focus strictly on today's agenda with automatic overdue alerts and priority tags.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-[#0D1326] hover:bg-[#11182D] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Historical Progress</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual week and month charts capture your task velocity based on exact completion dates.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-[#0D1326] hover:bg-[#11182D] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 text-[#7C5CFF] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Categorized Lists</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Segment your goals across Work, Personal, Learning, and Projects with customized progress percentages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="mt-auto py-8 bg-[#070B1A] border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7C5CFF]" />
            <span className="font-semibold text-slate-300">FocusFlow</span>
            <span>— Personal Productivity</span>
          </div>
          <p>© 2026 FocusFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
