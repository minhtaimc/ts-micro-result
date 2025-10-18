// Core types and interfaces
export type { ErrorLevel, ErrorDetail, ResultMeta, Result, SerializedResult } from './core/types.js'

// Core Result implementation
export { ResultImpl } from './core/result.js'

// Factory functions
export { ok } from './factories/ok.js'
export { err } from './factories/err.js'
export { defineError } from './factories/errors-simple.js'
export type { BaseErrorParams } from './factories/errors-simple.js'
export { defineErrorAdvanced } from './factories/errors-advanced.js'
export { validationErrors } from './factories/validation.js'

// Utility functions
export { fromJson } from './utils/serialization.js'
export { isResult } from './utils/guards.js'
export { inferStatus, toHttpResponse } from './utils/http.js'
