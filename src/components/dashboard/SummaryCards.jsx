import { CheckCircle2, CircleDashed, ListTodo, TrendingUp } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'

export default function SummaryCards() {
  const {
    todayTotalCount,
    todayCompletedCount,
    todayRemainingCount,
    todayCompletionRate,
  } = useTasks()

  const cards = [
    {
      label: "Today's Tasks",
      value: todayTotalCount,
      subtext: 'Scheduled for today',
      icon: ListTodo,
      iconColor: 'text-[#7C5CFF]',
      iconBg: 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/25',
      borderAccent: 'hover:border-[#7C5CFF]/40',
    },
    {
      label: 'Completed',
      value: todayCompletedCount,
      subtext: `${todayCompletedCount} finished today`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border border-emerald-500/25',
      borderAccent: 'hover:border-emerald-500/40',
    },
    {
      label: 'Remaining',
      value: todayRemainingCount,
      subtext: 'Pending completion',
      icon: CircleDashed,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border border-amber-500/25',
      borderAccent: 'hover:border-amber-500/40',
    },
    {
      label: 'Completion Rate',
      value: `${todayCompletionRate}%`,
      subtext: todayCompletionRate >= 75 ? 'Outstanding progress!' : 'Keep momentum going',
      icon: TrendingUp,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/15 border border-blue-500/25',
      borderAccent: 'hover:border-blue-500/40',
      isRate: true,
      rateValue: todayCompletionRate,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className={`bg-[#0D1326] p-3.5 sm:p-5 rounded-xl border border-slate-800/80 shadow-sm transition-all duration-150 hover:bg-[#11182D] ${card.borderAccent}`}
          >
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase truncate">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor} flex-shrink-0 ml-2`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {card.value}
              </span>
            </div>

            {card.isRate ? (
              <div className="mt-2.5 sm:mt-3">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(124,92,255,0.4)]"
                    style={{ width: `${Math.min(100, Math.max(0, card.rateValue))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 truncate">{card.subtext}</p>
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">{card.subtext}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
