import type { Result, ResultMeta } from '../core/types.js'
import { ResultImpl } from '../core/result.js'

export function ok<T = void>(
  data?: T,
  meta?: ResultMeta,
  status?: number
): Result<T> {
  const safeData = (data === undefined ? null : data) as T | null
  return new ResultImpl(safeData, [], status, meta)
}
