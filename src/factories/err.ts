import type { ErrorDetail, Result, ResultMeta } from '../core/types.js'
import { ResultImpl } from '../core/result.js'

export function err(
  error: ErrorDetail | ErrorDetail[],
  meta?: ResultMeta,
  status?: number
): Result<never> {
  const errors = Array.isArray(error) ? error : [error]
  return new ResultImpl<never>(null, errors, status, meta)
}
