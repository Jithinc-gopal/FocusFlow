export default function PriorityBadge({ priority, size = 'sm' }) {
  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : 'text-xs px-2.5 py-1'

  const normalized = (() => {
    if (!priority) return 'Medium'
    const p = String(priority).toUpperCase()
    if (p === 'HIGH') return 'High'
    if (p === 'LOW') return 'Low'
    return 'Medium'
  })()

  const variants = {
    High: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  }

  const dotColors = {
    High: 'bg-rose-400',
    Medium: 'bg-amber-400',
    Low: 'bg-slate-400',
  }

  const currentVariant = variants[normalized]
  const currentDot = dotColors[normalized]

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${currentVariant} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      {normalized}
    </span>
  )
}
