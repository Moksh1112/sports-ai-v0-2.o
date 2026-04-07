'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  user_id: string
  username: string
  email: string
  full_name?: string
  role: 'user' | 'coach'
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, fullName?: string, role?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isCoach: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('[v0] Failed to restore session:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      setToken(data.token)
      setUser({
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'user',
      })

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify({
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'user',
      }))
    } catch (error) {
      throw error
    }
  }

  const register = async (username: string, email: string, password: string, fullName?: string, role?: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name: fullName, role: role || 'user' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()

      setToken(data.token)
      setUser({
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'user',
      })

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify({
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role || 'user',
      }))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user && !!token,
      isCoach: user?.role === 'coach',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
