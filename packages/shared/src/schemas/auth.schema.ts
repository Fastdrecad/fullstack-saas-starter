import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .max(128, 'Maximum 128 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
})
