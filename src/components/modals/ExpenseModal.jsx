import { useState, useEffect } from 'react'
import { X, Receipt, IndianRupee } from 'lucide-react'
import { getTodayDateStr } from '../../context/TaskContext'

export default function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit = null }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(getTodayDateStr())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(expenseToEdit)

  // Sync state when opening or when expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setDescription(expenseToEdit.description || '')
        setAmount(expenseToEdit.amount ? String(expenseToEdit.amount) : '')
        setExpenseDate(expenseToEdit.expense_date || expenseToEdit.expenseDate || getTodayDateStr())
      } else {
        setDescription('')
        setAmount('')
        setExpenseDate(getTodayDateStr())
      }
      setError('')
    }
  }, [isOpen, expenseToEdit])

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll while modal is mounted
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedDesc = description.trim()
    if (!trimmedDesc) {
      setError('Please provide a description.')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a valid number greater than 0.')
      return
    }

    if (!expenseDate) {
      setError('Please select an expense date.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await onSave({
        description: trimmedDesc,
        amount: numAmount.toFixed(2),
        expense_date: expenseDate,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save expense.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D1326] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-expense-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#070B1A]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-expense-title" className="text-sm sm:text-base font-semibold text-white leading-none">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditing ? 'Update your expense record' : 'Record a new daily expense'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl">
              {error}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. Lunch, Petrol, Groceries, Coffee"
              className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all min-h-[42px]"
            />
          </div>

          {/* Amount & Date in 2-column or stacked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4 text-[#7C5CFF]" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 placeholder:text-slate-500 rounded-xl outline-none transition-all min-h-[42px]"
                />
              </div>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Expense Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => {
                    setExpenseDate(e.target.value)
                    if (error) setError('')
                  }}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-sm bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 text-slate-100 rounded-xl outline-none transition-all min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-xl transition-colors cursor-pointer min-h-[42px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.3)] transition-all cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center justify-center"
            >
              {submitting
                ? isEditing
                  ? 'Saving...'
                  : 'Adding...'
                : isEditing
                ? 'Save Changes'
                : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
