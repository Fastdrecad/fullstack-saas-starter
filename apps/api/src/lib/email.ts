import { env } from '../config/env.js'
import { logger } from './logger.js'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  if (!env.RESEND_API_KEY) {
    logger.warn({ to, subject }, 'Email not sent — RESEND_API_KEY not configured')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'SaaS Starter <noreply@example.com>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    logger.error({ status: res.status, to }, 'Failed to send email')
  }
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}
