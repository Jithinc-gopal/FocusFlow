import { useMemo } from 'react'
import { Sun, Plus, CheckCircle2 } from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import SearchFilterBar from '../components/tasks/SearchFilterBar'
import TaskList from '../components/tasks/TaskList'

export default function MyDay() {
  const {
    todayTasks,
    todayCompletedCount,
    todayRemainingCount,
    todayCompletionRate,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    openAddModal,
    resetFilters,
  } = useTasks()

  const filteredTasks = useMemo(() => {
    return todayTasks.filter((task) => {
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
  }, [todayTasks, searchQuery, statusFilter, priorityFilter, categoryFilter])

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">My Day</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {formattedToday} • {todayRemainingCount} tasks remaining
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer w-full sm:w-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task to Day</span>
        </button>
      </div>

      {/* Progress Banner */}
      <div className="p-4 sm:p-5 bg-[#0D1326] rounded-xl border border-slate-800/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Today's Completion Pace
            </span>
          </div>
          <span className="text-xs font-semibold text-[#7C5CFF]">
            {todayCompletedCount} of {todayTasks.length} completed ({todayCompletionRate}%)
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(124,92,255,0.4)]"
            style={{ width: `${todayCompletionRate}%` }}
          />
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar showCategoryFilter={true} />

      {/* Tasks List */}
      <div className="space-y-3">
        <TaskList
          tasks={filteredTasks}
          emptyTitle={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'No matching tasks'
              : 'No tasks scheduled for today'
          }
          emptyDescription={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'Try relaxing your search or filter filters to view more tasks.'
              : 'Take a break or plan new tasks to focus on today.'
          }
          emptyActionLabel={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'Reset Filters'
              : '+ Add Task'
          }
          onEmptyAction={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? resetFilters
              : () => openAddModal()
          }
        />
      </div>
    </div>
  )
}
