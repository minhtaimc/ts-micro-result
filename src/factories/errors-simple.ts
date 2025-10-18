import type { ErrorDetail, ErrorLevel } from '../core/types.js'

// Base params that are always available (but optional)
export interface BaseErrorParams {
  path?: string
  meta?: Record<string, unknown>
  cause?: ErrorDetail
  message?: string  // Allow message override
}

/**
 * Simple error factory - no template interpolation, just basic functionality
 * 
 * @example
 * const userError = defineError('USER_NOT_FOUND', 'User not found', 404)
 * userError() // Simple usage
 * userError({ message: 'Custom message', path: 'user.id' }) // With overrides
 * 
 * @example
 * // Error chaining
 * const dbError = defineError('DB_ERROR', 'Database error', 500)
 * const userError = defineError('USER_CREATE_FAILED', 'Failed to create user', 500)
 * userError({ cause: dbError({ message: 'Connection timeout' }) })
 */
export function defineError(
  code: string,
  message: string,
  status?: number,
  level?: ErrorLevel
) {
  return (params?: BaseErrorParams): ErrorDetail => ({
    code,
    message: params?.message || message,
    ...(status !== undefined && { status }),
    ...(level && { level }),
    ...(params?.path && { path: params.path }),
    ...(params?.meta && { meta: params.meta }),
    ...(params?.cause && { cause: params.cause })
  })
}
