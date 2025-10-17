import type { Result, SerializedResult } from '../core/types'
import { createResult, expandError } from '../core/result'

export function fromJson<T = unknown>(json: string): Result<T> {
  try {
    const parsed = JSON.parse(json) as any
    
    if (!(typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.errors))) {
      throw new Error('Invalid JSON')
    }
    
    // Auto-detect format by checking first error
    // Compact format has 'c' and 'm' fields, normal has 'code' and 'message'
    const isCompact = parsed.errors.length > 0 && 
                      'c' in parsed.errors[0] && 
                      'm' in parsed.errors[0]
    
    // Expand compact format to normal format if needed
    const errors = isCompact
      ? parsed.errors.map((e: any) => expandError(e))
      : parsed.errors
    
    return createResult<T>(
      parsed.data as T | null,
      errors,
      parsed.status,
      parsed.meta
    )
  } catch (err) {
    return createResult<T>(null, [{
      code: 'INVALID_JSON',
      message: err instanceof Error ? err.message : 'Invalid JSON',
      status: 400,
      level: 'error'
    }], 400)
  }
}
