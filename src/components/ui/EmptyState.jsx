import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No tasks found',
  description = 'There are no tasks matching your current criteria.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0D1326]/60 backdrop-blur-xs">
      <div className="w-12 h-12 rounded-2xl bg-[#151C35] border border-slate-800 flex items-center justify-center text-slate-400 mb-3.5 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-xl shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer min-h-[40px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
