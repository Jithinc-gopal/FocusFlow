import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import AddTaskModal from '../modals/AddTaskModal'
import EditTaskModal from '../modals/EditTaskModal'
import TaskDetailsModal from '../modals/TaskDetailsModal'
import ConfirmDialog from '../modals/ConfirmDialog'

export default function AppLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#070B1A] text-slate-100">
      {/* Desktop Sidebar (hidden on mobile/tablet < md) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Top Navigation + Slide-out Drawer (hidden on >= md) */}
      <MobileNav />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col">
        <div className="flex-1 max-w-6xl w-full mx-auto p-3.5 xs:p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Global Modals */}
      <AddTaskModal />
      <EditTaskModal />
      <TaskDetailsModal />
      <ConfirmDialog />
    </div>
  )
}
