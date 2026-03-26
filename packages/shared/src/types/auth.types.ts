import type { z } from 'zod'
import type { registerSchema, loginSchema } from '../schemas/auth.schema.js'

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type AuthResponse = {
  accessToken: string
  user: {
    id: string
    email: string
    displayName: string
    role: string
    locale: string
    preferredTheme: string
  }
}
