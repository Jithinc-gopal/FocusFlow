import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTasks } from '../../context/TaskContext'

export default function SearchFilterBar({ showCategoryFilter = true }) {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    resetFilters,
    categories,
  } = useTasks()

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

  const isFiltered =
    searchQuery !== '' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    (showCategoryFilter && categoryFilter !== 'All')

  return (
    <div className="bg-[#0D1326] p-3 sm:p-4 rounded-xl border border-slate-800/80 space-y-3">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or description..."
            aria-label="Search tasks by title or description"
            className="w-full pl-9 pr-8 py-2.5 sm:py-2 text-sm bg-[#070B1A] hover:bg-[#070B1A]/80 focus:bg-[#070B1A] border border-slate-800 focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 rounded-lg outline-none transition-all text-slate-100 placeholder:text-slate-500 min-h-[40px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          aria-expanded={isFiltersExpanded}
          aria-label="Toggle filter selectors"
          className={`sm:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer min-h-[40px] shrink-0 ${
            isFiltered
              ? 'bg-[#7C5CFF]/15 text-[#7C5CFF] border-[#7C5CFF]/30'
              : 'bg-[#11182D] text-slate-300 border-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF]" />}
        </button>
      </div>

      {/* Filter Selectors (Desktop always visible, Mobile expandable) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 ${
          isFiltersExpanded ? 'grid' : 'hidden sm:grid'
        }`}
      >
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter-select" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter tasks by status"
            className="w-full text-xs font-medium py-2 sm:py-1.5 px-2.5 bg-[#070B1A] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-[#7C5CFF] cursor-pointer min-h-[38px]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label htmlFor="priority-filter-select" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Priority
          </label>
          <select
            id="priority-filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter tasks by priority"
            className="w-full text-xs font-medium py-2 sm:py-1.5 px-2.5 bg-[#070B1A] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-[#7C5CFF] cursor-pointer min-h-[38px]"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        {showCategoryFilter ? (
          <div>
            <label htmlFor="category-filter-select" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              id="category-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter tasks by category"
              className="w-full text-xs font-medium py-2 sm:py-1.5 px-2.5 bg-[#070B1A] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-[#7C5CFF] cursor-pointer min-h-[38px]"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      {/* Active Filter Indicator & Reset */}
      {isFiltered && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>Filtering applied</span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#7C5CFF] hover:text-[#94A3B8] font-medium transition-colors cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  )
}
