import type { ErrorDetail, Result, ResultMeta } from '../core/types'
import { createResult } from '../core/result'

export function err(
  error: ErrorDetail | ErrorDetail[],
  meta?: ResultMeta,
  status?: number
): Result<never> {
  const errors = Array.isArray(error) ? error : [error]
  return createResult<never>(null, errors, status, meta)
}
