import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '@web/components/ui/Card'
import { useAuthStore } from '@web/stores/auth.store'
import type { AuthResponse } from '@starter/shared'

export const OAuthCallbackPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError(t('auth.oauthTokenMissing'))
      return
    }

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          const json = await res.json().catch(() => null)
          setError(json?.error?.message || t('auth.oauthFailed'))
          return
        }

        const json = await res.json()
        const user = json.data as AuthResponse['user']
        setAuth(token, user)
        navigate('/dashboard', { replace: true })
      } catch {
        setError(t('auth.oauthFailed'))
      }
    }

    fetchUser()
  }, [token, setAuth, navigate, t])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <div className="bg-error/10 text-error mb-4 rounded-lg p-3 text-sm">{error}</div>
          <a href="/login" className="text-accent text-sm hover:underline">
            {t('auth.backToLogin')}
          </a>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="border-accent h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-text-secondary text-sm">{t('auth.oauthProcessing')}</p>
        </div>
      </Card>
    </div>
  )
}
