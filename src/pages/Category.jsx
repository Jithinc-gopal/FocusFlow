import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Briefcase,
  User,
  GraduationCap,
  FolderKanban,
  Plus,
  Folder,
  Trash2,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import SearchFilterBar from '../components/tasks/SearchFilterBar'
import TaskList from '../components/tasks/TaskList'
import EmptyState from '../components/ui/EmptyState'

export default function Category() {
  const { idOrName, listName } = useParams()
  const navigate = useNavigate()
  const param = idOrName || listName

  const {
    tasks,
    categories,
    addCategory,
    deleteCategory,
    searchQuery,
    statusFilter,
    priorityFilter,
    openAddModal,
    openConfirm,
    resetFilters,
  } = useTasks()

  // State for Create Category modal/form
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [createError, setCreateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find if a specific category is selected
  const selectedCategory = useMemo(() => {
    if (!param) return null
    return (
      categories.find(
        (c) =>
          String(c.id) === param || c.name.toLowerCase() === param.toLowerCase()
      ) || { id: null, name: param }
    )
  }, [categories, param])

  // Category visual metadata helper with refined dark colors
  const getCategoryMeta = (name) => {
    const map = {
      Work: {
        icon: Briefcase,
        color: 'text-blue-400',
        bg: 'bg-blue-500/15 border border-blue-500/25',
        progressBg: 'bg-blue-500',
        description: 'Professional deliverables, sprints, and strategic roadmap goals.',
      },
      Personal: {
        icon: User,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border border-emerald-500/25',
        progressBg: 'bg-emerald-500',
        description: 'Health, habits, home errands, and personal life routines.',
      },
      Learning: {
        icon: GraduationCap,
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border border-amber-500/25',
        progressBg: 'bg-amber-500',
        description: 'Courses, deep dives, reading list, and skill development.',
      },
      Projects: {
        icon: FolderKanban,
        color: 'text-[#7C5CFF]',
        bg: 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/25',
        progressBg: 'bg-[#7C5CFF]',
        description: 'Independent builds, open-source work, and creative ideas.',
      },
    }
    return (
      map[name] || {
        icon: Folder,
        color: 'text-[#7C5CFF]',
        bg: 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/25',
        progressBg: 'bg-[#7C5CFF]',
        description: 'Categorized task workspace.',
      }
    )
  }

  // Handle category creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      setCreateError('Please enter a category name.')
      return
    }

    try {
      setIsSubmitting(true)
      setCreateError('')
      await addCategory(trimmed)
      setNewCategoryName('')
      setIsCreating(false)
    } catch (err) {
      setCreateError(err.message || 'Failed to create category.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle category deletion
  const handleDeleteCategory = (cat) => {
    openConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"? Any tasks in this category will remain, but will become uncategorized.`,
      confirmText: 'Delete Category',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id)
          if (param && (String(cat.id) === param || cat.name.toLowerCase() === param.toLowerCase())) {
            navigate('/categories')
          }
        } catch (err) {
          console.error('Delete error:', err)
        }
      },
    })
  }

  // If a specific category was selected (e.g. /categories/:idOrName or /lists/:listName)
  if (selectedCategory) {
    const meta = getCategoryMeta(selectedCategory.name)
    const Icon = meta.icon

    // Filter tasks for this category
    const categoryTasks = tasks.filter((t) => {
      if (selectedCategory.id && t.category === selectedCategory.id) return true
      if (
        t.category_name &&
        t.category_name.toLowerCase() === selectedCategory.name.toLowerCase()
      )
        return true
      if (
        typeof t.category === 'string' &&
        t.category.toLowerCase() === selectedCategory.name.toLowerCase()
      )
        return true
      return false
    })

    const totalCount = categoryTasks.length
    const completedCount = categoryTasks.filter((t) => t.completed).length
    const remainingCount = totalCount - completedCount
    const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

    const filteredTasks = categoryTasks.filter((task) => {
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

      return true
    })

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#7C5CFF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Categories</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {selectedCategory.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            {selectedCategory.id && (
              <button
                type="button"
                onClick={() => handleDeleteCategory(selectedCategory)}
                aria-label={`Delete category ${selectedCategory.name}`}
                className="p-2.5 sm:p-2 min-h-[42px] min-w-[42px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-slate-800 shrink-0"
                title="Delete this category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => openAddModal(selectedCategory.id || selectedCategory.name)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer flex-1 sm:flex-initial min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress & Stats Card */}
        <div className="p-4 sm:p-5 bg-[#0D1326] rounded-xl border border-slate-800/80 shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Tasks
              </span>
              <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">{totalCount}</span>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">
                {completedCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Remaining
              </span>
              <span className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5 block">
                {remainingCount}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-400">Completion Progress</span>
              <span className="text-white font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`${meta.progressBg} h-2.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <SearchFilterBar showCategoryFilter={false} />

        {/* Task List */}
        <TaskList
          tasks={filteredTasks}
          emptyTitle={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'No matching tasks'
              : `No tasks in ${selectedCategory.name}`
          }
          emptyDescription={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Try modifying your search or priority criteria.'
              : `Add your first task to ${selectedCategory.name} to begin organizing your work.`
          }
          emptyActionLabel={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Reset Filters'
              : `+ Add ${selectedCategory.name} Task`
          }
          onEmptyAction={
            searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
              ? resetFilters
              : () => openAddModal(selectedCategory.id || selectedCategory.name)
          }
        />
      </div>
    )
  }

  // CATEGORY MANAGEMENT VIEW (/categories or /lists)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Organize and manage your task categories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(true)
            setCreateError('')
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer w-full sm:w-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Category</span>
        </button>
      </div>

      {/* Inline Create Category Form / Modal */}
      {isCreating && (
        <div className="p-4 sm:p-5 bg-[#0D1326] rounded-xl border border-[#7C5CFF]/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Create New Category</h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setNewCategoryName('')
                setCreateError('')
              }}
              aria-label="Cancel category creation"
              className="text-slate-400 hover:text-white p-1.5 rounded-md cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            {createError && (
              <div className="p-2.5 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-lg">
                {createError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value)
                  if (createError) setCreateError('')
                }}
                placeholder="e.g. Work, Personal, Learning, Projects..."
                className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-lg outline-none transition-all min-h-[40px]"
              />
            </div>

            <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewCategoryName('')
                  setCreateError('')
                }}
                disabled={isSubmitting}
                className="px-3.5 py-2 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-lg transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 sm:py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[38px] flex items-center justify-center"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category List or Empty State */}
      {categories.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No categories yet"
          description="Categories help organize your tasks into distinct workspaces."
          actionLabel="+ Create Category"
          onAction={() => {
            setIsCreating(true)
            setCreateError('')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const meta = getCategoryMeta(cat.name)
            const Icon = meta.icon
            const catTasks = tasks.filter(
              (t) =>
                t.category === cat.id ||
                (t.category_name && t.category_name.toLowerCase() === cat.name.toLowerCase())
            )
            const activeCount = catTasks.filter((t) => !t.completed).length

            return (
              <div
                key={cat.id}
                className="bg-[#0D1326] p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 hover:bg-[#11182D] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      aria-label={`Delete category ${cat.name}`}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {catTasks.length} {catTasks.length === 1 ? 'task' : 'tasks'}
                    {catTasks.length > 0 && ` (${activeCount} active)`}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/categories/${cat.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C5CFF] hover:text-[#94A3B8] transition-colors"
                  >
                    <span>View Tasks</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => openAddModal(cat.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
