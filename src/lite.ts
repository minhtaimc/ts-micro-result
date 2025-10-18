// Minimal entry point for tree-shake friendly consumers
export type { ErrorDetail, Result, ResultMeta } from './core/types.js'
export { ResultImpl } from './core/result.js'
export { ok } from './factories/ok.js'
export { err } from './factories/err.js'
