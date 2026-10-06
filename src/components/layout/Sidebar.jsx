import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sun,
  CalendarDays,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Settings,
  LogOut,
  Plus,
  Folder,
  Receipt,
} from 'lucide-react'
import { useTasks, TODAY_DATE_STR } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ onItemClick }) {
  const navigate = useNavigate()
  const { tasks, openAddModal, openConfirm, categories } = useTasks()
  const { user, logout } = useAuth()

  // Calculate dynamic badge counts
  const myDayCount = tasks.filter(
    (t) => (t.dueDate || (t.due_date ? t.due_date.split('T')[0] : null)) === TODAY_DATE_STR && !t.completed
  ).length
  const upcomingCount = tasks.filter(
    (t) => (t.dueDate || (t.due_date ? t.due_date.split('T')[0] : null)) > TODAY_DATE_STR && !t.completed
  ).length
  const completedCount = tasks.filter((t) => t.completed).length

  const getCategoryCount = (catId, catName) =>
    tasks.filter((t) => {
      if (t.completed) return false
      if (t.category === catId) return true
      if (t.category_name && t.category_name.toLowerCase() === catName.toLowerCase()) return true
      return false
    }).length

  const mainNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-day', label: 'My Day', icon: Sun, count: myDayCount },
    { to: '/upcoming', label: 'Upcoming', icon: CalendarDays, count: upcomingCount },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/completed', label: 'Completed', icon: CheckCircle2, count: completedCount },
    { to: '/categories', label: 'Categories', icon: FolderKanban, count: categories.length },
  ]


  const handleLogout = () => {
    openConfirm({
      title: 'Log out of FocusFlow',
      message: 'Are you sure you want to log out of your FocusFlow account?',
      confirmText: 'Log Out',
      confirmVariant: 'danger',
      onConfirm: () => {
        logout()
        navigate('/login')
      },
    })
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3 py-2.5 min-h-[42px] rounded-lg text-xs font-medium transition-all group ${
      isActive
        ? 'bg-[#7C5CFF]/15 text-[#F8FAFC] border border-[#7C5CFF]/30 font-semibold shadow-[0_0_12px_rgba(124,92,255,0.15)]'
        : 'text-slate-400 hover:text-slate-100 hover:bg-[#11182D] border border-transparent'
    }`

  return (
    <aside className="w-full md:w-64 h-full bg-[#090E23] md:border-r border-slate-800/80 flex flex-col justify-between select-none">
      {/* Top section: Logo & Nav */}
      <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] flex items-center justify-center text-white shadow-[0_0_15px_rgba(108,77,246,0.35)] flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white leading-none block">
                Focus<span className="text-[#7C5CFF]">Flow</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Productivity OS
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Task Button */}
        <button
          type="button"
          onClick={() => {
            if (onItemClick) onItemClick()
            openAddModal()
          }}
          className="w-full mb-5 min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-lg shadow-[0_0_15px_rgba(108,77,246,0.25)] hover:shadow-[0_0_20px_rgba(108,77,246,0.35)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={navLinkClass}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7C5CFF]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${isActive ? 'bg-[#7C5CFF]/30 text-white' : 'bg-[#151C35] text-slate-400 border border-slate-800'}`}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Lists / Categories */}
        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Lists
            </span>
            <NavLink
              to="/categories"
              onClick={onItemClick}
              className="text-[10px] text-[#7C5CFF] hover:text-[#94A3B8] font-medium transition-colors"
            >
              Manage
            </NavLink>
          </div>
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500 italic">
              No categories yet
            </div>
          ) : (
            categories.map((cat) => {
              const count = getCategoryCount(cat.id, cat.name)
              return (
                <NavLink
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  onClick={onItemClick}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#7C5CFF]' : 'text-slate-400 group-hover:text-[#7C5CFF]'}`} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {count > 0 && (
                        <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md flex-shrink-0 ${isActive ? 'bg-[#7C5CFF]/30 text-white' : 'bg-[#151C35] text-slate-400 border border-slate-800'}`}>
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })
          )}
        </div>
      </div>

      {/* Bottom section: Settings & Logout & Profile */}
      <div className="p-4 border-t border-slate-800/80 space-y-1 bg-[#070B1A]/60 flex-shrink-0">
        <NavLink to="/settings" onClick={onItemClick} className={navLinkClass}>
          {({ isActive }) => (
            <div className="flex items-center gap-2.5">
              <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-[#7C5CFF]' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span>Settings</span>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => {
            if (onItemClick) onItemClick()
            handleLogout()
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 min-h-[42px] rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </div>
        </button>

        {/* User Mini Profile */}
        <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]/30 font-semibold text-xs flex items-center justify-center uppercase flex-shrink-0">
            {user?.username ? user.username.slice(0, 2) : 'FF'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate leading-none">
              {user?.username || 'FocusFlow User'}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-1">
              {user?.email || 'user@focusflow.app'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
