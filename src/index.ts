// Core types and interfaces
export type { ErrorLevel, ErrorDetail, ResultMeta, Result, SerializedResult } from './core/types'

// Core Result implementation
export { ResultImpl, createResult } from './core/result'

// Factory functions
export { ok } from './factories/ok'
export { err } from './factories/err'
export { defineError } from './factories/errors'
export { validationErrors } from './factories/validation'

// Utility functions
export { fromJson } from './utils/serialization'
export { isResult } from './utils/guards'
export { inferStatus, toHttpResponse } from './utils/http'
