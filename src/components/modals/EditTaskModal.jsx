import { useState, useEffect } from 'react'
import { X, Calendar, Flag, Folder, Trash2 } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'

function EditTaskForm({ task, onClose }) {
  const { updateTask, deleteTask, openConfirm, categories } = useTasks()

  const normalizedPriority = (() => {
    if (!task.priority) return 'Medium'
    const p = task.priority.toUpperCase()
    if (p === 'HIGH') return 'High'
    if (p === 'LOW') return 'Low'
    return 'Medium'
  })()

  const initialCatId = (() => {
    if (!task.category) return ''
    if (typeof task.category === 'object' && task.category.id) return task.category.id
    if (!isNaN(Number(task.category))) return Number(task.category)
    const match = categories.find(c => c.name.toLowerCase() === String(task.category).toLowerCase())
    return match ? match.id : ''
  })()

  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.dueDate || (task.due_date ? task.due_date.split('T')[0] : ''))
  const [priority, setPriority] = useState(normalizedPriority)
  const [category, setCategory] = useState(initialCatId)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Lock body scroll while modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a task title')
      return
    }

    try {
      setSubmitting(true)
      await updateTask(task.id, {
        title,
        description,
        dueDate,
        priority,
        category: category ? Number(category) : null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = () => {
    openConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmText: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        await deleteTask(task.id)
        onClose()
      },
    })
  }

  return (
    <div
      className="w-full max-w-lg bg-[#0D1326] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100 flex flex-col max-h-[90vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#070B1A]/80 shrink-0">
        <h3 id="modal-edit-title" className="text-sm sm:text-base font-semibold text-white">
          Edit Task
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="text-slate-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div className="p-2.5 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-lg">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-lg outline-none transition-all min-h-[40px]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add key context, notes, or sub-details..."
            className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-lg outline-none transition-all resize-none"
          />
        </div>

        {/* Controls: Due Date, Priority, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Due Date */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 text-xs font-medium bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] text-slate-200 rounded-lg outline-none cursor-pointer min-h-[40px]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 text-xs font-medium bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] text-slate-200 rounded-lg outline-none cursor-pointer min-h-[40px]"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 text-xs font-medium bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] text-slate-200 rounded-lg outline-none cursor-pointer min-h-[40px]"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer actions with Delete Task */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg transition-colors cursor-pointer min-h-[40px] w-full sm:w-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Task
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-lg transition-colors cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-lg shadow-[0_0_15px_rgba(108,77,246,0.3)] transition-all cursor-pointer disabled:opacity-50 min-h-[40px] flex items-center justify-center"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function EditTaskModal() {
  const { isEditModalOpen, closeEditModal, taskToEdit } = useTasks()

  if (!isEditModalOpen || !taskToEdit) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={closeEditModal}
    >
      <EditTaskForm task={taskToEdit} onClose={closeEditModal} />
    </div>
  )
}
