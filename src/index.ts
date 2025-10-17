export type ErrorLevel = "info" | "warning" | "error" | "critical"

export interface ErrorDetail {
  code: string
  message: string
  status?: number
  path?: string
  level?: ErrorLevel
  meta?: Record<string, unknown>
}

export interface ResultMeta {
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  traceId?: string
  timestamp?: string
  [key: string]: unknown
}

export interface Result<T> {
  data: T | null
  errors: ErrorDetail[]
  status?: number
  meta?: ResultMeta
  isOk(): this is { data: Exclude<T, void> | null; errors: [] }
  isError(): boolean
  hasWarning(): boolean
}

export function createResult<T>(
  data: T | null,
  errors: ErrorDetail[],
  status?: number,
  meta?: ResultMeta
): Result<T> {
  const result: Result<T> = {
    data,
    errors,
    status,
    meta,
    isOk(): this is { data: Exclude<T, void> | null; errors: [] } {
      return this.errors.length === 0
    },
    isError() {
      if (this.errors.length === 0) return false
      // Treat missing level or explicit error/critical as an error
      return this.errors.some(
        error => !error.level || error.level === "error" || error.level === "critical"
      )
    },
    hasWarning() {
      return this.errors.some(error => error.level === "warning")
    }
  }

  return result
}

export function ok<T = void>(
  data?: T,
  meta?: ResultMeta,
  status = 200
): Result<T> {
  const safeData = (data === undefined ? null : data) as T | null
  return createResult(safeData, [], status, meta)
}

export function err(
  error: ErrorDetail | ErrorDetail[],
  meta?: ResultMeta,
  fallbackStatus = 400
): Result<never> {
  const errors = Array.isArray(error) ? error : [error]
  const status = errors[0]?.status ?? fallbackStatus
  return createResult<never>(null, errors, status, meta)
}

export function defineError<T extends string>(
  code: T,
  message: string,
  status: number,
  level?: ErrorLevel
) {
  return (override?: Partial<ErrorDetail>): ErrorDetail => ({
    code,
    message,
    status,
    ...(level ? { level } : {}),
    ...override
  })
}

const validationError = defineError("VALIDATION_ERROR", "Invalid input data", 400)

export function validationErrors(
  list: { path: string; message: string }[]
): Result<never> {
  const errors = list.map(item =>
    validationError({ message: item.message, path: item.path })
  )
  return err(errors, undefined, 400)
}

export function inferStatus<T>(result: Result<T>): number {
  if (result.status) return result.status
  if (result.isOk()) {
    // Nếu không có data thì trả về 204 No Content
    if (result.data === null || result.data === undefined) return 204
    return 200
  }
  const critical = result.errors.find(error => error.status && error.status >= 500)
  if (critical) return 500
  return result.errors[0]?.status ?? 400
}
