import type { Result } from '../core/types.js'

const STATUS_OK = 200
const STATUS_NO_CONTENT = 204
const STATUS_BAD_REQUEST = 400

/**
 * Infer HTTP status code from a Result.
 * 
 * Priority:
 * 1. Explicit status if set
 * 2. For success: 200 if has data, 204 if no data
 * 3. For errors: First 5xx error, or first error's status, or 400
 * 
 * @param result - The Result to infer status from
 * @returns HTTP status code
 * 
 * @example
 * ```typescript
 * const result = ok({ id: 1 })
 * inferStatus(result) // 200 (has data)
 * 
 * const empty = ok()
 * inferStatus(empty) // 204 (no data)
 * 
 * const error = err(NotFound())
 * inferStatus(error) // 404 (from error)
 * ```
 */
export function inferStatus<T>(result: Result<T>): number {
  // 1. Explicit status takes priority
  if (result.status !== undefined) {
    return result.status
  }
  
  // 2. Success case - differentiate 200 vs 204
  if (result.isOk()) {
    return result.data !== null ? STATUS_OK : STATUS_NO_CONTENT
  }
  
  // 3. Error case - find critical (5xx) errors first
  const len = result.errors.length
  for (let i = 0; i < len; i++) {
    const status = result.errors[i].status
    if (status && status >= 500) {
      return status
    }
  }
  
  // 4. Fallback: first error's status or 400
  return result.errors[0]?.status ?? STATUS_BAD_REQUEST
}

/**
 * Convert a Result to HTTP response format.
 * Automatically infers status code and serializes body.
 * 
 * @param result - The Result to convert
 * @returns Object with status and body for HTTP response
 * 
 * @example
 * ```typescript
 * const result = ok(user)
 * const { status, body } = toHttpResponse(result)
 * res.status(status).json(body)
 * ```
 */
export function toHttpResponse<T>(
  result: Result<T>
): { status: number; body: object } {
  return {
    status: inferStatus(result),
    body: result.toJSON()
  }
}
