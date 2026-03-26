import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database (required)
  DATABASE_URL: z.string().url(),

  // Redis (required in prod, optional in dev)
  REDIS_URL: z.string().optional(),

  // JWT (required — auth won't work without these)
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((s) => s.split(',')),

  // Frontend URL (for OAuth redirects)
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  // OAuth (optional)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // External services (optional)
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // console.error is intentional here — logger depends on env, so it's not available yet
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
