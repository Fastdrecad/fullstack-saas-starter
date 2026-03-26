import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgotPasswordSchema } from '@starter/shared'
import { Button } from '@web/components/ui/Button'
import { Input } from '@web/components/ui/Input'
import { Label } from '@web/components/ui/Label'
import { Card } from '@web/components/ui/Card'
import { api, type ApiError } from '@web/lib/api'

export const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setApiError('')

    const result = forgotPasswordSchema.safeParse({ email })
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
      await api.post('/api/v1/auth/forgot-password', { email })
      setIsSuccess(true)
    } catch (err) {
      setApiError((err as ApiError).message || t('auth.forgotPasswordFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-text-primary mb-2 text-2xl font-bold">{t('auth.forgotPassword')}</h1>
        <p className="text-text-secondary mb-6 text-sm">{t('auth.forgotPasswordDescription')}</p>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="bg-success/10 text-success rounded-lg p-3 text-sm">
              {t('auth.forgotPasswordSuccess')}
            </div>
            <Link to="/login" className="text-accent block text-center text-sm hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            {apiError ? (
              <div className="bg-error/10 text-error mb-4 rounded-lg p-3 text-sm">{apiError}</div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('auth.sendResetLink')}
              </Button>
            </form>

            <p className="text-text-secondary mt-6 text-center text-sm">
              <Link to="/login" className="text-accent hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
