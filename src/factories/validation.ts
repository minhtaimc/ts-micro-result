import type { Result } from '../core/types'
import { err } from './err'
import { defineError } from './errors'

const validationError = defineError("VALIDATION_ERROR", "Invalid input data", 400)

export function validationErrors(
  list: { path: string; message: string }[]
): Result<never> {
  const errors = list.map(item =>
    validationError({ message: item.message, path: item.path })
  )
  return err(errors, undefined, 400)
}
