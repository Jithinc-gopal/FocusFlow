import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  formatLocalDate,
  formatDisplayDate,
  getMonthYearTitle,
  getCalendarGrid,
  navigateMonth,
} from '../utils/dateUtils'
import {
  fetchHolidays,
  getHolidaysForDate,
} from '../services/holidayService'

const WEEKDAYS = [
  { short: 'Sun', letter: 'S', isWeekend: true },
  { short: 'Mon', letter: 'M', isWeekend: false },
  { short: 'Tue', letter: 'T', isWeekend: false },
  { short: 'Wed', letter: 'W', isWeekend: false },
  { short: 'Thu', letter: 'T', isWeekend: false },
  { short: 'Fri', letter: 'F', isWeekend: false },
  { short: 'Sat', letter: 'S', isWeekend: true },
]

export default function Calendar() {
  // Real local system date initialized dynamically (never hardcoded)
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => formatLocalDate(today), [today])

  const [currentYear, setCurrentYear] = useState(() => today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth())
  const [selectedDateStr, setSelectedDateStr] = useState(() => todayStr)

  // Real API Holiday State
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch real holidays whenever currentYear changes
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const res = await fetchHolidays(currentYear)
        if (!isMounted) return
        setHolidays(res.holidays || [])
        setError(res.error || null)
      } catch {
        if (!isMounted) return
        setHolidays([])
        setError('Holiday information is temporarily unavailable.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [currentYear])

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    const next = navigateMonth(currentYear, currentMonth, -1)
    setCurrentYear(next.year)
    setCurrentMonth(next.month)
  }, [currentYear, currentMonth])

  const handleNextMonth = useCallback(() => {
    const next = navigateMonth(currentYear, currentMonth, 1)
    setCurrentYear(next.year)
    setCurrentMonth(next.month)
  }, [currentYear, currentMonth])

  const handleToday = useCallback(() => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    setSelectedDateStr(formatLocalDate(now))
  }, [])

  const handleDateClick = useCallback((cell) => {
    setSelectedDateStr(cell.dateStr)
    // Synchronize month/year if clicking leading/trailing days
    if (!cell.isCurrentMonth) {
      setCurrentYear(cell.year)
      setCurrentMonth(cell.month)
    }
  }, [])

  // Calendar grid calculations
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const monthYearLabel = useMemo(() => {
    return getMonthYearTitle(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  // Holidays on the selected date
  const selectedDateHolidays = useMemo(() => {
    return getHolidaysForDate(selectedDateStr, holidays)
  }, [selectedDateStr, holidays])

  const formattedSelectedDate = useMemo(() => {
    return formatDisplayDate(selectedDateStr, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [selectedDateStr])

  const isSelectedDateToday = selectedDateStr === todayStr

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5CFF] uppercase tracking-wider mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Personal Calendar</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Calendar & Holidays
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            View calendar dates and real Indian/Kerala public holidays.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToday}
          className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#151C35] hover:bg-[#1a2342] active:bg-[#11182D] border border-slate-700/80 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[38px]"
          title="Jump to today's date"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
          <span>Today</span>
        </button>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-[#0D1326] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
        {/* Navigation & Controls Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#070B1A]/80 flex-wrap gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#151C35] active:bg-[#11182D] rounded-lg transition-colors cursor-pointer border border-slate-700/80"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-white min-w-[130px] text-center tracking-tight">
              {monthYearLabel}
            </h2>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#151C35] active:bg-[#11182D] rounded-lg transition-colors cursor-pointer border border-slate-700/80"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-[#151C35] px-2.5 py-1 rounded-md border border-slate-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C5CFF]" />
                <span>Loading holidays...</span>
              </span>
            )}
          </div>
        </div>

        {/* Offline / Error Banner */}
        {error && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Calendar Body */}
        <div className="p-3 sm:p-6 space-y-4">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 pb-2 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day.short}
                className={`text-xs font-semibold uppercase tracking-wider ${
                  day.isWeekend ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                <span className="hidden sm:inline">{day.short}</span>
                <span className="sm:hidden">{day.letter}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarGrid.map((cell) => {
              const cellHolidays = getHolidaysForDate(cell.dateStr, holidays)
              const hasHoliday = cellHolidays.length > 0
              const isToday = cell.dateStr === todayStr
              const isSelected = cell.dateStr === selectedDateStr

              return (
                <button
                  type="button"
                  key={cell.dateStr}
                  onClick={() => handleDateClick(cell)}
                  aria-label={`${cell.dateStr}${hasHoliday ? ` - Holiday: ${cellHolidays.map((h) => h.name).join(', ')}` : ''}`}
                  className={`relative p-1 xs:p-1.5 sm:p-2.5 text-center min-h-[48px] xs:min-h-[56px] sm:min-h-[76px] rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer focus:outline-hidden ${
                    !cell.isCurrentMonth
                      ? 'text-slate-600 opacity-40 hover:bg-[#11182D]/40'
                      : isSelected
                      ? 'bg-[#151C35] border-2 border-[#7C5CFF] text-white font-bold shadow-[0_0_12px_rgba(124,92,255,0.2)]'
                      : isToday
                      ? 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/40 text-[#7C5CFF] font-semibold hover:bg-[#7C5CFF]/25'
                      : hasHoliday
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200 hover:bg-amber-500/20'
                      : 'text-slate-200 hover:bg-[#151C35] border border-transparent'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-center w-full">
                    <span
                      className={`text-xs sm:text-sm leading-none flex items-center justify-center ${
                        isToday
                          ? 'w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-[#7C5CFF] text-white font-bold shadow-[0_0_8px_rgba(124,92,255,0.4)] text-[11px] xs:text-xs'
                          : ''
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  {/* Holiday Indicator */}
                  <div className="w-full flex items-center justify-center min-h-[14px] xs:min-h-[16px]">
                    {hasHoliday && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1 xs:px-1.5 py-0.5 rounded-md max-w-full truncate"
                        title={cellHolidays.map((h) => h.name).join(' / ')}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate hidden sm:inline">
                          {cellHolidays[0].name}
                        </span>
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected Date Detail Area */}
          <div className="mt-4 p-4 bg-[#070B1A]/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-sm font-bold text-white">
                {formattedSelectedDate}
              </span>
              {isSelectedDateToday && (
                <span className="text-xs font-semibold text-[#7C5CFF] bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 px-2.5 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {selectedDateHolidays.length > 0 ? (
              <div className="space-y-2">
                {selectedDateHolidays.map((h, idx) => (
                  <div
                    key={`${h.date}-${h.name}-${idx}`}
                    className="flex items-start gap-3 bg-[#0D1326] border border-amber-500/30 p-3 rounded-lg shadow-sm"
                  >
                    <span className="text-lg select-none">🎉</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-amber-200 leading-tight">
                        {h.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-amber-500/15 text-amber-300 font-medium text-[11px] border border-amber-500/30">
                          {h.type || 'Public Holiday'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">Kerala, India</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>No holiday observed on this date.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
