import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sparkles, Calendar, ArrowRight, Receipt } from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import { useAuth } from '../context/AuthContext'
import { formatLocalDate, getTaskDateStr, formatDisplayDate } from '../utils/dateUtils'
import { fetchHolidays, getNextUpcomingHoliday } from '../services/holidayService'
import { fetchExpenses } from '../services/expenseService'
import { formatCurrency } from '../utils/currencyUtils'
import CalendarModal from '../components/modals/CalendarModal'
import SummaryCards from '../components/dashboard/SummaryCards'
import ProgressSection from '../components/dashboard/ProgressSection'
import CompletionTrendChart from '../components/dashboard/CompletionTrendChart'
import SearchFilterBar from '../components/tasks/SearchFilterBar'
import TaskList from '../components/tasks/TaskList'

export default function Dashboard() {
  const { user, token } = useAuth()
  const {
    tasks,
    todayTasks,
    todayRemainingCount,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    openAddModal,
    resetFilters,
  } = useTasks()

  const tomorrowStr = useMemo(() => {
    const now = new Date()
    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return formatLocalDate(tom)
  }, [])

  const tomorrowTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      const d = getTaskDateStr(t)
      return d === tomorrowStr && !t.completed
    }).length
  }, [tasks, tomorrowStr])

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [holidays, setHolidays] = useState([])
  const [monthlyExpenses, setMonthlyExpenses] = useState({ total: 0, count: 0, loading: true })

  // Load real holidays for current year
  useEffect(() => {
    let isMounted = true
    const currentYear = new Date().getFullYear()
    fetchHolidays(currentYear).then((res) => {
      if (isMounted && res.holidays) {
        setHolidays(res.holidays)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Load current month's expenses summary
  useEffect(() => {
    let isMounted = true
    if (token) {
      fetchExpenses(token)
        .then((data) => {
          if (!isMounted) return
          const total = (data || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          setMonthlyExpenses({ total, count: (data || []).length, loading: false })
        })
        .catch(() => {
          if (isMounted) setMonthlyExpenses({ total: 0, count: 0, loading: false })
        })
    }
    return () => {
      isMounted = false
    }
  }, [token])

  const nextHoliday = useMemo(() => {
    const todayStr = formatLocalDate(new Date())
    return getNextUpcomingHoliday(todayStr, holidays)
  }, [holidays])

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  // Filter today's tasks based on active filters
  const filteredTodayTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(query)
        const matchDesc = (task.description || '').toLowerCase().includes(query)
        if (!matchTitle && !matchDesc) return false
      }

      // Status
      if (statusFilter === 'Active' && task.completed) return false
      if (statusFilter === 'Completed' && !task.completed) return false

      // Priority
      if (priorityFilter !== 'All') {
        const p = task.priority ? task.priority.toUpperCase() : ''
        if (p !== priorityFilter.toUpperCase()) return false
      }

      // Category
      if (categoryFilter !== 'All') {
        const matchId = String(task.category) === String(categoryFilter)
        const matchName =
          task.category_name &&
          task.category_name.toLowerCase() === String(categoryFilter).toLowerCase()
        if (!matchId && !matchName) return false
      }

      return true
    })
  }, [todayTasks, searchQuery, statusFilter, priorityFilter, categoryFilter])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5CFF] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formattedToday}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Good morning, {user?.username || 'there'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Let's make today productive. You have {todayRemainingCount} tasks remaining today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer w-full sm:w-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Summary Cards */}
      <section aria-label="Daily Task Metrics">
        <SummaryCards />
      </section>

      {/* Completion Trend Line Graph */}
      <section aria-label="Task Completion Trend">
        <CompletionTrendChart />
      </section>

      {/* Historical Progress Section */}
      <section aria-label="Task Velocity Progress">
        <ProgressSection />
      </section>

      {/* Glances: Calendar & Monthly Expenses */}
      <section aria-label="Dashboard Glances" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calendar & Upcoming Glance */}
        <div className="bg-gradient-to-r from-[#0D1326] via-[#11182D] to-[#151C35] border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] text-white flex items-center justify-center shadow-[0_0_12px_rgba(108,77,246,0.35)] shrink-0 mt-0.5 sm:mt-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Upcoming & Calendar Glance
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#7C5CFF] bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Tomorrow: {tomorrowTasksCount} {tomorrowTasksCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                {nextHoliday ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] sm:text-xs max-w-full">
                    <span>🇮🇳</span>
                    <span className="truncate">
                      {formatDisplayDate(nextHoliday.date, { month: 'short', day: 'numeric' })}: {nextHoliday.name}
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-normal hidden xs:inline shrink-0">
                      ({nextHoliday.type === 'PUBLIC_HOLIDAY' ? 'Holiday' : 'Observance'})
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Plan tasks on the monthly calendar</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#151C35] hover:bg-[#1a2342] active:bg-[#11182D] border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-xs transition-colors w-full sm:w-auto shrink-0 min-h-[42px] cursor-pointer"
            title="Open personal calendar modal"
          >
            <Calendar className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Monthly Expenses Glance */}
        <div className="bg-gradient-to-r from-[#0D1326] via-[#11182D] to-[#151C35] border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] text-white flex items-center justify-center shadow-[0_0_12px_rgba(108,77,246,0.35)] shrink-0 mt-0.5 sm:mt-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Monthly Expenses
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#7C5CFF] bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {monthlyExpenses.count} {monthlyExpenses.count === 1 ? 'expense' : 'expenses'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
                  {formatCurrency(monthlyExpenses.total)}
                </span>
                <span className="text-xs text-slate-400">
                  this month
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/expenses"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#151C35] hover:bg-[#1a2342] active:bg-[#11182D] border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-xs transition-colors w-full sm:w-auto shrink-0 min-h-[42px] cursor-pointer"
            title="Open Expenses"
          >
            <span>View Expenses</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#7C5CFF]" />
          </Link>
        </div>
      </section>

      {/* Today's Tasks Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Today's Agenda</h2>
            <p className="text-xs text-slate-400">
              Tasks scheduled for execution today
            </p>
          </div>
          <span className="text-xs font-medium text-slate-300 bg-[#11182D] border border-slate-800 px-2.5 py-1 rounded-full">
            {filteredTodayTasks.length} {filteredTodayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <SearchFilterBar showCategoryFilter={true} />

        {/* Task List */}
        <TaskList
          tasks={filteredTodayTasks}
          emptyTitle={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'No matching tasks'
              : 'All clear for today!'
          }
          emptyDescription={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'Try changing or clearing your search and filter criteria.'
              : 'You have no more tasks scheduled for today. Great work staying ahead of schedule!'
          }
          emptyActionLabel={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'Clear Filters'
              : '+ Add Today Task'
          }
          onEmptyAction={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? resetFilters
              : () => openAddModal()
          }
        />
      </section>

      {/* Personal Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  )
}
