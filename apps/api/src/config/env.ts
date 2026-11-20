import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(4000),
  // Browsers send the origin with no path and no trailing slash, and cors
  // compares strings, so keep only the origin part of whatever was set.
  CORS_ORIGIN: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BUILD_TAG: z.string().trim().min(1).default('dev'),
})

export type Env = { port: number; corsOrigin: string; databaseUrl: string; buildTag: string }

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new Error(`Invalid environment: ${problems}`)
  }
  return {
    port: result.data.PORT,
    corsOrigin: result.data.CORS_ORIGIN,
    databaseUrl: result.data.DATABASE_URL,
    buildTag: result.data.BUILD_TAG,
  }
}
