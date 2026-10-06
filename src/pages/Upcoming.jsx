import { useMemo } from 'react'
import { CalendarDays, Plus, Calendar } from 'lucide-react'
import { useTasks, TODAY_DATE_STR } from '../context/TaskContext'
import { formatLocalDate, formatDisplayDate } from '../utils/dateUtils'
import SearchFilterBar from '../components/tasks/SearchFilterBar'
import TaskItem from '../components/tasks/TaskItem'
import EmptyState from '../components/ui/EmptyState'

export default function Upcoming() {
  const {
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    openAddModal,
    resetFilters,
  } = useTasks()

  // Filter tasks with future due date (or status matching)
  const filteredUpcomingTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = task.dueDate || (task.due_date ? task.due_date.split('T')[0] : null)
      // Must be upcoming
      if (!taskDate || taskDate <= TODAY_DATE_STR) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = (task.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }

      if (statusFilter === 'Active' && task.completed) return false
      if (statusFilter === 'Completed' && !task.completed) return false

      if (priorityFilter !== 'All') {
        const p = task.priority ? task.priority.toUpperCase() : ''
        if (p !== priorityFilter.toUpperCase()) return false
      }

      if (categoryFilter !== 'All') {
        const matchId = String(task.category) === String(categoryFilter)
        const matchName =
          task.category_name &&
          task.category_name.toLowerCase() === String(categoryFilter).toLowerCase()
        if (!matchId && !matchName) return false
      }

      return true
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter])

  // Group by date
  const groupedTasks = useMemo(() => {
    const groups = {}
    // Sort dates ascending
    const sorted = [...filteredUpcomingTasks].sort((a, b) => {
      const da = a.dueDate || (a.due_date ? a.due_date.split('T')[0] : '')
      const db = b.dueDate || (b.due_date ? b.due_date.split('T')[0] : '')
      return da.localeCompare(db)
    })

    sorted.forEach((task) => {
      const date = task.dueDate || (task.due_date ? task.due_date.split('T')[0] : 'No date')
      if (!groups[date]) groups[date] = []
      groups[date].push(task)
    })
    return groups
  }, [filteredUpcomingTasks])

  const formatDateHeader = (dateStr) => {
    const now = new Date()
    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const tomStr = formatLocalDate(tom)
    const formatted = formatDisplayDate(dateStr, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    if (dateStr === tomStr) {
      return `Tomorrow — ${formatted}`
    }
    return formatted || `Scheduled for ${dateStr}`
  }

  const dateKeys = Object.keys(groupedTasks)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Upcoming Tasks</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks scheduled for future days, grouped by timeline
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer w-full sm:w-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Future Task</span>
        </button>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar showCategoryFilter={true} />

      {/* Date Grouped Lists */}
      {dateKeys.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming tasks"
          description={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'No future tasks match your filters.'
              : 'You have no tasks scheduled for upcoming days. Plan ahead by adding future tasks!'
          }
          actionLabel={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'Reset Filters'
              : '+ Schedule Task'
          }
          onAction={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? resetFilters
              : () => openAddModal()
          }
        />
      ) : (
        <div className="space-y-6">
          {dateKeys.map((date) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {formatDateHeader(date)}
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-[#11182D] border border-slate-800 px-2 py-0.5 rounded-full">
                  {groupedTasks[date].length} {groupedTasks[date].length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div className="space-y-2.5">
                {groupedTasks[date].map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
