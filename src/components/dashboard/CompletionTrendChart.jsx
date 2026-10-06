import { useState, useMemo } from 'react'
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'

export default function CompletionTrendChart() {
  const { taskActivities, activitiesLoading, activitiesError } = useTasks()
  const [hoveredIdx, setHoveredIdx] = useState(null)

  // 1. Calculate 7 local calendar days ending today
  const trendData = useMemo(() => {
    const points = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}` // Local YYYY-MM-DD

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const count = (taskActivities || []).filter(
        (a) => a.activity_type === 'COMPLETED' && a.activity_date === dateStr
      ).length

      points.push({
        date: dateLabel,
        fullDate: dateStr,
        dayName: dayLabel,
        completed: count,
        isToday: i === 0,
      })
    }

    return points
  }, [taskActivities])

  const total7Days = useMemo(() => {
    return trendData.reduce((acc, p) => acc + p.completed, 0)
  }, [trendData])

  const peakPoint = useMemo(() => {
    let peak = trendData[0]
    for (const p of trendData) {
      if (p.completed > peak.completed) peak = p
    }
    return peak
  }, [trendData])

  // SVG Geometry Dimensions
  const svgWidth = 700
  const svgHeight = 220
  const paddingLeft = 45
  const paddingRight = 35
  const paddingTop = 25
  const paddingBottom = 45

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  // Y-Scale ceiling (minimum 4 to provide a clean grid even if 0 tasks completed)
  const maxVal = Math.max(...trendData.map((d) => d.completed), 0)
  const maxY = Math.max(maxVal, 4)

  // Calculate coordinates
  const points = useMemo(() => {
    return trendData.map((d, i) => {
      const x = paddingLeft + i * (chartWidth / (trendData.length - 1))
      const y = paddingTop + (1 - d.completed / maxY) * chartHeight
      return { ...d, x, y, index: i }
    })
  }, [trendData, chartWidth, chartHeight, paddingLeft, paddingTop, maxY])

  // Build curved line path (Smooth Catmull-Rom / Bezier interpolation)
  const linePath = useMemo(() => {
    if (points.length === 0) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    return d
  }, [points])

  // Area path for gradient fill
  const areaPath = useMemo(() => {
    if (points.length === 0) return ''
    const baselineY = paddingTop + chartHeight
    return `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
  }, [linePath, points, paddingTop, chartHeight])

  // Y-axis grid ticks (e.g. 0, maxY/2, maxY)
  const yTicks = [0, Math.round(maxY / 2), maxY]

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null

  // Clamp tooltip left position so it never overflows screen edge
  const tooltipLeftPercent = activePoint
    ? Math.max(16, Math.min(84, (activePoint.x / svgWidth) * 100))
    : 50

  return (
    <div className="bg-[#0D1326] p-4 sm:p-6 rounded-xl border border-slate-800/80 shadow-sm overflow-hidden">
      {/* Header with responsive wrapping */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#7C5CFF] flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold text-white">Completion Trend</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Tasks completed over the last 7 days
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <span className="text-[11px] sm:text-xs font-medium text-slate-300 bg-[#11182D] px-2.5 py-1 rounded-lg border border-slate-700/80">
            <strong className="text-white">{total7Days}</strong> completed (7d)
          </span>
          {peakPoint && peakPoint.completed > 0 && (
            <span className="text-[11px] sm:text-xs font-medium text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Peak: <strong className="text-emerald-300">{peakPoint.completed}</strong> ({peakPoint.dayName})
            </span>
          )}
        </div>
      </div>

      {/* Non-blocking Activities Error Alert */}
      {activitiesError && (
        <div className="mb-4 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Unable to sync latest trend data: {activitiesError}</span>
        </div>
      )}

      {/* Loading state skeleton */}
      {activitiesLoading && (!taskActivities || taskActivities.length === 0) ? (
        <div className="h-48 sm:h-56 lg:h-64 flex flex-col items-center justify-center text-xs text-slate-500 animate-pulse">
          Loading trend graph...
        </div>
      ) : (
        <div className="relative">
          {/* Responsive SVG Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 lg:h-64 overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Gradient for area fill under the line */}
                <linearGradient id="trendGradientDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((val) => {
                const yPos = paddingTop + (1 - val / maxY) * chartHeight
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={paddingLeft + chartWidth}
                      y2={yPos}
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={yPos + 3.5}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-mono font-medium"
                    >
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill="url(#trendGradientDark)" />

              {/* Smooth Trend Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#7C5CFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover vertical guide line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={paddingTop}
                  x2={activePoint.x}
                  y2={paddingTop + chartHeight}
                  stroke="#A78BFA"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data Points */}
              {points.map((p) => {
                const isHovered = hoveredIdx === p.index
                return (
                  <g
                    key={p.fullDate}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(p.index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(hoveredIdx === p.index ? null : p.index)}
                  >
                    {/* Invisible larger touch target circle for mobile (24px radius) */}
                    <circle cx={p.x} cy={p.y} r="24" fill="transparent" />

                    {/* Outer pulse when hovered/selected */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="9"
                        fill="#7C5CFF"
                        fillOpacity="0.35"
                      />
                    )}

                    {/* Point Circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? "5.5" : p.isToday ? "4.5" : "3.5"}
                      fill={p.isToday ? "#7C5CFF" : "#0D1326"}
                      stroke="#7C5CFF"
                      strokeWidth={p.isToday ? "2.5" : "2"}
                      className="transition-all duration-150"
                    />

                    {/* X-axis date labels */}
                    <text
                      x={p.x}
                      y={paddingTop + chartHeight + 18}
                      textAnchor="middle"
                      className={`text-[10px] sm:text-[11px] font-medium ${
                        p.isToday ? 'fill-[#7C5CFF] font-bold' : 'fill-slate-300'
                      }`}
                    >
                      {p.date}
                    </text>
                    <text
                      x={p.x}
                      y={paddingTop + chartHeight + 30}
                      textAnchor="middle"
                      className={`text-[9px] sm:text-[9.5px] ${
                        p.isToday ? 'fill-[#A78BFA] font-semibold' : 'fill-slate-500'
                      }`}
                    >
                      {p.isToday ? 'Today' : p.dayName}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Interactive Floating Tooltip (Clamped to prevent overflow) */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-100 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${tooltipLeftPercent}%`,
                top: `${(activePoint.y / svgHeight) * 100 - 10}%`,
              }}
            >
              <div className="bg-[#151C35] text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {activePoint.completed} {activePoint.completed === 1 ? 'task' : 'tasks'} completed
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {activePoint.dayName}, {activePoint.date}
                  {activePoint.isToday && ' (Today)'}
                </div>
              </div>
            </div>
          )}

          {/* Empty state notice inside the graph if zero completed in last 7 days */}
          {total7Days === 0 && (
            <div className="mt-3 p-3 rounded-lg bg-[#070B1A]/80 border border-slate-800 text-center">
              <p className="text-xs font-medium text-slate-300">
                No completed tasks in the last 7 days
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complete a task to start building your progress.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
