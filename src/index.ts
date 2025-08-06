export interface ErrorDetail {
  code: string;
  message: string;
  path?: string; // optional, for field-level error
}

type Ok<T> = {
  ok: true
  data: T
}

type Err = {
  ok: false
  error: ErrorDetail
}

export type Result<T> = (Ok<T> | Err) & {
  isOk(): this is Ok<T>
  isError(): this is Err
}

const createResult = <T>(result: Ok<T> | Err): Result<T> => {
  return {
    ...result,
    isOk(): this is Ok<T> {
      return this.ok === true
    },
    isError(): this is Err {
      return this.ok === false
    }
  }
}

export const ok = <T = void>(data?: T): Result<T> => 
  createResult({
    ok: true,
    data: data as T  
  })

export const err = (error: ErrorDetail): Result<never> => 
  createResult({
    ok: false,
    error
  }) 