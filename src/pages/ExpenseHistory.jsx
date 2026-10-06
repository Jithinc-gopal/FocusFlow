import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  History,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchExpenseHistory } from '../services/expenseService'
import { formatCurrency } from '../utils/currencyUtils'

export default function ExpenseHistory() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchExpenseHistory(token)
      setHistory(data)
    } catch (err) {
      setError(err.message || 'Failed to load expense history.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleMonthClick = (year, month) => {
    navigate(`/expenses?year=${year}&month=${month}`)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Back link */}
      <div>
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Expenses</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5CFF] uppercase tracking-wider mb-1">
          <History className="w-3.5 h-3.5" />
          <span>Expense Records</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
          Expense History
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Browse historical spending across previous months. Click any month to view its detailed ledger.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 sm:p-4 text-xs sm:text-sm text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="text-xs underline hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0D1326] border border-slate-800/80 rounded-2xl p-5 animate-pulse"
            >
              <div className="h-4 bg-slate-800 rounded w-1/2 mb-3" />
              <div className="h-7 bg-slate-800/60 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-800/40 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <div className="bg-[#0D1326] border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF] flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">
            No expense history found
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Once you log expenses, historical month summaries will automatically appear here.
          </p>
          <Link
            to="/expenses"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] transition-all cursor-pointer min-h-[40px]"
          >
            <Receipt className="w-4 h-4" />
            <span>Go to Current Expenses</span>
          </Link>
        </div>
      )}

      {/* History Grid */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <div
              key={`${item.year}-${item.month}`}
              onClick={() => handleMonthClick(item.year, item.month)}
              className="bg-[#0D1326] hover:bg-[#11182D] border border-slate-800/80 hover:border-[#7C5CFF]/40 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleMonthClick(item.year, item.month)
                }
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-[#7C5CFF] transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {item.month_name} {item.year}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                    {formatCurrency(item.total_amount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                </span>
                <span className="text-[11px] font-medium text-[#7C5CFF] group-hover:underline">
                  View month ledger →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
