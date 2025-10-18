import type { ErrorDetail, ErrorLevel } from '../core/types.js'

// Base params that are always available (but optional)
export interface BaseErrorParams {
  path?: string
  meta?: Record<string, unknown>
  cause?: ErrorDetail
  message?: string  // Allow message override
}

// Extract template variable names from template string
// "User {id} not found" → "id"
// "Field {field} must be {type}" → "field" | "type"
type ExtractTemplateVars<T extends string> = 
  T extends `${string}{${infer Var}}${infer Rest}`
    ? Var | ExtractTemplateVars<Rest>
    : never

// Check if template has any variables
type HasTemplateVars<T extends string> = ExtractTemplateVars<T> extends never ? false : true

// Conditional params type based on whether template has variables
// If template has variables: require those variables, base params are optional
// If no variables: all params are optional
type ErrorParams<TTemplate extends string> = 
  HasTemplateVars<TTemplate> extends true
    ? { [K in ExtractTemplateVars<TTemplate>]: any } & Partial<BaseErrorParams>
    : Partial<BaseErrorParams> | undefined

/**
 * Advanced error factory with template interpolation and complex TypeScript types
 * 
 * @example
 * // Simple error without template
 * const genericError = defineErrorAdvanced('GENERIC', 'Something went wrong')
 * genericError() // No params needed
 * 
 * @example
 * // Error with template - TypeScript will autocomplete params!
 * const userError = defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404)
 * userError({ id: 123 }) // TypeScript suggests: { id: any, path?: string, meta?: ..., cause?: ... }
 * 
 * @example
 * // Error with multiple template variables
 * const validationError = defineErrorAdvanced('VALIDATION', 'Field {field} must be {type}', 400)
 * validationError({ field: 'email', type: 'string' })
 * 
 * @example
 * // Error chaining
 * const dbError = defineErrorAdvanced('DB_ERROR', 'Database error', 500)
 * const userError = defineErrorAdvanced('USER_CREATE_FAILED', 'Failed to create user', 500)
 * userError({ cause: dbError({ message: 'Connection timeout' }) })
 */
export function defineErrorAdvanced<
  TCode extends string,
  TTemplate extends string
>(
  code: TCode,
  template: TTemplate,
  status?: number,
  level?: ErrorLevel
) {
  return (params?: ErrorParams<TTemplate>): ErrorDetail => {
    // Allow message override or use template
    let message: string = params?.message || template
    
    // Interpolate template variables only if not overridden
    if (!params?.message && params && typeof params === 'object') {
      for (const key in params) {
        if (key !== 'path' && key !== 'meta' && key !== 'cause' && key !== 'message') {
          const value = (params as any)[key]
          if (value !== undefined) {
            message = message.replace(
              new RegExp(`\\{${key}\\}`, 'g'),
              String(value)
            )
          }
        }
      }
    }
    
    return {
      code,
      message,
      ...(status !== undefined && { status }),
      ...(level && { level }),
      ...(params?.path && { path: params.path }),
      ...(params?.meta && { meta: params.meta }),
      ...(params?.cause && { cause: params.cause })
    }
  }
}
