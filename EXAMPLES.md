# ts-micro-result Examples

Comprehensive examples for using ts-micro-result in your projects.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Error Templates](#error-templates)
- [Error Chaining](#error-chaining)
- [Error Groups Pattern](#error-groups-pattern)
- [Validation Errors](#validation-errors)
- [Functional Programming](#functional-programming)
- [Edge Computing Patterns](#edge-computing-patterns)

## Basic Usage

### Creating Success Results

```typescript
import { ok } from 'ts-micro-result'

// Simple success
const result = ok({ id: 1, name: 'John' })
console.log(result.data) // { id: 1, name: 'John' }
console.log(result.isOk()) // true

// Success with metadata
const paginatedResult = ok(
  [{ id: 1 }, { id: 2 }],
  { 
    pagination: { page: 1, pageSize: 10, total: 100 },
    traceId: 'abc-123'
  }
)

// Void success (no data)
const voidResult = ok()
console.log(voidResult.data) // null
console.log(voidResult.status) // 204
```

### Creating Error Results

```typescript
import { err } from 'ts-micro-result'

// Simple error
const errorResult = err({
  code: 'NOT_FOUND',
  message: 'User not found',
  status: 404
})

// Multiple errors
const multiErrorResult = err([
  { code: 'INVALID_EMAIL', message: 'Invalid email format', status: 400 },
  { code: 'INVALID_AGE', message: 'Age must be positive', status: 400 }
])

// Error with metadata
const tracedError = err(
  { code: 'SERVER_ERROR', message: 'Internal error', status: 500 },
  { traceId: 'xyz-789', timestamp: new Date().toISOString() }
)
```

## Error Templates

### Simple Templates

```typescript
import { defineError } from 'ts-micro-result'

// Define reusable error templates
const userNotFound = defineError(
  'USER_NOT_FOUND',
  'User {id} not found',
  404
)

// TypeScript will autocomplete: { id: any, path?: string, meta?: ..., cause?: ... }
const error = userNotFound({ id: 123 })
console.log(error.message) // "User 123 not found"
```

### Multiple Template Variables

```typescript
const validationError = defineError(
  'VALIDATION_ERROR',
  'Field {field} must be {type}',
  400
)

const error = validationError({ 
  field: 'email', 
  type: 'string',
  path: '/users/create'
})
// message: "Field email must be string"
// path: "/users/create"
```

### Templates Without Variables

```typescript
// No template variables - params are optional
const genericError = defineError(
  'GENERIC_ERROR',
  'Something went wrong'
)

const error1 = genericError() // No params needed
const error2 = genericError({ path: '/api/users' }) // Optional params still work
```

### Message Override

```typescript
const userError = defineError('USER_ERROR', 'User {id} error', 400)

// Use template
const error1 = userError({ id: 123 })
// message: "User 123 error"

// Override message completely
const error2 = userError({ id: 123, message: 'Custom error message' })
// message: "Custom error message"
```

### Optional Status

```typescript
// Error without HTTP status (for non-HTTP contexts)
const logicError = defineError(
  'LOGIC_ERROR',
  'Invalid operation: {operation}'
)

const error = logicError({ operation: 'divide by zero' })
console.log(error.status) // undefined
```

## Error Chaining

Track error causes through your application:

```typescript
import { defineError, err } from 'ts-micro-result'

// Define error types
const dbError = defineError('DB_ERROR', 'Database error: {reason}', 500)
const userError = defineError('USER_CREATE_FAILED', 'Failed to create user', 500)

// Chain errors
async function createUser(data: any) {
  try {
    await db.insert(data)
  } catch (e) {
    // Create error chain
    return err(userError({
      cause: dbError({ 
        reason: e.message,
        meta: { query: 'INSERT INTO users...' }
      })
    }))
  }
  
  return ok(data)
}

// Result structure:
// {
//   code: 'USER_CREATE_FAILED',
//   message: 'Failed to create user',
//   status: 500,
//   cause: {
//     code: 'DB_ERROR',
//     message: 'Database error: Connection timeout',
//     status: 500,
//     meta: { query: '...' }
//   }
// }
```

### Deep Error Chains

```typescript
const networkError = defineError('NETWORK_ERROR', 'Network error', 500)
const dbError = defineError('DB_ERROR', 'Database error', 500)
const serviceError = defineError('SERVICE_ERROR', 'Service error', 500)

// Create deep chain
const error = serviceError({
  cause: dbError({
    cause: networkError({
      message: 'Connection refused'
    })
  })
})

// Traverse error chain
function printErrorChain(error: ErrorDetail, depth = 0) {
  console.log('  '.repeat(depth) + error.message)
  if (error.cause) {
    printErrorChain(error.cause, depth + 1)
  }
}

printErrorChain(error)
// Output:
// Service error
//   Database error
//     Connection refused
```

## Error Groups Pattern

Organize errors by domain for better code organization:

```typescript
import { defineError } from 'ts-micro-result'

// User domain errors
export const UserErrors = {
  NotFound: defineError('USER_NOT_FOUND', 'User {id} not found', 404),
  Unauthorized: defineError('USER_UNAUTHORIZED', 'Unauthorized access', 401),
  InvalidEmail: defineError('USER_INVALID_EMAIL', 'Invalid email: {email}', 400),
  AlreadyExists: defineError('USER_EXISTS', 'User {email} already exists', 409)
} as const

// Product domain errors
export const ProductErrors = {
  NotFound: defineError('PRODUCT_NOT_FOUND', 'Product {id} not found', 404),
  OutOfStock: defineError('PRODUCT_OUT_OF_STOCK', 'Product {id} out of stock', 409),
  InvalidPrice: defineError('PRODUCT_INVALID_PRICE', 'Price must be positive', 400)
} as const

// Order domain errors
export const OrderErrors = {
  NotFound: defineError('ORDER_NOT_FOUND', 'Order {id} not found', 404),
  CannotCancel: defineError('ORDER_CANNOT_CANCEL', 'Order {id} cannot be cancelled', 400),
  PaymentFailed: defineError('ORDER_PAYMENT_FAILED', 'Payment failed: {reason}', 402)
} as const

// Usage
import { err } from 'ts-micro-result'

function getUser(id: number) {
  const user = db.findUser(id)
  if (!user) {
    return err(UserErrors.NotFound({ id }))
  }
  return ok(user)
}

function createOrder(userId: number, productId: number) {
  const user = getUser(userId)
  if (!user.isOk()) return user
  
  const product = getProduct(productId)
  if (!product.isOk()) return product
  
  if (product.data.stock === 0) {
    return err(ProductErrors.OutOfStock({ id: productId }))
  }
  
  // ... create order
}
```

## Validation Errors

### Simple Validation

```typescript
import { validationErrors } from 'ts-micro-result'

function validateUser(data: any) {
  const errors = []
  
  if (!data.email) {
    errors.push({ path: 'email', message: 'Email is required' })
  }
  if (!data.age || data.age < 0) {
    errors.push({ path: 'age', message: 'Age must be positive' })
  }
  
  if (errors.length > 0) {
    return validationErrors(errors)
  }
  
  return ok(data)
}
```

### Custom Validation Errors

```typescript
import { defineError, err } from 'ts-micro-result'

const fieldRequired = defineError('FIELD_REQUIRED', 'Field {field} is required', 400)
const fieldInvalid = defineError('FIELD_INVALID', 'Field {field} is invalid: {reason}', 400)

function validateEmail(email: string) {
  if (!email) {
    return err(fieldRequired({ field: 'email', path: '/email' }))
  }
  if (!email.includes('@')) {
    return err(fieldInvalid({ 
      field: 'email', 
      reason: 'must contain @',
      path: '/email'
    }))
  }
  return ok(email)
}
```

## Functional Programming

### Map - Transform Success Data

```typescript
import { ok } from 'ts-micro-result'

const userResult = ok({ id: 1, name: 'John', email: 'john@example.com' })

// Transform data
const nameResult = userResult.map(user => user.name.toUpperCase())
console.log(nameResult.data) // "JOHN"

// Chain transformations
const result = ok({ price: 100 })
  .map(p => p.price * 1.1) // Add tax
  .map(p => Math.round(p)) // Round
  .map(p => `$${p}`) // Format
console.log(result.data) // "$110"

// Errors propagate automatically
const errorResult = err({ code: 'ERROR', message: 'Failed', status: 500 })
const mapped = errorResult.map(x => x * 2)
console.log(mapped.isError()) // true - error propagated
```

### FlatMap - Chain Operations

```typescript
import { ok, err } from 'ts-micro-result'

function getUser(id: number) {
  return id > 0 
    ? ok({ id, name: 'John', companyId: 1 })
    : err({ code: 'INVALID_ID', message: 'Invalid user ID', status: 400 })
}

function getCompany(id: number) {
  return id > 0
    ? ok({ id, name: 'Acme Corp' })
    : err({ code: 'INVALID_ID', message: 'Invalid company ID', status: 400 })
}

// Chain operations that return Results
const result = getUser(1)
  .flatMap(user => getCompany(user.companyId))
  .map(company => company.name)

console.log(result.data) // "Acme Corp"

// Error in chain stops execution
const errorResult = getUser(-1) // Returns error
  .flatMap(user => getCompany(user.companyId)) // Not executed
  .map(company => company.name) // Not executed

console.log(errorResult.isError()) // true
```

### Combining Map and FlatMap

```typescript
async function getUserWithCompany(userId: number) {
  return getUser(userId)
    .flatMap(user => 
      getCompany(user.companyId)
        .map(company => ({
          ...user,
          company
        }))
    )
}

const result = await getUserWithCompany(1)
// result.data = { id: 1, name: 'John', companyId: 1, company: { id: 1, name: 'Acme' } }
```

## Edge Computing Patterns

### Cloudflare Workers

```typescript
import { ok, err, defineError } from 'ts-micro-result'

const rateLimitError = defineError('RATE_LIMIT', 'Rate limit exceeded', 429)

export default {
  async fetch(request: Request): Promise<Response> {
    // Check rate limit
    if (isRateLimited(request)) {
      const result = err(rateLimitError())
      return new Response(JSON.stringify(result.toJSON()), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Process request
    const result = await processRequest(request)
    
    return new Response(JSON.stringify(result.toJSON()), {
      status: result.status || 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### Vercel Edge Functions

```typescript
import { ok, err } from 'ts-micro-result'
import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge'
}

export default async function handler(req: NextRequest) {
  const result = await fetchData()
  
  if (!result.isOk()) {
    return new Response(JSON.stringify(result.toJSON()), {
      status: result.status || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify(result.toJSON()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Caching Common Errors

```typescript
// Cache frequently used errors to save memory
const COMMON_ERRORS = {
  notFound: err({ code: 'NOT_FOUND', message: 'Not found', status: 404 }),
  unauthorized: err({ code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 }),
  serverError: err({ code: 'SERVER_ERROR', message: 'Internal error', status: 500 })
} as const

// Reuse cached errors
export default {
  async fetch(request: Request) {
    if (!isAuthenticated(request)) {
      return toResponse(COMMON_ERRORS.unauthorized)
    }
    
    const resource = await findResource(request)
    if (!resource) {
      return toResponse(COMMON_ERRORS.notFound)
    }
    
    return toResponse(ok(resource))
  }
}

function toResponse(result: Result<any>) {
  return new Response(JSON.stringify(result.toJSON()), {
    status: result.status || 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

## Best Practices

### 1. Use Error Groups for Organization

```typescript
// ✅ Good - organized by domain
export const UserErrors = {
  NotFound: defineError('USER_NOT_FOUND', 'User {id} not found', 404),
  Unauthorized: defineError('USER_UNAUTHORIZED', 'Unauthorized', 401)
}

// ❌ Avoid - scattered error definitions
const userNotFound = defineError('USER_NOT_FOUND', '...', 404)
const productNotFound = defineError('PRODUCT_NOT_FOUND', '...', 404)
```

### 2. Use Templates for Dynamic Messages

```typescript
// ✅ Good - template with variables
const error = defineError('INVALID_FIELD', 'Field {field} is invalid', 400)

// ❌ Avoid - hardcoded messages
const emailError = defineError('INVALID_EMAIL', 'Email is invalid', 400)
const nameError = defineError('INVALID_NAME', 'Name is invalid', 400)
```

### 3. Chain Errors for Debugging

```typescript
// ✅ Good - preserve error context
return err(serviceError({
  cause: dbError({ reason: e.message })
}))

// ❌ Avoid - losing error context
return err(serviceError())
```

### 4. Use Type Guards

```typescript
// ✅ Good - type-safe checking
if (result.isOk()) {
  console.log(result.data.id) // TypeScript knows data is not null
}

// ❌ Avoid - manual checking
if (result.errors.length === 0) {
  console.log(result.data?.id) // Need optional chaining
}
