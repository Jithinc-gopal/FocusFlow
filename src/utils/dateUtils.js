/**
 * Safe local calendar date utilities for FocusFlow.
 * 
 * Rules:
 * - Always use local system date methods (getFullYear, getMonth, getDate).
 * - Avoid `new Date("YYYY-MM-DD")` for comparisons or arithmetic because
 *   JavaScript parses ISO-8601 date strings without time as UTC midnight,
 *   which shifts dates backwards or forwards depending on local timezone.
 */

/**
 * Format a Date object to local YYYY-MM-DD string
 * @param {Date} [date=new Date()]
 * @returns {string} 'YYYY-MM-DD'
 */
export function formatLocalDate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a 'YYYY-MM-DD' string safely into local Date object (at midnight local time)
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const clean = dateStr.split('T')[0].trim()
  const parts = clean.split('-')
  if (parts.length !== 3) return null

  const year = Number(parts[0])
  const month = Number(parts[1]) - 1 // 0-indexed
  const day = Number(parts[2])

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  return new Date(year, month, day)
}

/**
 * Safely extract 'YYYY-MM-DD' from a task object (checking dueDate or due_date)
 * @param {object} task
 * @returns {string|null}
 */
export function getTaskDateStr(task) {
  if (!task) return null
  const raw = task.dueDate || task.due_date
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw.split('T')[0]
  }
  if (raw instanceof Date) {
    return formatLocalDate(raw)
  }
  return String(raw).split('T')[0]
}

/**
 * Check if two dates/strings represent the exact same calendar day
 * @param {string|Date} a
 * @param {string|Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  const strA = typeof a === 'string' ? a.split('T')[0] : a instanceof Date ? formatLocalDate(a) : null
  const strB = typeof b === 'string' ? b.split('T')[0] : b instanceof Date ? formatLocalDate(b) : null
  return Boolean(strA && strB && strA === strB)
}

/**
 * Get human-readable formatted string for a YYYY-MM-DD date
 * e.g. "Monday, October 5, 2026"
 * @param {string|Date} dateOrStr
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDisplayDate(dateOrStr, options) {
  const d = typeof dateOrStr === 'string' ? parseLocalDate(dateOrStr) : dateOrStr
  if (!d || isNaN(d.getTime())) return ''

  const defaultOpts = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return d.toLocaleDateString('en-US', options || defaultOpts)
}

/**
 * Format month and year label, e.g. "October 2026"
 * @param {number} year
 * @param {number} month 0-indexed
 * @returns {string}
 */
export function getMonthYearTitle(year, month) {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Calculate calendar matrix days for a given month and year.
 * Correctly includes leading days from the previous month and trailing days
 * from the next month to create full weeks starting on Sunday.
 * 
 * Accurately calculates leap years (e.g. Feb 29 2024, 2028) and all month lengths.
 * 
 * @param {number} year
 * @param {number} month 0-indexed (0 = Jan, 11 = Dec)
 * @returns {Array<object>} Array of day cell objects
 */
export function getCalendarGrid(year, month) {
  const todayStr = formatLocalDate(new Date())

  // Days in current month
  // Note: Day 0 of next month is the last day of current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // First day of current month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const grid = []

  // 1. Leading days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i
    // Determine previous month & year
    const prevDate = new Date(year, month, 0)
    prevDate.setDate(dayNumber)
    const dateStr = formatLocalDate(prevDate)
    grid.push({
      dateStr,
      dayNumber,
      year: prevDate.getFullYear(),
      month: prevDate.getMonth(),
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: prevDate.getDay(),
    })
  }

  // 2. Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d)
    const dateStr = formatLocalDate(curDate)
    grid.push({
      dateStr,
      dayNumber: d,
      year,
      month,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: curDate.getDay(),
    })
  }

  // 3. Trailing days from next month to complete the 7-column grid
  const remainder = grid.length % 7
  if (remainder > 0) {
    const daysNeeded = 7 - remainder
    for (let d = 1; d <= daysNeeded; d++) {
      const nextDate = new Date(year, month + 1, d)
      const dateStr = formatLocalDate(nextDate)
      grid.push({
        dateStr,
        dayNumber: d,
        year: nextDate.getFullYear(),
        month: nextDate.getMonth(),
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        isToday: dateStr === todayStr,
        dayOfWeek: nextDate.getDay(),
      })
    }
  }

  return grid
}

/**
 * Navigate month forward or backward
 * @param {number} year
 * @param {number} month 0-indexed
 * @param {number} delta e.g. -1 for prev, +1 for next
 * @returns {{ year: number, month: number }}
 */
export function navigateMonth(year, month, delta) {
  const d = new Date(year, month + delta, 1)
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
  }
}
