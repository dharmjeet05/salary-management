import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(4000),
  CORS_ORIGIN: z.url(),
})

export type Env = { port: number; corsOrigin: string }

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new Error(`Invalid environment: ${problems}`)
  }
  return { port: result.data.PORT, corsOrigin: result.data.CORS_ORIGIN }
}
