import type { Result, SerializedResult } from '../core/types.js'
import { ResultImpl } from '../core/result.js'

export function fromJSON<T = unknown>(json: string): Result<T> {
  try {
    const parsed = JSON.parse(json) as SerializedResult
    
    if (!(typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.errors))) {
      throw new Error('Invalid JSON')
    }
    
    return new ResultImpl<T>(
      parsed.data as T | null,
      parsed.errors,
      parsed.status,
      parsed.meta
    )
  } catch (err) {
    return new ResultImpl<T>(null, [{
      code: 'INVALID_JSON',
      message: err instanceof Error ? err.message : 'Invalid JSON',
      status: 400,
    }], 400)
  }
}
