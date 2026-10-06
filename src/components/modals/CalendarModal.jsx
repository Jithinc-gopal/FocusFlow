import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
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
} from '../../utils/dateUtils'
import {
  fetchHolidays,
  getHolidaysForDate,
} from '../../services/holidayService'

const WEEKDAYS = [
  { short: 'Sun', letter: 'S', isWeekend: true },
  { short: 'Mon', letter: 'M', isWeekend: false },
  { short: 'Tue', letter: 'T', isWeekend: false },
  { short: 'Wed', letter: 'W', isWeekend: false },
  { short: 'Thu', letter: 'T', isWeekend: false },
  { short: 'Fri', letter: 'F', isWeekend: false },
  { short: 'Sat', letter: 'S', isWeekend: true },
]

export default function CalendarModal({ isOpen, onClose }) {
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

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 xs:p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0D1326] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3.5 border-b border-slate-800 bg-[#070B1A]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] text-white flex items-center justify-center shadow-[0_0_12px_rgba(108,77,246,0.35)] shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="calendar-modal-title"
                className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight"
              >
                Personal Calendar
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Check dates & Indian/Kerala public holidays
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 bg-[#0D1326] border-b border-slate-800 gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#151C35] active:bg-[#11182D] rounded-lg transition-colors cursor-pointer border border-slate-700/80"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-base font-bold text-white min-w-[120px] sm:min-w-[130px] text-center tracking-tight">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#151C35] active:bg-[#11182D] rounded-lg transition-colors cursor-pointer border border-slate-700/80"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#151C35] px-2 py-1 rounded-md border border-slate-700">
                <Loader2 className="w-3 h-3 animate-spin text-[#7C5CFF]" />
                <span className="hidden sm:inline">Loading holidays...</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151C35] hover:bg-[#1a2342] active:bg-[#11182D] border border-slate-700/80 rounded-lg shadow-xs transition-colors cursor-pointer min-h-[36px]"
              title="Jump to today"
            >
              <Sparkles className="w-3 h-3 text-[#7C5CFF]" />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Non-blocking Offline / Error Alert */}
        {error && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Calendar Body */}
        <div className="overflow-y-auto px-3 sm:px-6 py-3 space-y-3">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 pb-1 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day.short}
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  day.isWeekend ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                <span className="hidden sm:inline">{day.short}</span>
                <span className="sm:hidden">{day.letter}</span>
              </div>
            ))}
          </div>

          {/* Monthly Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
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
                  className={`relative p-1 sm:p-1.5 text-center min-h-[46px] sm:min-h-[56px] rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer focus:outline-hidden ${
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
                          ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7C5CFF] text-white font-bold shadow-[0_0_8px_rgba(124,92,255,0.4)]'
                          : ''
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  {/* Holiday Indicator */}
                  <div className="w-full flex items-center justify-center min-h-[14px]">
                    {hasHoliday && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1 py-0.2 rounded-md max-w-full truncate"
                        title={cellHolidays.map((h) => h.name).join(' / ')}
                      >
                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
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
          <div className="mt-2 p-3 sm:p-3.5 bg-[#070B1A]/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
              <span className="text-xs font-bold text-white">
                {formattedSelectedDate}
              </span>
              {isSelectedDateToday && (
                <span className="text-[10px] font-semibold text-[#7C5CFF] bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {selectedDateHolidays.length > 0 ? (
              <div className="space-y-1.5">
                {selectedDateHolidays.map((h, idx) => (
                  <div
                    key={`${h.date}-${h.name}-${idx}`}
                    className="flex items-start gap-2 bg-[#0D1326] border border-amber-500/30 p-2.5 rounded-lg shadow-sm"
                  >
                    <span className="text-base select-none">🎉</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-200 leading-tight">
                        {h.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-300 font-medium text-[10px] border border-amber-500/30">
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
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>No holiday observed on this date.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#070B1A]/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Personal date & holiday viewer</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#151C35] hover:bg-[#1a2342] rounded-lg transition-colors cursor-pointer border border-slate-700/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
