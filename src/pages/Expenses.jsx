import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Receipt,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  Pencil,
  Trash2,
  AlertCircle,
  IndianRupee,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTasks, getTodayDateStr } from '../context/TaskContext'
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService'
import { formatCurrency } from '../utils/currencyUtils'
import ExpenseModal from '../components/modals/ExpenseModal'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function Expenses() {
  const { token } = useAuth()
  const { openConfirm } = useTasks()
  const [searchParams, setSearchParams] = useSearchParams()

  const todayStr = useMemo(() => getTodayDateStr(), [])
  const todayDate = useMemo(() => new Date(), [])

  // Read year & month from URL or default to current date
  const paramYear = searchParams.get('year')
  const paramMonth = searchParams.get('month')

  const currentYear = useMemo(() => todayDate.getFullYear(), [todayDate])
  const currentMonth = useMemo(() => todayDate.getMonth() + 1, [todayDate])

  const selectedYear = paramYear ? parseInt(paramYear, 10) : currentYear
  const selectedMonth = paramMonth ? parseInt(paramMonth, 10) : currentMonth

  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState(null)

  // Yesterday date string for label comparisons
  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Load expenses for selected month
  const loadExpenses = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchExpenses(token, {
        year: selectedYear,
        month: selectedMonth,
      })
      setExpenses(data)
    } catch (err) {
      setError(err.message || 'Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [token, selectedYear, selectedMonth])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  // Navigate to previous month
  const handlePrevMonth = () => {
    let newMonth = selectedMonth - 1
    let newYear = selectedYear
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    setSearchParams({ year: String(newYear), month: String(newMonth) })
  }

  // Navigate to next month
  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1
    let newYear = selectedYear
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    setSearchParams({ year: String(newYear), month: String(newMonth) })
  }

  // Reset to current month
  const handleCurrentMonth = () => {
    setSearchParams({ year: String(currentYear), month: String(currentMonth) })
  }

  // Calculate monthly total directly from actual expense records
  const monthlyTotal = useMemo(() => {
    return expenses.reduce((sum, item) => {
      const amt = parseFloat(item.amount) || 0
      return sum + amt
    }, 0)
  }, [expenses])

  // Group expenses by date (ordered newest first)
  const groupedExpenses = useMemo(() => {
    const groups = {}
    expenses.forEach((item) => {
      const dateKey = item.expense_date || item.expenseDate
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    // Sort date keys descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

    return sortedDates.map((dateKey) => {
      const dayItems = groups[dateKey]
      const dayTotal = dayItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

      let label = dateKey
      let sublabel = ''

      if (dateKey === todayStr) {
        label = 'TODAY'
        sublabel = formatDayString(dateKey)
      } else if (dateKey === yesterdayStr) {
        label = 'YESTERDAY'
        sublabel = formatDayString(dateKey)
      } else {
        label = formatDayString(dateKey)
      }

      return {
        dateKey,
        label,
        sublabel,
        dayTotal,
        items: dayItems,
      }
    })
  }, [expenses, todayStr, yesterdayStr])

  // Helper to format date string like "05 October 2026"
  function formatDayString(isoStr) {
    if (!isoStr) return ''
    try {
      const [y, m, d] = isoStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return isoStr
    }
  }

  // Open modal for add
  const handleOpenAdd = () => {
    setExpenseToEdit(null)
    setIsModalOpen(true)
  }

  // Open modal for edit
  const handleOpenEdit = (expense) => {
    setExpenseToEdit(expense)
    setIsModalOpen(true)
  }

  // Save (Add or Edit)
  const handleSaveExpense = async (formData) => {
    if (expenseToEdit) {
      // Update
      const updated = await updateExpense(token, expenseToEdit.id, formData)
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseToEdit.id ? updated : e))
      )
    } else {
      // Create
      const created = await createExpense(token, formData)
      // Check if created belongs to currently selected month
      const createdDate = created.expense_date || created.expenseDate
      if (createdDate) {
        const [cYear, cMonth] = createdDate.split('-').map(Number)
        if (cYear === selectedYear && cMonth === selectedMonth) {
          setExpenses((prev) => [created, ...prev])
        }
      } else {
        setExpenses((prev) => [created, ...prev])
      }
    }
  }

  // Confirm delete
  const handleDeleteClick = (expense) => {
    openConfirm({
      title: 'Delete Expense?',
      message: `Are you sure you want to delete "${expense.description}" for ${formatCurrency(expense.amount)}?`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteExpense(token, expense.id)
          setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
        } catch (err) {
          setError(err.message || 'Failed to delete expense.')
        }
      },
    })
  }

  const monthName = MONTH_NAMES[selectedMonth - 1] || ''

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5CFF] uppercase tracking-wider mb-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Personal Expense Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track your daily spending and understand where your money goes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/expenses/history"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-xl transition-colors min-h-[42px] cursor-pointer"
          >
            <History className="w-4 h-4 text-[#7C5CFF]" />
            <span>History</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Prominent Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prominent Monthly Total Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#0D1326] via-[#11182D] to-[#151C35] border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Expense ({monthName} {selectedYear})
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF]">
              <IndianRupee className="w-5 h-5 stroke-[2]" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                {formatCurrency(monthlyTotal)}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-400 bg-[#070B1A]/60 px-3 py-1 rounded-full border border-slate-800 w-fit">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800/60">
            Calculated dynamically from {expenses.length} recorded items for {monthName} {selectedYear}
          </p>
        </div>

        {/* Month Picker / Navigator */}
        <div className="bg-[#0D1326] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Month
              </span>
              <Calendar className="w-4 h-4 text-[#7C5CFF]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {monthName} {selectedYear}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCurrentMonth ? 'Current viewing month' : 'Viewing historical month'}
            </p>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#11182D] hover:bg-[#151C35] border border-slate-800 rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#11182D] hover:bg-[#151C35] border border-slate-800 rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="w-full text-center text-xs font-semibold text-[#7C5CFF] hover:text-[#94A3B8] transition-colors py-1 cursor-pointer"
              >
                Return to Current Month
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 sm:p-4 text-xs sm:text-sm text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadExpenses}
            className="text-xs underline hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Expense List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Daily Expense Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Expenses grouped by day for easy evening tracking
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-[#11182D] border border-slate-800 px-3 py-1 rounded-full">
            {groupedExpenses.length} {groupedExpenses.length === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#0D1326] border border-slate-800/80 rounded-2xl p-4 sm:p-5 animate-pulse"
              >
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-3" />
                <div className="h-10 bg-slate-800/50 rounded mb-2" />
                <div className="h-10 bg-slate-800/50 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && expenses.length === 0 && (
          <div className="bg-[#0D1326] border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF] flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              No expenses yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Start tracking your spending by adding your first expense for {monthName} {selectedYear}.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] transition-all cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        )}

        {/* Grouped Daily Expense Cards */}
        {!loading && expenses.length > 0 && (
          <div className="space-y-4">
            {groupedExpenses.map((group) => (
              <div
                key={group.dateKey}
                className="bg-[#0D1326] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Day Header */}
                <div className="px-4 sm:px-5 py-3 bg-[#090E23]/90 border-b border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                      {group.label}
                    </span>
                    {group.sublabel && (
                      <span className="text-xs text-slate-400 truncate">
                        • {group.sublabel}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 mr-1.5 hidden xs:inline">
                      {group.label === 'TODAY'
                        ? 'Total for today'
                        : group.label === 'YESTERDAY'
                        ? 'Total for yesterday'
                        : 'Total:'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#7C5CFF] font-mono">
                      {formatCurrency(group.dayTotal)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-800/60">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 hover:bg-[#11182D]/70 transition-colors flex items-center justify-between gap-3 group"
                    >
                      {/* Left: Description & Date on mobile */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white break-words">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 sm:hidden">
                          {formatDayString(item.expense_date || item.expenseDate)}
                        </p>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <span className="text-sm sm:text-base font-semibold text-white font-mono">
                          {formatCurrency(item.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Expense"
                            aria-label={`Edit ${item.description}`}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#151C35] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            title="Delete Expense"
                            aria-label={`Delete ${item.description}`}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />
    </div>
  )
}
