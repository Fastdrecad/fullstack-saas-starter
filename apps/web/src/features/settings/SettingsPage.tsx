import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Mail, Trash2 } from 'lucide-react'
import { Button } from '@web/components/ui/Button'
import { Card } from '@web/components/ui/Card'
import { api, type ApiError } from '@web/lib/api'
import { useAuthStore } from '@web/stores/auth.store'

type OAuthAccount = {
  provider: string
  email: string
  createdAt: string
}

const PROVIDER_ICONS: Record<string, typeof GitBranch> = {
  github: GitBranch,
  google: Mail,
}

export const SettingsPage = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [accounts, setAccounts] = useState<OAuthAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlinking, setUnlinking] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await api.get<OAuthAccount[]>('/api/v1/users/me/oauth')
        setAccounts(data)
      } catch {
        setError(t('settings.loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [t])

  const handleUnlink = async (provider: string) => {
    setUnlinking(provider)
    setError('')
    try {
      await api.delete(`/api/v1/users/me/oauth/${provider}`)
      setAccounts((prev) => prev.filter((a) => a.provider !== provider))
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setUnlinking(null)
    }
  }

  const handleLink = (provider: string) => {
    window.location.href = `/api/v1/auth/${provider}`
  }

  const linkedProviders = new Set(accounts.map((a) => a.provider))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-text-primary mb-6 text-2xl font-bold">{t('settings.title')}</h1>

      <Card>
        <h2 className="text-text-primary mb-1 text-lg font-semibold">{t('settings.profile')}</h2>
        <p className="text-text-secondary mb-4 text-sm">{user?.email}</p>

        <h2 className="text-text-primary mb-3 mt-6 text-lg font-semibold">
          {t('settings.linkedAccounts')}
        </h2>

        {error ? (
          <div className="bg-error/10 text-error mb-4 rounded-lg p-3 text-sm">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="text-text-muted py-4 text-sm">{t('auth.loading')}</div>
        ) : (
          <div className="space-y-3">
            {(['github', 'google'] as const).map((provider) => {
              const Icon = PROVIDER_ICONS[provider] ?? Mail
              const isLinked = linkedProviders.has(provider)
              const account = accounts.find((a) => a.provider === provider)

              return (
                <div
                  key={provider}
                  className="border-border flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-text-secondary h-5 w-5" />
                    <div>
                      <p className="text-text-primary text-sm font-medium capitalize">{provider}</p>
                      {account ? (
                        <p className="text-text-muted text-xs">{account.email}</p>
                      ) : (
                        <p className="text-text-muted text-xs">{t('settings.notLinked')}</p>
                      )}
                    </div>
                  </div>

                  {isLinked ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={unlinking === provider}
                      onClick={() => handleUnlink(provider)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      {t('settings.unlink')}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleLink(provider)}>
                      {t('settings.link')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
