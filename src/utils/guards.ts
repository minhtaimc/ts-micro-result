import type { Result } from '../core/types.js'

export function isResult<T = unknown>(value: unknown): value is Result<T> {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  
  const obj = value as Record<string, unknown>
  
  return (
    ('data' in obj) &&
    Array.isArray(obj.errors) &&
    typeof obj.isOk === 'function' &&
    typeof obj.isOkWithData === 'function' &&
    typeof obj.isError === 'function' &&
    typeof obj.hasWarning === 'function' &&
    typeof obj.toJSON === 'function'
  )
}
