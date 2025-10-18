import type { ErrorDetail, Result, ResultMeta } from './types'

// Status code constants for performance

const STATUS_SERVER_ERROR = 500

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

  toJSON(): object {
    const result: any = {
      errors: this.errors
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

