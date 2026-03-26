import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { registerSchema } from '@starter/shared'
import { GitBranch, Mail } from 'lucide-react'
import { Button } from '@web/components/ui/Button'
import { Input } from '@web/components/ui/Input'
import { Label } from '@web/components/ui/Label'
import { Card } from '@web/components/ui/Card'
import { api, type ApiError } from '@web/lib/api'
import { useAuthStore } from '@web/stores/auth.store'
import type { AuthResponse } from '@starter/shared'

export const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const redirectTo = (location.state as { from?: string })?.from ?? '/dashboard'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setApiError('')

    const result = registerSchema.safeParse({ email, password, displayName })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (field) fieldErrors[String(field)] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const data = await api.post<AuthResponse>('/api/v1/auth/register', {
        email,
        password,
        displayName,
      })
      setAuth(data.accessToken, data.user)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setApiError((err as ApiError).message || t('auth.registerFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-text-primary mb-6 text-2xl font-bold">{t('auth.register')}</h1>

        {apiError ? (
          <div className="bg-error/10 text-error mb-4 rounded-lg p-3 text-sm">{apiError}</div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="displayName">{t('auth.displayName')}</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              placeholder={t('auth.displayNamePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('auth.submit')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="bg-border h-px flex-1" />
          <span className="text-text-muted text-xs">{t('auth.loginWith')}</span>
          <div className="bg-border h-px flex-1" />
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              window.location.href = '/api/v1/auth/github'
            }}
          >
            <GitBranch className="mr-2 h-4 w-4" />
            {t('auth.github')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              window.location.href = '/api/v1/auth/google'
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            {t('auth.google')}
          </Button>
        </div>

        <p className="text-text-secondary mt-6 text-center text-sm">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-accent hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </Card>
    </div>
  )
}
