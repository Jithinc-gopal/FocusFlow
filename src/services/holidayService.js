/**
 * Real Holiday Service for FocusFlow.
 * 
 * Fetches real Indian / Kerala public and state holidays from the Django backend API
 * (/api/holidays/?year=YYYY), which securely proxies live holiday data from Calendarific
 * or the live Kerala holiday feed without exposing API keys to the client.
 * 
 * Implements lightweight localStorage caching per year to minimize network requests
 * while supporting smooth navigation between years (e.g. 2026, 2027).
 */

const CACHE_KEY_PREFIX = 'focusflow_holidays_'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch holidays for a given year.
 * Checks localStorage cache first; if missing or expired, requests /api/holidays/?year=YYYY.
 * 
 * @param {number} year - Four-digit year e.g. 2026
 * @returns {Promise<{ holidays: Array<{date: string, name: string, type: string}>, error: string|null, source?: string }>}
 */
export async function fetchHolidays(year) {
  const cacheKey = `${CACHE_KEY_PREFIX}${year}`

  // 1. Try reading from localStorage cache
  try {
    const cachedStr = localStorage.getItem(cacheKey)
    if (cachedStr) {
      const cached = JSON.parse(cachedStr)
      const age = Date.now() - new Date(cached.fetchedAt).getTime()
      if (Array.isArray(cached.holidays) && age < CACHE_TTL_MS) {
        return {
          holidays: cached.holidays,
          error: null,
          source: cached.source || 'cache',
        }
      }
    }
  } catch (err) {
    console.warn('Failed to read holiday cache from localStorage:', err)
  }

  // 2. Fetch from Django backend API
  try {
    const res = await fetch(`/api/holidays/?year=${year}`, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`)
    }

    const data = await res.json()
    const holidays = Array.isArray(data.holidays) ? data.holidays : []

    // Cache valid response
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          fetchedAt: new Date().toISOString(),
          holidays,
          source: data.source || 'api',
        })
      )
    } catch (err) {
      console.warn('Failed to write holiday cache to localStorage:', err)
    }

    return {
      holidays,
      error: null,
      source: data.source,
    }
  } catch (err) {
    console.warn(`Failed to fetch holidays for year ${year}:`, err)

    // Check if we have stale cache we can use as fallback
    try {
      const staleStr = localStorage.getItem(cacheKey)
      if (staleStr) {
        const stale = JSON.parse(staleStr)
        if (Array.isArray(stale.holidays) && stale.holidays.length > 0) {
          return {
            holidays: stale.holidays,
            error: null,
            source: 'stale-cache',
          }
        }
      }
    } catch {
      // Ignore
    }

    return {
      holidays: [],
      error: 'Holiday information is temporarily unavailable.',
    }
  }
}

/**
 * Get all holidays occurring on a specific calendar date ('YYYY-MM-DD')
 * 
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {Array<object>} holidays
 * @returns {Array<object>}
 */
export function getHolidaysForDate(dateStr, holidays = []) {
  if (!dateStr || !Array.isArray(holidays)) return []
  const clean = dateStr.split('T')[0]
  return holidays.filter((h) => h.date === clean)
}

/**
 * Get the next upcoming official holiday relative to a given date string ('YYYY-MM-DD')
 * 
 * @param {string} fromDateStr 'YYYY-MM-DD'
 * @param {Array<object>} holidays
 * @returns {object|null}
 */
export function getNextUpcomingHoliday(fromDateStr, holidays = []) {
  if (!fromDateStr || !Array.isArray(holidays)) return null
  const clean = fromDateStr.split('T')[0]
  const upcoming = holidays
    .filter((h) => h.date >= clean)
    .sort((a, b) => a.date.localeCompare(b.date))
  return upcoming[0] || null
}
