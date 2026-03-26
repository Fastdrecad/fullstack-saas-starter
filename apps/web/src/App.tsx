import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@web/features/auth/LoginPage'
import { RegisterPage } from '@web/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@web/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@web/features/auth/ResetPasswordPage'
import { OAuthCallbackPage } from '@web/features/auth/OAuthCallbackPage'
import { SettingsPage } from '@web/features/settings/SettingsPage'
import { useAuthStore } from '@web/stores/auth.store'
import { initAuth } from '@web/lib/api'

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export const App = () => {
  useEffect(() => {
    initAuth()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public-only routes (redirect to dashboard if logged in) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/auth/error"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const DashboardPlaceholder = () => {
  const { user, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
    clearAuth()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-text-primary text-lg">Welcome, {user?.displayName}</p>
      <p className="text-text-secondary text-sm">Dashboard coming soon.</p>
      <button onClick={handleLogout} className="text-accent cursor-pointer text-sm hover:underline">
        Log out
      </button>
    </div>
  )
}
