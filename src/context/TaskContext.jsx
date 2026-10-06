import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const TaskContext = createContext(null)

export const getTodayDateStr = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTaskDateStr = (task) => {
  if (!task) return null
  const raw = task.dueDate || task.due_date
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw.split('T')[0]
  }
  if (raw instanceof Date) {
    const y = raw.getFullYear()
    const m = String(raw.getMonth() + 1).padStart(2, '0')
    const d = String(raw.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(raw).split('T')[0]
}

export const TODAY_DATE_STR = getTodayDateStr()

export function TaskProvider({ children }) {
  const { token } = useAuth()

  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [taskActivities, setTaskActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addModalDefaultCategory, setAddModalDefaultCategory] = useState(null)
  const [addModalDefaultDueDate, setAddModalDefaultDueDate] = useState(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [taskToView, setTaskToView] = useState(null)

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    onConfirm: () => {},
  })

  // Fetch all tasks and categories from Django backend
  const fetchTasksAndCategories = useCallback(async () => {
    if (!token) {
      setTasks([])
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      }

      const [tasksRes, categoriesRes] = await Promise.all([
        fetch('/api/tasks/', { headers }),
        fetch('/api/categories/', { headers }),
      ])

      if (tasksRes.status === 401 || categoriesRes.status === 401) {
        setTasks([])
        setCategories([])
        setLoading(false)
        return
      }

      if (!tasksRes.ok) {
        throw new Error('Failed to fetch tasks from server')
      }
      if (!categoriesRes.ok) {
        throw new Error('Failed to fetch categories from server')
      }

      const [tasksData, categoriesData] = await Promise.all([
        tasksRes.json(),
        categoriesRes.json(),
      ])

      setTasks(tasksData)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Error fetching data from API:', err)
      setError(err.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [token])

  // Fetch task activities from Django backend
  const fetchTaskActivities = useCallback(async () => {
    if (!token) {
      setTaskActivities([])
      setActivitiesLoading(false)
      return
    }

    setActivitiesLoading(true)
    setActivitiesError(null)

    try {
      const res = await fetch('/api/task-activities/', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      })

      if (res.status === 401) {
        setTaskActivities([])
        setActivitiesLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch task activities from server')
      }

      const data = await res.json()
      setTaskActivities(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching task activities:', err)
      setActivitiesError(err.message || 'Error loading activities')
    } finally {
      setActivitiesLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchTasksAndCategories()
      fetchTaskActivities()
    } else {
      setTasks([])
      setCategories([])
      setTaskActivities([])
      setLoading(false)
      setActivitiesLoading(false)
    }
  }, [token, fetchTasksAndCategories, fetchTaskActivities])

  // Task Actions
  const addTask = async ({ title, description, priority, category, dueDate }) => {
    if (!token) return null
    try {
      const payload = {
        title: title.trim(),
        description: (description || '').trim(),
        priority: priority || 'Medium',
        dueDate: dueDate || getTodayDateStr(),
        category: category ? (typeof category === 'object' ? category.id : Number(category) || null) : null,
      }

      const res = await fetch('/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMsg =
          errorData.title?.[0] ||
          errorData.category?.[0] ||
          errorData.priority?.[0] ||
          errorData.due_date?.[0] ||
          errorData.detail ||
          'Failed to create task.'
        throw new Error(errorMsg)
      }

      const newTask = await res.json()
      setTasks(prev => [newTask, ...prev])
      if (newTask.completed) {
        fetchTaskActivities()
      }
      return newTask
    } catch (err) {
      console.error('Error in addTask:', err)
      throw err
    }
  }

  const updateTask = async (id, updatedFields) => {
    if (!token) return null
    try {
      const payload = { ...updatedFields }
      if ('category' in payload) {
        payload.category = payload.category
          ? (typeof payload.category === 'object' ? payload.category.id : Number(payload.category) || null)
          : null
      }

      const res = await fetch(`/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMsg =
          errorData.title?.[0] ||
          errorData.category?.[0] ||
          errorData.priority?.[0] ||
          errorData.detail ||
          'Failed to update task.'
        throw new Error(errorMsg)
      }

      const updatedTask = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
      if (updatedFields && updatedFields.completed) {
        fetchTaskActivities()
      }
      return updatedTask
    } catch (err) {
      console.error('Error in updateTask:', err)
      throw err
    }
  }

  const deleteTask = async (id) => {
    if (!token) return
    try {
      const res = await fetch(`/api/tasks/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (!res.ok && res.status !== 204 && res.status !== 404) {
        throw new Error('Failed to delete task from server')
      }

      setTasks(prev => prev.filter(task => task.id !== id))
      setTaskActivities(prev => prev.filter(activity => activity.task !== id))
      if (taskToEdit?.id === id) setIsEditModalOpen(false)
      if (taskToView?.id === id) setIsDetailsModalOpen(false)
      fetchTaskActivities()
    } catch (err) {
      console.error('Error in deleteTask:', err)
      throw err
    }
  }

  const toggleTaskComplete = async (id) => {
    if (!token) return
    const currentTask = tasks.find(t => t.id === id)
    if (!currentTask) return

    const newCompleted = !currentTask.completed
    try {
      const res = await fetch(`/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ completed: newCompleted }),
      })

      if (!res.ok) {
        throw new Error('Failed to update task completion status')
      }

      const updatedTask = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))
      if (newCompleted) {
        fetchTaskActivities()
      }
    } catch (err) {
      console.error('Error in toggleTaskComplete:', err)
      throw err
    }
  }

  // Category Actions
  const addCategory = async (name) => {
    if (!token) return null
    const trimmed = (name || '').trim()
    if (!trimmed) {
      throw new Error('Category name cannot be blank.')
    }

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('A category with this name already exists.')
    }

    const res = await fetch('/api/categories/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ name: trimmed }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errorMsg = data.name?.[0] || data.detail || 'Failed to create category.'
      throw new Error(errorMsg)
    }

    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const deleteCategory = async (id) => {
    if (!token) return
    const res = await fetch(`/api/categories/${id}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Failed to delete category.')
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    // Update tasks state locally: category set to null
    setTasks(prev =>
      prev.map(t => {
        if (t.category === id) {
          return { ...t, category: null, category_name: null }
        }
        return t
      })
    )
  }

  // Modal Triggers
  const openAddModal = (defaultCategoryOrOptions = null, defaultDueDate = null) => {
    if (
      defaultCategoryOrOptions &&
      typeof defaultCategoryOrOptions === 'object' &&
      !Array.isArray(defaultCategoryOrOptions) &&
      ('dueDate' in defaultCategoryOrOptions || 'category' in defaultCategoryOrOptions)
    ) {
      setAddModalDefaultCategory(defaultCategoryOrOptions.category || null)
      setAddModalDefaultDueDate(defaultCategoryOrOptions.dueDate || null)
    } else {
      setAddModalDefaultCategory(defaultCategoryOrOptions)
      setAddModalDefaultDueDate(defaultDueDate)
    }
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setAddModalDefaultCategory(null)
    setAddModalDefaultDueDate(null)
  }

  const openEditModal = (task) => {
    setTaskToEdit(task)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setTaskToEdit(null)
  }

  const openDetailsModal = (task) => {
    setTaskToView(task)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setTaskToView(null)
  }

  const openConfirm = ({ title, message, confirmText, confirmVariant, onConfirm }) => {
    setConfirmConfig({
      isOpen: true,
      title: title || 'Are you sure?',
      message: message || 'This action cannot be undone.',
      confirmText: confirmText || 'Confirm',
      confirmVariant: confirmVariant || 'danger',
      onConfirm: async () => {
        try {
          await onConfirm()
        } finally {
          closeConfirm()
        }
      },
    })
  }

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('All')
    setPriorityFilter('All')
    setCategoryFilter('All')
  }

  // Computed metrics for Today
  const todayTasks = useMemo(() => {
    const todayStr = getTodayDateStr()
    return tasks.filter(t => {
      const dateVal = getTaskDateStr(t)
      return dateVal === todayStr
    })
  }, [tasks])

  const todayCompletedCount = useMemo(() => {
    return todayTasks.filter(t => Boolean(t.completed)).length
  }, [todayTasks])

  const todayRemainingCount = useMemo(() => {
    return todayTasks.filter(t => !t.completed).length
  }, [todayTasks])

  const todayTotalCount = todayTasks.length
  const todayCompletionRate =
    todayTotalCount === 0 ? 0 : Math.round((todayCompletedCount / todayTotalCount) * 100)

  const value = {
    tasks,
    categories,
    taskActivities,
    loading,
    error,
    activitiesLoading,
    activitiesError,
    todayTasks,
    todayTotalCount,
    todayCompletedCount,
    todayRemainingCount,
    todayCompletionRate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    resetFilters,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addCategory,
    deleteCategory,
    fetchTasksAndCategories,
    fetchTaskActivities,
    // Modals
    isAddModalOpen,
    addModalDefaultCategory,
    addModalDefaultDueDate,
    openAddModal,
    closeAddModal,
    isEditModalOpen,
    taskToEdit,
    openEditModal,
    closeEditModal,
    isDetailsModalOpen,
    taskToView,
    openDetailsModal,
    closeDetailsModal,
    confirmConfig,
    openConfirm,
    closeConfirm,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}

