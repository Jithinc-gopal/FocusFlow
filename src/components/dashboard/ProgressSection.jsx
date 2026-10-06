import { useState, useMemo } from 'react'
import {
  BarChart3,
  Calendar,
  CheckCircle,
  TrendingUp,
  Info,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useTasks, getTodayDateStr } from '../../context/TaskContext'

const formatActivityDate = (dateStr) => {
  if (!dateStr) return 'Completed'
  const today = getTodayDateStr()

  const now = new Date()
  const yDate = new Date(now)
  yDate.setDate(now.getDate() - 1)
  const yYear = yDate.getFullYear()
  const yMonth = String(yDate.getMonth() + 1).padStart(2, '0')
  const yDay = String(yDate.getDate()).padStart(2, '0')
  const yesterday = `${yYear}-${yMonth}-${yDay}`

  if (dateStr === today) {
    return 'Completed today'
  }
  if (dateStr === yesterday) {
    return 'Completed yesterday'
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const d = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
  return `Completed on ${formatted}`
}

export default function ProgressSection() {
  const { tasks, taskActivities, activitiesLoading, activitiesError } = useTasks()
  const [activeTab, setActiveTab] = useState('week') // 'week' | 'month'

  // Weekly data: 7 days ending today
  const weeklyData = useMemo(() => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      days.push({
        day: dayName,
        date: dateLabel,
        dateStr,
        isToday: i === 0,
      })
    }

    return days.map((d) => {
      const completed = (taskActivities || []).filter((a) => {
        return a.activity_type === 'COMPLETED' && a.activity_date === d.dateStr
      }).length

      const created = tasks.filter((t) => {
        const createDate = (t.createdAt || t.created_at || '')?.split('T')[0]
        return createDate === d.dateStr
      }).length

      return {
        ...d,
        completed,
        created,
      }
    })
  }, [taskActivities, tasks])

  const maxWeeklyCompleted = Math.max(...weeklyData.map((d) => d.completed), 5)
  const totalWeeklyCompleted = weeklyData.reduce((acc, d) => acc + d.completed, 0)
  const avgDailyCompleted = (totalWeeklyCompleted / weeklyData.length).toFixed(1)

  const peakDayObj = useMemo(() => {
    let peak = weeklyData[0]
    for (const d of weeklyData) {
      if (d.completed > peak.completed) peak = d
    }
    return peak
  }, [weeklyData])

  // Monthly data: 4 weekly cohorts for the current month
  const monthlyData = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthName = now.toLocaleDateString('en-US', { month: 'short' })
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const formatYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const cohorts = [
      { startDay: 1, endDay: 7, label: `Week 1 (${monthName} 1-7)` },
      { startDay: 8, endDay: 14, label: `Week 2 (${monthName} 8-14)` },
      { startDay: 15, endDay: 21, label: `Week 3 (${monthName} 15-21)` },
      { startDay: 22, endDay: lastDayOfMonth, label: `Week 4 (${monthName} 22-${lastDayOfMonth})` },
    ]

    return cohorts.map((c) => {
      const start = formatYMD(year, month, c.startDay)
      const end = formatYMD(year, month, c.endDay)
      const isCurrent = todayStr >= start && todayStr <= end
      const isProjected = todayStr < start

      const completed = (taskActivities || []).filter((a) => {
        if (a.activity_type !== 'COMPLETED') return false
        const d = a.activity_date
        return d >= start && d <= end
      }).length

      const created = tasks.filter((t) => {
        const d = (t.createdAt || t.created_at || t.dueDate || t.due_date || '')?.split('T')[0]
        return d >= start && d <= end
      }).length

      const rate =
        created === 0
          ? completed > 0
            ? 100
            : 0
          : Math.min(100, Math.round((completed / created) * 100))

      return {
        week: c.label,
        start,
        end,
        current: isCurrent,
        projected: isProjected,
        completed,
        created,
        rate,
      }
    })
  }, [taskActivities, tasks])

  const monthCompleted = monthlyData.reduce((acc, d) => acc + d.completed, 0)
  const monthCreated = monthlyData.reduce((acc, d) => acc + d.created, 0)
  const monthRate =
    monthCreated === 0
      ? monthCompleted > 0
        ? 100
        : 0
      : Math.round((monthCompleted / monthCreated) * 100)

  // 5 most recent completed activities for quick history reference
  const recentActivities = useMemo(() => {
    return (taskActivities || [])
      .filter((a) => a.activity_type === 'COMPLETED')
      .slice(0, 5)
  }, [taskActivities])

  return (
    <div className="bg-[#0D1326] p-4 sm:p-6 rounded-xl border border-slate-800/80 shadow-sm overflow-hidden">
      {/* Header with Title and Week/Month Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#7C5CFF] flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold text-white">Task Completion Progress</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Historical date-based performance tracking
          </p>
        </div>

        <div className="flex items-center bg-[#070B1A] p-1 rounded-lg w-full sm:w-auto border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('week')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'week'
                ? 'bg-[#151C35] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Week View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'month'
                ? 'bg-[#151C35] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Non-blocking Activities Error Alert */}
      {activitiesError && (
        <div className="mb-4 sm:mb-5 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Unable to sync latest activity history: {activitiesError}</span>
        </div>
      )}

      {/* VIEW: WEEK */}
      {activeTab === 'week' && (
        <div>
          {/* Top Quick Stats - Responsive 3-col grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#070B1A]/80 rounded-lg border border-slate-800 mb-5 sm:mb-6 text-center">
            <div>
              <span className="block text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">
                7-Day Total
              </span>
              <span className="text-base sm:text-lg font-bold text-[#7C5CFF] block truncate">
                {totalWeeklyCompleted}
              </span>
              <span className="text-[10px] text-slate-500 hidden xs:block">completed</span>
            </div>
            <div>
              <span className="block text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">
                Daily Avg
              </span>
              <span className="text-base sm:text-lg font-bold text-white block truncate">
                {avgDailyCompleted}
              </span>
              <span className="text-[10px] text-slate-500 hidden xs:block">per day</span>
            </div>
            <div>
              <span className="block text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate">
                Peak Day
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-400 block truncate">
                {peakDayObj.completed > 0 ? peakDayObj.day : '—'}
              </span>
              <span className="text-[10px] text-slate-500 hidden xs:block">
                {peakDayObj.completed > 0 ? `(${peakDayObj.completed})` : 'None yet'}
              </span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="pt-2 sm:pt-4 pb-2">
            <div className="flex items-end justify-between gap-1 sm:gap-3 md:gap-4 h-44 sm:h-52 px-1 sm:px-2 border-b border-slate-800">
              {weeklyData.map((item, idx) => {
                const heightPercent =
                  item.completed === 0 ? 0 : Math.round((item.completed / maxWeeklyCompleted) * 100)

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group min-w-0"
                  >
                    {/* Tooltip / value on top of bar */}
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {item.completed}
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[34px] sm:max-w-[42px] bg-slate-800/60 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          item.isToday
                            ? 'bg-gradient-to-t from-[#6366F1] to-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.35)]'
                            : 'bg-[#4F46E5]/70 group-hover:bg-[#4F46E5]'
                        }`}
                      />
                    </div>

                    {/* Day and Date label below */}
                    <div className="text-center mt-2 sm:mt-2.5 w-full">
                      <span
                        className={`block text-[11px] sm:text-xs font-medium truncate ${
                          item.isToday ? 'text-[#7C5CFF] font-bold' : 'text-slate-300'
                        }`}
                      >
                        {item.day}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">
                        {item.date}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between text-xs text-slate-400 mt-4 px-1 gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7C5CFF] inline-block shadow-[0_0_6px_rgba(124,92,255,0.4)]" />
                Today's Velocity
              </span>
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4F46E5]/70 inline-block" />
                Previous Days
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              Synced with activity database
            </span>
          </div>
        </div>
      )}

      {/* VIEW: MONTH */}
      {activeTab === 'month' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-lg border border-slate-800 bg-[#070B1A]/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Completed Tasks</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">{monthCompleted}</span>
              <span className="block text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Current month historical total
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg border border-slate-800 bg-[#070B1A]/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Created Tasks</span>
                <Calendar className="w-4 h-4 text-[#7C5CFF]" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">{monthCreated}</span>
              <span className="block text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Tasks created this month
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg border border-slate-800 bg-[#070B1A]/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Completion Rate</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">{monthRate}%</span>
              <span className="block text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Closed vs logged ratio</span>
            </div>
          </div>

          {/* Weekly Cohort Progress */}
          <div className="space-y-3">
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Weekly Completion Breakdown
            </h4>

            {monthlyData.map((weekData, idx) => (
              <div key={idx} className="p-3 bg-[#070B1A]/60 rounded-lg border border-slate-800">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs font-medium mb-2 gap-1">
                  <span className="text-slate-200 truncate">
                    {weekData.week}
                    {weekData.current && (
                      <span className="ml-2 text-[10px] bg-[#7C5CFF]/20 text-[#7C5CFF] font-semibold px-2 py-0.5 rounded-md border border-[#7C5CFF]/30">
                        Current Week
                      </span>
                    )}
                    {weekData.projected && (
                      <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                        Upcoming
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400 text-[11px] sm:text-xs flex-shrink-0">
                    {weekData.completed} / {weekData.created} tasks ({weekData.rate}%)
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      weekData.current ? 'bg-gradient-to-r from-[#6366F1] to-[#7C5CFF]' : 'bg-slate-600'
                    }`}
                    style={{ width: `${weekData.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date-Based History Notice */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-3.5 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400 leading-normal">
        <Info className="w-3.5 h-3.5 text-[#7C5CFF] flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-300">Date-based History:</strong> Progress metrics evaluate tasks using real database
          activity records (<code>TaskActivity</code>) to track your daily execution rhythm.
        </span>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Recent Activity
            </h4>
          </div>
          {taskActivities && taskActivities.length > 0 && (
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
              {taskActivities.length} {taskActivities.length === 1 ? 'activity' : 'activities'} logged
            </span>
          )}
        </div>

        {activitiesLoading && (!taskActivities || taskActivities.length === 0) ? (
          <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
            Loading activity history...
          </div>
        ) : !taskActivities || taskActivities.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#070B1A]/60 border border-slate-800 text-center">
            <p className="text-xs font-medium text-slate-300">No completed tasks yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Complete a task to start building your progress history.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#070B1A]/60 hover:bg-[#070B1A] border border-slate-800/80 transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {act.task_title || 'Completed Task'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 flex-shrink-0 font-medium">
                  {formatActivityDate(act.activity_date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
