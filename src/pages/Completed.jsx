import { useMemo } from 'react'
import { CheckCircle2, Check } from 'lucide-react'
import { useTasks, TODAY_DATE_STR } from '../context/TaskContext'
import SearchFilterBar from '../components/tasks/SearchFilterBar'
import TaskItem from '../components/tasks/TaskItem'
import EmptyState from '../components/ui/EmptyState'

export default function Completed() {
  const { tasks, searchQuery, priorityFilter, categoryFilter, resetFilters } = useTasks()

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.completed) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = (task.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }

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
  }, [tasks, searchQuery, priorityFilter, categoryFilter])

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const formattedYesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Group by Today, Yesterday, Earlier
  const groupedTasks = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    completedTasks.forEach((task) => {
      const completedTime = task.completedAt || task.completed_at
      const completedDate = completedTime
        ? completedTime.split('T')[0]
        : task.dueDate || (task.due_date ? task.due_date.split('T')[0] : TODAY_DATE_STR)

      if (completedDate === TODAY_DATE_STR) {
        groups.Today.push(task)
      } else if (completedDate === yesterdayStr) {
        groups.Yesterday.push(task)
      } else {
        groups.Earlier.push(task)
      }
    })

    return groups
  }, [completedTasks, yesterdayStr])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Completed Archive</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical archive of {completedTasks.length} accomplished tasks
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar showCategoryFilter={true} />

      {completedTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No completed tasks found"
          description={
            searchQuery || priorityFilter !== 'All' || categoryFilter !== 'All'
              ? 'No finished tasks match your search or filter filters.'
              : 'Tasks you mark as completed will be archived here with their completion timestamps.'
          }
          actionLabel={searchQuery || priorityFilter !== 'All' || categoryFilter !== 'All' ? 'Reset Filters' : null}
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groupedTasks.Today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Today ({formattedToday})
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-[#11182D] border border-slate-800 px-2 py-0.5 rounded-full">
                  {groupedTasks.Today.length} completed
                </span>
              </div>
              <div className="space-y-2.5">
                {groupedTasks.Today.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedTasks.Yesterday.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Yesterday ({formattedYesterday})
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-[#11182D] border border-slate-800 px-2 py-0.5 rounded-full">
                  {groupedTasks.Yesterday.length} completed
                </span>
              </div>
              <div className="space-y-2.5">
                {groupedTasks.Yesterday.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {groupedTasks.Earlier.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Earlier History
                </h3>
                <span className="text-[11px] font-mono text-slate-400 bg-[#11182D] border border-slate-800 px-2 py-0.5 rounded-full">
                  {groupedTasks.Earlier.length} completed
                </span>
              </div>
              <div className="space-y-2.5">
                {groupedTasks.Earlier.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
