import { useEffect } from 'react'
import { X, Calendar, Flag, Folder, Clock, Check, Pencil } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'
import PriorityBadge from '../ui/PriorityBadge'

export default function TaskDetailsModal() {
  const {
    isDetailsModalOpen,
    closeDetailsModal,
    taskToView,
    toggleTaskComplete,
    openEditModal,
    categories,
  } = useTasks()

  // Close on Escape key press
  useEffect(() => {
    if (!isDetailsModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDetailsModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailsModalOpen, closeDetailsModal])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isDetailsModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDetailsModalOpen])

  if (!isDetailsModalOpen || !taskToView) return null

  const categoryName =
    taskToView.category_name ||
    (typeof taskToView.category === 'string'
      ? taskToView.category
      : categories?.find((c) => c.id === taskToView.category)?.name) ||
    'None'

  const dueDateDisplay =
    taskToView.dueDate || (taskToView.due_date ? taskToView.due_date.split('T')[0] : 'No date')

  const createdAtStr = taskToView.createdAt || taskToView.created_at
  const completedAtStr = taskToView.completedAt || taskToView.completed_at

  const handleToggleComplete = () => {
    toggleTaskComplete(taskToView.id)
    closeDetailsModal()
  }

  const handleEdit = () => {
    const task = { ...taskToView }
    closeDetailsModal()
    openEditModal(task)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={closeDetailsModal}
    >
      <div
        className="w-full max-w-lg bg-[#0D1326] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#070B1A]/80 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                taskToView.completed ? 'bg-emerald-400' : 'bg-[#7C5CFF]'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {taskToView.completed ? 'Completed Task' : 'Active Task'}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDetailsModal}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <h3
              id="modal-details-title"
              className={`text-base sm:text-lg font-semibold text-white leading-snug break-words ${
                taskToView.completed ? 'line-through text-slate-500' : ''
              }`}
            >
              {taskToView.title}
            </h3>
          </div>

          {/* Description */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#070B1A] p-3 rounded-lg border border-slate-800 whitespace-pre-wrap break-words">
              {taskToView.description || 'No additional description provided.'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
            <div className="p-2.5 bg-[#070B1A] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <Flag className="w-3 h-3 text-[#7C5CFF]" /> Priority
              </span>
              <PriorityBadge priority={taskToView.priority} />
            </div>

            <div className="p-2.5 bg-[#070B1A] rounded-lg border border-slate-800 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <Folder className="w-3 h-3 text-[#7C5CFF]" /> Category
              </span>
              <span className="text-xs font-medium text-slate-200 truncate block">{categoryName}</span>
            </div>

            <div className="p-2.5 bg-[#070B1A] rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#7C5CFF]" /> Due Date
              </span>
              <span className="text-xs font-medium text-slate-200">{dueDateDisplay}</span>
            </div>
          </div>

          {/* Historical Dates */}
          <div className="p-3 bg-[#070B1A]/80 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Created At
              </span>
              <span className="font-mono text-slate-300">
                {createdAtStr ? createdAtStr.split('T')[0] : 'N/A'}
              </span>
            </div>

            {taskToView.completed && (
              <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Completed At
                </span>
                <span className="font-mono font-medium">
                  {completedAtStr ? completedAtStr.split('T')[0] : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#070B1A]/80 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer min-h-[40px] w-full sm:w-auto ${
              taskToView.completed
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            {taskToView.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-medium text-slate-200 bg-[#151C35] border border-slate-700/80 hover:bg-[#1a2342] rounded-lg transition-colors cursor-pointer min-h-[40px]"
            >
              <Pencil className="w-3.5 h-3.5 text-[#7C5CFF]" />
              Edit
            </button>
            <button
              type="button"
              onClick={closeDetailsModal}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
