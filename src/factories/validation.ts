import type { Result, ErrorDetail } from '../core/types.js'
import { ResultImpl } from '../core/result.js'

export function validationErrors(
  list: { path: string; message: string }[]
): Result<never> {
  const errors: ErrorDetail[] = list.map(item => ({
    code: "VALIDATION_ERROR",
    message: item.message,
    path: item.path
  }))
  
  return new ResultImpl<never>(null, errors, 400)
}
