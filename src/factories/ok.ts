import type { Result, ResultMeta } from '../core/types'
import { createResult } from '../core/result'

export function ok<T = void>(
  data?: T,
  meta?: ResultMeta,
  status?: number
): Result<T> {
  const safeData = (data === undefined ? null : data) as T | null
  return createResult(safeData, [], status, meta)
}
