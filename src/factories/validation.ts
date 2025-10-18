import type { Result } from '../core/types.js'
import { err } from './err.js'
import { defineError } from './errors.js'

const validationError = defineError("VALIDATION_ERROR", "Invalid input data", 400)

export function validationErrors(
  list: { path: string; message: string }[]
): Result<never> {
  const errors = list.map(item =>
    validationError({ message: item.message, path: item.path })
  )
  return err(errors, undefined, 400)
}
