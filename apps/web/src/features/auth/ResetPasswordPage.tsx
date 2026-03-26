import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { passwordSchema } from '@starter/shared'
import { Button } from '@web/components/ui/Button'
import { Input } from '@web/components/ui/Input'
import { Label } from '@web/components/ui/Label'
import { Card } from '@web/components/ui/Card'
import { api, type ApiError } from '@web/lib/api'

export const ResetPasswordPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setApiError('')

    const result = passwordSchema.safeParse(newPassword)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors.newPassword = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      await api.post('/api/v1/auth/reset-password', { token, newPassword })
      setIsSuccess(true)
    } catch (err) {
      setApiError((err as ApiError).message || t('auth.resetPasswordFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <div className="bg-error/10 text-error rounded-lg p-3 text-sm">
            {t('auth.invalidResetToken')}
          </div>
          <p className="text-text-secondary mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-accent hover:underline">
              {t('auth.requestNewResetLink')}
            </Link>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-text-primary mb-6 text-2xl font-bold">{t('auth.resetPassword')}</h1>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="bg-success/10 text-success rounded-lg p-3 text-sm">
              {t('auth.resetPasswordSuccess')}
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
                <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={errors.newPassword}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('auth.resetPassword')}
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
