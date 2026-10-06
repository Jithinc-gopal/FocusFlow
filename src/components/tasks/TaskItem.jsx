import { Check, Calendar, MoreVertical, Pencil, Trash2, Eye, Clock, Folder } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTasks, TODAY_DATE_STR } from '../../context/TaskContext'
import PriorityBadge from '../ui/PriorityBadge'

export default function TaskItem({ task }) {
  const { toggleTaskComplete, openEditModal, openDetailsModal, openConfirm, deleteTask, categories } = useTasks()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Category styles refined for dark theme
  const categoryStyles = {
    Work: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Personal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Learning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Projects: 'bg-[#7C5CFF]/15 text-[#7C5CFF] border-[#7C5CFF]/30',
  }

  const categoryName =
    task.category_name ||
    (typeof task.category === 'string'
      ? task.category
      : categories?.find((c) => c.id === task.category)?.name) ||
    null

  const dueDateStr = task.dueDate || (task.due_date ? task.due_date.split('T')[0] : null)

  // Format date display
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    if (dateStr === TODAY_DATE_STR) return { text: 'Today', isOverdue: false, isToday: true }
    if (dateStr < TODAY_DATE_STR && !task.completed) {
      return { text: `Overdue (${dateStr})`, isOverdue: true, isToday: false }
    }
    return { text: dateStr, isOverdue: false, isToday: false }
  }

  const dueDateInfo = formatDueDate(dueDateStr)

  const handleDelete = () => {
    setMenuOpen(false)
    openConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmText: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: () => deleteTask(task.id),
    })
  }

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${
        task.completed
          ? 'border-slate-800/40 bg-[#070B1A]/80 opacity-70'
          : 'border-slate-800/80 bg-[#0D1326] hover:border-slate-700/80 hover:bg-[#11182D]/90 shadow-sm'
      }`}
    >
      {/* Left side: Checkbox + Title + Description */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => toggleTaskComplete(task.id)}
          aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
            task.completed
              ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.4)]'
              : 'border-slate-700 hover:border-[#7C5CFF] bg-[#070B1A] text-transparent hover:text-slate-500'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div
          role="button"
          tabIndex={0}
          aria-label={`View details for ${task.title}`}
          className="min-w-0 flex-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7C5CFF]/40 rounded-lg p-0.5"
          onClick={() => openDetailsModal(task)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openDetailsModal(task)
            }
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-medium leading-snug break-words transition-colors ${
                task.completed
                  ? 'line-through text-slate-500'
                  : 'text-slate-100 hover:text-[#7C5CFF]'
              }`}
            >
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 sm:line-clamp-1 break-words ${
                task.completed ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 flex-wrap">
            <PriorityBadge priority={task.priority} size="xs" />

            {categoryName && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                  categoryStyles[categoryName] || 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span className="truncate max-w-[120px] xs:max-w-[160px]">{categoryName}</span>
              </span>
            )}

            {dueDateInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                  dueDateInfo.isOverdue
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold'
                    : dueDateInfo.isToday
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{dueDateInfo.text}</span>
              </span>
            )}

            {task.completed && (task.completedAt || task.completed_at) && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 border border-slate-800 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                Completed {(task.completedAt || task.completed_at).split('T')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions Menu */}
      <div className="relative mt-2.5 sm:mt-0 flex items-center justify-end gap-1 flex-shrink-0 pl-9 sm:pl-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => openDetailsModal(task)}
          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-[#151C35] rounded-lg transition-colors cursor-pointer"
          title="View Details"
          aria-label="View task details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => openEditModal(task)}
          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-[#151C35] rounded-lg transition-colors cursor-pointer"
          title="Edit Task"
          aria-label="Edit task"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-[#151C35] rounded-lg transition-colors cursor-pointer"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title="More Options"
          aria-label="More task options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-9 w-40 bg-[#11182D] rounded-lg shadow-xl border border-slate-700/80 py-1 z-20 text-xs"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                toggleTaskComplete(task.id)
              }}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#151C35] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#7C5CFF]" />
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                openEditModal(task)
              }}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-[#151C35] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              Edit Task
            </button>
            <hr className="my-1 border-slate-800" />
            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
