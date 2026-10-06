import { useState, useEffect, useCallback } from 'react'
import { Menu, X, Plus, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTasks } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'

export default function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { openAddModal } = useTasks()
  const { user } = useAuth()

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  // Close on Escape key press
  useEffect(() => {
    if (!drawerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen, closeDrawer])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 xs:px-4 h-14 bg-[#090E23] border-b border-slate-800/80 md:hidden flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Hamburger Menu Button with 44px touch target */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="w-11 h-11 -ml-1 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-[#11182D] active:bg-[#151C35] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 min-w-0" onClick={closeDrawer}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#7C5CFF] flex items-center justify-center text-white shadow-[0_0_12px_rgba(108,77,246,0.35)] flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-base font-bold tracking-tight text-white truncate">
              Focus<span className="text-[#7C5CFF]">Flow</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Add Task Button */}
          <button
            type="button"
            onClick={() => openAddModal()}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#6366F1] to-[#7C5CFF] hover:from-[#4F46E5] hover:to-[#6C4DF6] rounded-lg shadow-[0_0_12px_rgba(108,77,246,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          {/* User Profile Link */}
          <Link
            to="/settings"
            aria-label="User Settings"
            className="w-9 h-9 rounded-full bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]/30 font-semibold text-xs flex items-center justify-center uppercase hover:bg-[#7C5CFF]/30 transition-colors"
          >
            {user?.username ? user.username.slice(0, 2) : 'FF'}
          </Link>
        </div>
      </header>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer Content Container */}
          <div className="relative w-[85vw] max-w-[300px] bg-[#090E23] border-r border-slate-800/80 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Close Button with 44px touch target */}
            <div className="absolute right-2 top-2 z-20">
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-[#11182D] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-full overflow-hidden flex flex-col pt-2">
              <Sidebar onItemClick={closeDrawer} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
