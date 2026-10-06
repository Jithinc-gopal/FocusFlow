import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'

export default function ConfirmDialog() {
  const { confirmConfig, closeConfirm } = useTasks()

  // Close on Escape key press
  useEffect(() => {
    if (!confirmConfig.isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmConfig.isOpen, closeConfirm])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (confirmConfig.isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [confirmConfig.isOpen])

  if (!confirmConfig.isOpen) return null

  const isDanger = confirmConfig.confirmVariant === 'danger'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-md bg-[#0D1326] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDanger
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 id="confirm-title" className="text-base font-semibold text-white mb-1">
                {confirmConfig.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">
                {confirmConfig.message}
              </p>
            </div>

            <button
              type="button"
              onClick={closeConfirm}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors cursor-pointer -mr-1.5 -mt-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 mt-5 sm:mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={closeConfirm}
              className="w-full xs:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#151C35] hover:bg-[#1a2342] border border-slate-700/80 rounded-lg transition-colors cursor-pointer min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmConfig.onConfirm}
              className={`w-full xs:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-white rounded-lg shadow-xs transition-colors cursor-pointer min-h-[40px] flex items-center justify-center ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6]'
              }`}
            >
              {confirmConfig.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
