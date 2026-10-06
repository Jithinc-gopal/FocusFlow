import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'focusflow_token'
const USER_KEY = 'focusflow_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = (authToken, authUser) => {
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
