import type { ErrorDetail, Result, ResultMeta } from './types'

// Status code constants for performance
const STATUS_OK = 200
const STATUS_NO_CONTENT = 204
const STATUS_BAD_REQUEST = 400
const STATUS_SERVER_ERROR = 500

// Compact error format helpers
function compactError(error: ErrorDetail): any {
  const compact: any = {
    c: error.code,
    m: error.message
  }
  
  if (error.status !== undefined) compact.s = error.status
  if (error.path) compact.p = error.path
  if (error.level) compact.l = error.level
  if (error.meta) compact.meta = error.meta
  if (error.cause) compact.cause = compactError(error.cause)
  
  return compact
}

export function expandError(compact: any): ErrorDetail {
  const error: ErrorDetail = {
    code: compact.c || compact.code,
    message: compact.m || compact.message
  }
  
  if (compact.s !== undefined || compact.status !== undefined) {
    error.status = compact.s ?? compact.status
  }
  if (compact.p || compact.path) error.path = compact.p ?? compact.path
  if (compact.l || compact.level) error.level = compact.l ?? compact.level
  if (compact.meta) error.meta = compact.meta
  if (compact.cause) error.cause = expandError(compact.cause)
  
  return error
}

export class ResultImpl<T> implements Result<T> {
  public readonly data: T | null
  public readonly errors: ErrorDetail[]
  public readonly status?: number
  public readonly meta?: ResultMeta

  constructor(
    data: T | null,
    errors: ErrorDetail[],
    status?: number,
    meta?: ResultMeta
  ) {
    this.data = data
    this.errors = errors
    this.status = status
    this.meta = meta
  }

  isOk(): this is { data: T | null; errors: [] } {
    return this.errors.length === 0
  }

  isOkWithData(): this is { data: NonNullable<T>; errors: [] } {
    return this.errors.length === 0 && this.data !== null
  }

  isError(): boolean {
    const len = this.errors.length
    for (let i = 0; i < len; i++) {
      const lvl = this.errors[i].level
      if (!lvl || lvl === "error" || lvl === "critical") return true
    }
    return false
  }

  hasWarning(): boolean {
    const len = this.errors.length
    for (let i = 0; i < len; i++) {
      if (this.errors[i].level === "warning") return true
    }
    return false
  }

  toJSON(compact?: boolean): object {
    const result: any = {}
    
    // Handle errors - compact or normal format
    if (compact) {
      result.errors = this.errors.map(e => compactError(e))
    } else {
      result.errors = this.errors
    }
    
    if (this.data != null) result.data = this.data
    if (this.status !== undefined) result.status = this.status
    
    // Manual copy for performance
    if (this.meta) {
      for (const key in this.meta) {
        result[key] = this.meta[key]
      }
    }
    
    return result
  }

  map<U>(fn: (data: T) => U): Result<U> {
    // Fast path: propagate errors
    if (this.errors.length > 0) {
      return new ResultImpl<U>(null, this.errors, this.status, this.meta)
    }
    
    // Fast path: null data
    if (this.data === null) {
      return new ResultImpl<U>(null, [], this.status, this.meta)
    }

    try {
      const newData = fn(this.data)
      return new ResultImpl<U>(newData, [], this.status, this.meta)
    } catch (error) {
      return new ResultImpl<U>(null, [{
        code: 'MAP_ERROR',
        message: error instanceof Error ? error.message : 'Error in map function',
        status: STATUS_SERVER_ERROR,
        level: 'error'
      }], STATUS_SERVER_ERROR, this.meta)
    }
  }

  flatMap<U>(fn: (data: T) => Result<U>): Result<U> {
    // Fast path: propagate errors
    if (this.errors.length > 0) {
      return new ResultImpl<U>(null, this.errors, this.status, this.meta)
    }
    
    // Fast path: null data
    if (this.data === null) {
      return new ResultImpl<U>(null, [], this.status, this.meta)
    }

    try {
      return fn(this.data)
    } catch (error) {
      return new ResultImpl<U>(null, [{
        code: 'FLATMAP_ERROR',
        message: error instanceof Error ? error.message : 'Error in flatMap function',
        status: STATUS_SERVER_ERROR,
        level: 'error'
      }], STATUS_SERVER_ERROR, this.meta)
    }
  }
}

export function createResult<T>(
  data: T | null,
  errors: ErrorDetail[],
  status?: number,
  meta?: ResultMeta
): Result<T> {
  return new ResultImpl(data, errors, status, meta)
}
