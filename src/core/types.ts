export type ErrorLevel = "info" | "warning" | "error" | "critical"

export interface ErrorDetail {
  code: string
  message: string
  status?: number
  path?: string
  level?: ErrorLevel
  meta?: Record<string, unknown>
  cause?: ErrorDetail
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
  isOk(): this is { data: T | null; errors: [] }
  isOkWithData(): this is { data: NonNullable<T>; errors: [] }
  isError(): boolean
  hasWarning(): boolean
  toJSON(): object
  map<U>(fn: (data: T) => U): Result<U>
  flatMap<U>(fn: (data: T) => Result<U>): Result<U>
}

export interface SerializedResult {
  data: unknown
  errors: ErrorDetail[]
  status?: number
  meta?: ResultMeta
}
