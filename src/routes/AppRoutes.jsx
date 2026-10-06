import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyEmail from '../pages/VerifyEmail'
import Dashboard from '../pages/Dashboard'
import MyDay from '../pages/MyDay'
import Upcoming from '../pages/Upcoming'
import Completed from '../pages/Completed'
import Category from '../pages/Category'
import Settings from '../pages/Settings'
import Calendar from '../pages/Calendar'
import Expenses from '../pages/Expenses'
import ExpenseHistory from '../pages/ExpenseHistory'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-day" element={<MyDay />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/history" element={<ExpenseHistory />} />
          <Route path="/completed" element={<Completed />} />
          <Route path="/categories" element={<Category />} />
          <Route path="/categories/:idOrName" element={<Category />} />
          <Route path="/lists" element={<Category />} />
          <Route path="/lists/:listName" element={<Category />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
