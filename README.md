# ts-micro-result

A tiny Result toolkit for TypeScript services, SDKs, and background jobs. Ship a single union for success, warnings, and failures that travels well across HTTP, gRPC, queues, CLIs, or any other channel you need.

[![npm version](https://img.shields.io/npm/v/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
![npm bundle size](https://img.shields.io/bundlephobia/min/ts-micro-result)
[![npm downloads](https://img.shields.io/npm/dm/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![license](https://img.shields.io/npm/l/ts-micro-result.svg)](https://github.com/minhtaimc/ts-micro-result/blob/main/LICENSE)

---

## 🚀 Quick Start

```bash
npm install ts-micro-result
```

```typescript
// All imports support tree-shaking - bundler will only include what you use
import { ok, err, defineError, defineErrorAdvanced, inferStatus } from 'ts-micro-result'

// Or use subpath imports for specific functionality
import { ok, err } from 'ts-micro-result/lite'
import { defineError } from 'ts-micro-result/factories/errors-simple'
import { inferStatus } from 'ts-micro-result/utils/http'

// Simple error (no template interpolation)
const NotFound = defineError('NOT_FOUND', 'User not found', 404)

// Advanced error with template interpolation
const UserNotFound = defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404)

// Return Results from your functions
async function getUser(id: string) {
  const user = await db.findUser(id)
  if (!user) return err(UserNotFound({ id }))  // Template interpolation
  return ok(user)
}

// Type-safe error handling
const result = await getUser('123')
if (result.isOkWithData()) {
  console.log(result.data.name)  // ✅ TypeScript knows data is not null
} else {
  console.error(result.errors)
}

// For HTTP responses, use inferStatus
const status = inferStatus(result)  // 200 for success, 404 for not found
```

**That's it!** You now have type-safe, predictable error handling. 🎉

**Note:** All import strategies support tree-shaking - your bundler will automatically optimize bundle size by only including the functions you actually use.

---

## ✨ Features

- ✅ **Predictable structure** - `data`, `errors`, `status`, `meta` on every response
- ✅ **Type-safe** - Full TypeScript support with smart type guards
- ✅ **Error templates** - Two versions: simple `defineError()` and advanced `defineErrorAdvanced()` with template interpolation
- ✅ **Error chaining** - Track error causes through your app layers
- ✅ **Functional** - `map` and `flatMap` for composable operations
- ✅ **Tree-shakeable** - Import only what you need, modular architecture
- ✅ **Ultra lightweight** - 10.9KB package, 2.89KB bundled, works in all edge runtimes
- ✅ **Framework agnostic** - Works everywhere
- ✅ **Zero dependencies** - No bloat

---

## 📖 Core Concepts

### Result Structure

Every Result has the same shape:

```typescript
interface Result<T> {
  data: T | null              // Your data or null
  errors: ErrorDetail[]       // Empty array if success
  status?: number             // HTTP status (optional)
  meta?: ResultMeta           // Metadata (pagination, traceId, etc.)
}
```

### Type Guards

Use type guards to handle success and error cases:

```typescript
const result = await getUser('123')

// ✅ Check if success (data might still be null)
if (result.isOk()) {
  console.log(result.data)  // data: User | null
}

// ✅ Check if success AND data is not null
if (result.isOkWithData()) {
  console.log(result.data.name)  // data: User (guaranteed non-null)
}

// ✅ Check for errors
if (result.isError()) {
  logger.error(result.errors)
}

// ✅ Check for warnings (non-blocking issues)
if (result.hasWarning()) {
  logger.warn(result.errors)
}
```

### Error Details

```typescript
interface ErrorDetail {
  code: string                // 'NOT_FOUND', 'VALIDATION_ERROR', etc.
  message: string             // Human-readable message
  status?: number             // HTTP status code
  path?: string               // Field path (for validation)
  level?: ErrorLevel          // 'info' | 'warning' | 'error' | 'critical'
  meta?: Record<string, any>  // Additional context
  cause?: ErrorDetail         // Error chaining
}
```

### Result Metadata

`ResultMeta` allows you to attach additional context to any Result:

```typescript
interface ResultMeta {
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  traceId?: string
  timestamp?: string
  [key: string]: unknown  // Any custom fields
}
```

### Optional Status

The `status` field is **truly optional** - it's only included when explicitly set or when needed for HTTP contexts.

**Non-HTTP contexts (CLI, queues, background jobs):**
```typescript
const result = ok({ message: "Task completed" })
result.toJSON()
// { data: { message: "Task completed" }, errors: [] }
// ✅ No status field → smaller JSON payload
```

**HTTP contexts - Option 1 (Explicit):**
```typescript
const result = ok(user, undefined, 200)
res.status(result.status!).json(result.toJSON())
```

**HTTP contexts - Option 2 (Infer when needed):**
```typescript
import { ok, inferStatus } from 'ts-micro-result'

const result = ok(user)
res.status(inferStatus(result)).json(result.toJSON())
// inferStatus() returns 200 (has data) or 204 (no data)
```

**HTTP contexts - Option 3 (Helper function):**
```typescript
import { ok, toHttpResponse } from 'ts-micro-result'

const result = ok(user)
const { status, body } = toHttpResponse(result)
res.status(status).json(body)
// ✅ Most convenient for HTTP APIs
```

**Why this matters:**
- ✅ Smaller JSON payloads for non-HTTP contexts
- ✅ Flexible: set status explicitly or infer when needed
- ✅ Smart inference: 200 vs 204 based on data presence
- ✅ Works seamlessly across different transport layers


---

## 🎯 Common Use Cases

### Basic CRUD Operations

```typescript
import { ok, err, defineError, defineErrorAdvanced } from 'ts-micro-result'

// Simple errors (no template interpolation)
const ServerError = defineError('SERVER_ERROR', 'Internal server error', 500)

// Advanced errors with template interpolation
const NotFound = defineErrorAdvanced('NOT_FOUND', '{resource} {id} not found', 404)

async function getUser(id: string) {
  try {
    const user = await db.users.findById(id)
    if (!user) {
      return err(NotFound({ resource: 'User', id }))
    }
    return ok(user)
  } catch (e) {
    return err(ServerError({ cause: { code: 'DB_ERROR', message: e.message } }))
  }
}
```

### API Error Handling

**Option 1: Using toHttpResponse helper (Recommended)**
```typescript
import { toHttpResponse } from 'ts-micro-result'

app.get('/api/users/:id', async (req, res) => {
  const result = await getUser(req.params.id)
  const { status, body } = toHttpResponse(result)
  res.status(status).json(body)
})
```

**Option 2: Using inferStatus**
```typescript
import { inferStatus } from 'ts-micro-result'

app.get('/api/users/:id', async (req, res) => {
  const result = await getUser(req.params.id)
  res.status(inferStatus(result)).json(result.toJSON())
})
```

**Option 3: Manual status handling**
```typescript
app.get('/api/users/:id', async (req, res) => {
  const result = await getUser(req.params.id)
  
  if (result.isOkWithData()) {
    res.json(result.toJSON())
  } else {
    res.status(result.status || 500).json(result.toJSON())
  }
})
```

### Validation

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

### Error Chaining

```typescript
const dbError = defineErrorAdvanced('DB_ERROR', 'Database error: {reason}', 500)
const userError = defineError('USER_CREATE_FAILED', 'Failed to create user', 500)

async function createUser(data: any) {
  try {
    await db.insert(data)
    return ok(data)
  } catch (e) {
    return err(userError({
      cause: dbError({ reason: e.message })
    }))
  }
}

// Error chain preserved:
// {
//   code: 'USER_CREATE_FAILED',
//   message: 'Failed to create user',
//   cause: {
//     code: 'DB_ERROR',
//     message: 'Database error: Connection timeout'
//   }
// }
```

---

## 🎯 Choosing Between Error Factories

### `defineError()` - Simple Version
**Use when:** You need basic error creation without template interpolation.

```typescript
import { defineError } from 'ts-micro-result'

// ✅ Good for simple, static messages
const NotFound = defineError('NOT_FOUND', 'User not found', 404)
const ServerError = defineError('SERVER_ERROR', 'Internal server error', 500)

// Usage
NotFound()  // { code: 'NOT_FOUND', message: 'User not found', status: 404 }
NotFound({ message: 'Custom message', path: 'user.id' })  // With overrides
```

**Benefits:**
- ✅ Smaller bundle size (no template parsing)
- ✅ Simpler API
- ✅ Better performance
- ✅ Perfect for 90% of use cases

### `defineErrorAdvanced()` - Advanced Version
**Use when:** You need template interpolation with TypeScript autocomplete.

```typescript
import { defineErrorAdvanced } from 'ts-micro-result'

// ✅ Good for dynamic messages with variables
const UserNotFound = defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404)
const ValidationError = defineErrorAdvanced('VALIDATION', 'Field {field} must be {type}', 400)

// Usage with TypeScript autocomplete
UserNotFound({ id: 123 })  // { code: 'USER_NOT_FOUND', message: 'User 123 not found', status: 404 }
ValidationError({ field: 'email', type: 'string' })  // TypeScript suggests: { field, type }
```

**Benefits:**
- ✅ Template interpolation
- ✅ TypeScript autocomplete for template variables
- ✅ Dynamic, context-aware messages
- ✅ Perfect for complex error scenarios

### Bundle Size Impact

```typescript
// Minimal bundle - only simple version
import { defineError } from 'ts-micro-result/factories/errors-simple'

// Minimal bundle - only advanced version  
import { defineErrorAdvanced } from 'ts-micro-result/factories/errors-advanced'

// Both versions (larger bundle)
import { defineError, defineErrorAdvanced } from 'ts-micro-result'
```

---

## 📚 API Reference

### Factory Functions

#### `ok(data?, meta?, status?)`

Create a success result.

```typescript
ok({ id: 1, name: 'John' })
ok(users, { pagination: { page: 1, pageSize: 10, total: 100 } })
ok()  // Void success (status: 204)
```

#### `err(error, meta?, status?)`

Create an error result.

```typescript
err({ code: 'NOT_FOUND', message: 'User not found', status: 404 })
err([
  { code: 'INVALID_EMAIL', message: 'Invalid email', status: 400 },
  { code: 'INVALID_AGE', message: 'Age must be positive', status: 400 }
])
```

#### `defineError(code, message, status?, level?)`

Simple error factory - no template interpolation, just basic functionality.

```typescript
// Basic usage
const userNotFound = defineError('USER_NOT_FOUND', 'User not found', 404)
userNotFound()  // { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 }

// With overrides
userNotFound({ 
  message: 'User with ID 123 not found',
  path: 'user.id',
  meta: { userId: 123 }
})

// Error chaining
const dbError = defineError('DB_ERROR', 'Database error', 500)
const chainedError = userNotFound({ 
  cause: dbError({ message: 'Connection timeout' })
})
```

#### `defineErrorAdvanced(code, template, status?, level?)`

Advanced error factory with template interpolation and complex TypeScript types.

```typescript
// Simple template
const userNotFound = defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404)
userNotFound({ id: 123 })  // TypeScript autocompletes: { id }

// Multiple variables
const validation = defineErrorAdvanced('VALIDATION', 'Field {field} must be {type}', 400)
validation({ field: 'email', type: 'string' })

// No variables
const genericError = defineErrorAdvanced('GENERIC', 'Something went wrong')
genericError()  // No params needed

// Optional status (for non-HTTP contexts)
const logicError = defineErrorAdvanced('LOGIC_ERROR', 'Invalid operation: {op}')
```

#### `validationErrors(errors)`

Create validation errors for multiple fields.

```typescript
validationErrors([
  { path: 'email', message: 'Invalid email address' },
  { path: 'password', message: 'Password too short' }
])
```

#### `ResultImpl` class

Low-level constructor for custom flows. Use this when you need full control over Result creation.

```typescript
import { ResultImpl } from 'ts-micro-result'

// Create success result
const success = new ResultImpl({ id: 1 }, [], 200, { traceId: 'abc-123' })

// Create error result
const error = new ResultImpl(null, [{ code: 'ERROR', message: 'Failed' }], 500)

// Create result without status (for non-HTTP contexts)
const result = new ResultImpl({ data: 'test' }, [])
```

**When to use `ResultImpl` directly:**
- Custom Result creation logic
- Performance-critical code paths
- When you need to avoid function call overhead
- Building higher-level abstractions

**When to use factory functions instead:**
- Most common use cases (recommended)
- Better readability and consistency
- Automatic parameter handling

### Utility Functions

#### `fromJson(json)`

Parse JSON to Result. 

```typescript
const result = fromJson('{"errors":[{"code":"ERROR","message":"Failed"}]}')
```

#### `isResult(value)`

Type guard to check if value is a Result.

```typescript
if (isResult(value)) {
  console.log(value.data)
}
```

#### `inferStatus(result)`

Infer HTTP status code from a Result when status is not explicitly set.

**Priority:**
1. Explicit status if set
2. For success: 200 if has data, 204 if no data
3. For errors: First 5xx error, or first error's status, or 400

```typescript
import { ok, err, inferStatus } from 'ts-micro-result'

// Success with data
const result = ok({ id: 1 })
inferStatus(result)  // 200

// Success without data
const empty = ok()
inferStatus(empty)  // 204

// Error with status
const NotFound = defineError('NOT_FOUND', 'User not found', 404)
const error = err(NotFound())
inferStatus(error)  // 404

// Explicit status takes priority
const custom = ok(data, undefined, 201)
inferStatus(custom)  // 201
```

#### `toHttpResponse(result)`

Convert a Result to HTTP response format with automatic status inference.

```typescript
import { ok, toHttpResponse } from 'ts-micro-result'

// Express/Fastify example
app.get('/api/users/:id', async (req, res) => {
  const result = await getUser(req.params.id)
  const { status, body } = toHttpResponse(result)
  res.status(status).json(body)

### Result Methods

#### `isOk()`

Check if result is successful (no errors). Data might still be null.

```typescript
if (result.isOk()) {
  console.log(result.data)  // data: T | null
}
```

#### `isOkWithData()`

Check if result is successful AND data is not null.

```typescript
if (result.isOkWithData()) {
  console.log(result.data.id)  // data: T (guaranteed non-null)
}
```

#### `isError()`

Check if result has errors (level: 'error' or 'critical').

```typescript
if (result.isError()) {
  logger.error(result.errors)
}
```

#### `hasWarning()`

Check if result has warnings (level: 'warning').

```typescript
if (result.hasWarning()) {
  logger.warn(result.errors)
}
```

#### `map(fn)`

Transform success data. Errors propagate automatically.

```typescript
ok({ price: 100 })
  .map(p => p.price * 1.1)
  .map(p => Math.round(p))
  .map(p => `$${p}`)
// Result: ok("$110")
```

#### `flatMap(fn)`

Chain operations that return Results.

```typescript
getUser(1)
  .flatMap(user => getCompany(user.companyId))
  .map(company => company.name)
```

#### `toJSON()`

Serialize Result to JSON format.

```typescript
result.toJSON()  // Returns JSON object
```

---

## ⚡ Edge Computing

### Performance

- **Package size:** 10.9KB (tarball), 35.8KB (unpacked)
- **Bundle size:** 2.89KB minified (full library)
- **Tree-shakeable:** ~0.8KB for core only (ok/err) with bundlers
- **Memory:** 70% less per Result instance vs object literals
- **Speed:** 50% faster creation, 20-30% faster method calls

### Optimizations

- ✅ Class-based implementation (methods shared via prototype)
- ✅ Array length caching in loops
- ✅ Manual object construction (no spread operators)
- ✅ Status code constants
- ✅ Early returns for common cases

### Runtime Compatibility

Fully compatible with:
- ✅ Cloudflare Workers
- ✅ Vercel Edge Functions
- ✅ Deno Deploy
- ✅ AWS Lambda@Edge
- ✅ Fastly Compute@Edge

**Key features:**
- Zero Node.js dependencies
- Uses only Web Standard APIs
- No dynamic code generation
- Deterministic memory usage

### Edge Examples

**Cloudflare Workers:**

```typescript
import { ok, err, defineError } from 'ts-micro-result'

const rateLimitError = defineError('RATE_LIMIT', 'Rate limit exceeded', 429)

export default {
  async fetch(request: Request): Promise<Response> {
    if (isRateLimited(request)) {
      const result = err(rateLimitError())
      return new Response(JSON.stringify(result.toJSON(true)), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const result = await processRequest(request)
    return new Response(JSON.stringify(result.toJSON(true)), {
      status: result.status || 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

## 💡 Best Practices & Advanced Patterns

### 1. Organize Errors by Domain (Error Groups)

Group related errors together for better organization and maintainability. TypeScript's autocomplete will help you discover available errors.

```typescript
// errors/user.ts
export const UserErrors = {
  NotFound: defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404),
  Unauthorized: defineError('USER_UNAUTHORIZED', 'Unauthorized', 401),
  InvalidEmail: defineErrorAdvanced('USER_INVALID_EMAIL', 'Invalid email: {email}', 400)
} as const

// errors/product.ts
export const ProductErrors = {
  NotFound: defineErrorAdvanced('PRODUCT_NOT_FOUND', 'Product {id} not found', 404),
  OutOfStock: defineErrorAdvanced('PRODUCT_OUT_OF_STOCK', 'Product {id} out of stock', 409)
} as const

// Usage - clean and discoverable
function getUser(id: number) {
  const user = db.findUser(id)
  if (!user) return err(UserErrors.NotFound({ id }))
  return ok(user)
}
```

### 2. Use Error Templates with Smart Autocomplete

Define error templates with placeholders. TypeScript will autocomplete only the template variables you need.

```typescript
const userError = defineErrorAdvanced('USER_NOT_FOUND', 'User {id} not found', 404)

// TypeScript autocomplete shows: { id }
userError({ id: 123 })  // ✅ Clean, focused autocomplete

// Base params (path, meta, cause) are always optional
userError({ 
  id: 123, 
  path: '/users/123',
  meta: { timestamp: Date.now() }
})  // ✅ Still works
```

**Template patterns:**

```typescript
// Simple template
const notFound = defineErrorAdvanced('NOT_FOUND', '{resource} {id} not found', 404)
notFound({ resource: 'User', id: 123 })

// Multiple variables
const validation = defineErrorAdvanced('VALIDATION', 'Field {field} must be {type}', 400)
validation({ field: 'email', type: 'string' })

// No variables
const genericError = defineErrorAdvanced('GENERIC', 'Something went wrong')
genericError()  // No params needed
```

**Why this works:**
- ✅ Reusable error definitions
- ✅ Dynamic, context-aware messages
- ✅ TypeScript autocomplete for template variables
- ✅ Consistent error format

**Avoid:**
```typescript
// ❌ Hardcoded messages for each case
const emailError = defineError('INVALID_EMAIL', 'Email is invalid', 400)
const nameError = defineError('INVALID_NAME', 'Name is invalid', 400)
const ageError = defineError('INVALID_AGE', 'Age is invalid', 400)
```

### 3. Chain Errors for Context Preservation

Preserve the full error context by chaining errors through your application layers.

```typescript
const dbError = defineErrorAdvanced('DB_ERROR', 'Database error: {reason}', 500)
const serviceError = defineError('SERVICE_ERROR', 'Service failed', 500)

async function createUser(data: any) {
  try {
    await db.insert(data)
    return ok(data)
  } catch (e) {
    // ✅ Good - preserve full error chain
    return err(serviceError({
      cause: dbError({ reason: e.message })
    }))
  }
}

// Error chain preserved in response:
// {
//   code: 'SERVICE_ERROR',
//   message: 'Service failed',
//   cause: {
//     code: 'DB_ERROR',
//     message: 'Database error: Connection timeout'
//   }
// }
```

**Why this works:**
- ✅ Full error context for debugging
- ✅ Track errors across application layers
- ✅ Root cause analysis
- ✅ Better logging and monitoring

**Avoid:**
```typescript
// ❌ Losing error context
return err(serviceError())  // Original error lost!
```

### 4. Use Type-Safe Data Handling

Use `isOkWithData()` when you need guaranteed non-null data.

```typescript
const result = await getUser('123')

// ✅ Good - type-safe, data guaranteed non-null
if (result.isOkWithData()) {
  console.log(result.data.id)    // No optional chaining needed
  console.log(result.data.name)  // TypeScript knows data is User
}

// ⚠️ Careful - data might be null
if (result.isOk()) {
  console.log(result.data?.id)  // Need optional chaining
}
```

**When to use each:**
- `isOk()` - When null data is acceptable (e.g., DELETE operations)
- `isOkWithData()` - When you need actual data (e.g., GET operations)

### 5. Leverage Functional Composition

Use `map` and `flatMap` for clean, composable data transformations.

```typescript
// Map - transform success data
ok({ price: 100 })
  .map(p => p.price * 1.1)   // Add 10% tax
  .map(p => Math.round(p))    // Round to nearest dollar
  .map(p => `$${p}`)          // Format as currency
// Result: ok("$110")

// FlatMap - chain operations that return Results
getUser(1)
  .flatMap(user => getCompany(user.companyId))
  .flatMap(company => getDepartment(company.deptId))
  .map(dept => dept.name)
// Result: ok("Engineering")

// Errors propagate automatically - no need for manual checks
err({ code: 'ERROR', message: 'Failed', status: 500 })
  .map(x => x * 2)
  .map(x => x + 1)
// Result: still the same error
```

**Real-world example:**
```typescript
// Process order with automatic error propagation
async function processOrder(orderId: string) {
  return getOrder(orderId)
    .flatMap(order => validateOrder(order))
    .flatMap(order => chargePayment(order))
    .flatMap(order => createShipment(order))
    .map(shipment => ({ 
      orderId, 
      trackingNumber: shipment.trackingNumber 
    }))
}

// Any step that fails will short-circuit and return the error
// No need for nested if/else or try/catch at each step
```

**Why this works:**
- ✅ Clean, linear code flow
- ✅ Automatic error propagation
- ✅ No nested conditionals
- ✅ Composable and testable

### 7. Optimize Bundle Size with Tree-Shaking

All import strategies support tree-shaking! Modern bundlers will only include what you actually use.

```typescript
// ✅ All of these support tree-shaking - choose based on your needs

// Option 1: Root import (convenient, bundler optimizes automatically)
import { ok, err, defineError, inferStatus } from 'ts-micro-result'

// Option 2: Lite entry (minimal for basic usage)
import { ok, err } from 'ts-micro-result/lite'

// Option 3: Subpath imports (granular control)
import { ok } from 'ts-micro-result/factories/ok'
import { err } from 'ts-micro-result/factories/err'
import { defineError } from 'ts-micro-result/factories/errors-simple'

// ❌ Avoid - imports everything
import * as Result from 'ts-micro-result'
```

**Bundle size by import strategy (when using only `ok` and `err`):**
- Root import: ~200-300 bytes (bundler tree-shakes unused exports)
- Lite entry: ~129 bytes (minimal bundle)
- Subpath imports: ~410 bytes (core + factories)
- Full library: ~2.89KB (if you use everything)

**Recommendations:**
- Use **root import** for convenience - bundler handles optimization
- Use **lite entry** for minimal bundle size
- Use **subpath imports** for granular control

### 🌳 Tree-Shaking Explained

Modern bundlers (Webpack, Rollup, Vite) are smart enough to tree-shake even root imports:

```typescript
// This import...
import { ok, err } from 'ts-micro-result'

// ...becomes this in your bundle (only what you use):
// - ok function
// - err function  
// - ResultImpl class (dependency)
// - Required types

// Bundler automatically excludes:
// - defineError
// - defineErrorAdvanced
// - validationErrors
// - fromJson
// - isResult
// - inferStatus
// - toHttpResponse
```

**Why root import is still efficient:**
- ✅ Bundler analyzes your code and only includes used exports
- ✅ No need to worry about import paths
- ✅ Single import statement for multiple functions
- ✅ Automatic dependency resolution

### Package Structure & Import Reference

**Source Code Structure:**
```
ts-micro-result/
├── index.ts                    # Main entry (re-exports everything)
├── lite.ts                     # Minimal entry (core only)
├── core/
│   ├── types.ts               # TypeScript types only
│   └── result.ts              # ResultImpl class implementation
├── factories/
│   ├── ok.ts                  # ok() function
│   ├── err.ts                 # err() function
│   ├── errors-simple.ts       # defineError() function (simple)
│   ├── errors-advanced.ts     # defineErrorAdvanced() function (with templates)
│   └── validation.ts          # validationErrors() function
└── utils/
    ├── serialization.ts       # fromJson() function
    ├── guards.ts              # isResult() function
    └── http.ts                # inferStatus(), toHttpResponse() functions
```

**Package Import Paths:**
- `ts-micro-result` → Main entry (full library, tree-shakeable)
- `ts-micro-result/lite` → Minimal entry (core only, ~129 bytes)
- `ts-micro-result/core/types` → TypeScript types only
- `ts-micro-result/core/result` → ResultImpl class
- `ts-micro-result/factories/ok` → ok() function
- `ts-micro-result/factories/err` → err() function
- `ts-micro-result/factories/errors-simple` → defineError() function (simple)
- `ts-micro-result/factories/errors-advanced` → defineErrorAdvanced() function (with templates)
- `ts-micro-result/factories/validation` → validationErrors() function
- `ts-micro-result/utils/serialization` → fromJson() function
- `ts-micro-result/utils/guards` → isResult() function
- `ts-micro-result/utils/http` → inferStatus(), toHttpResponse() functions

**Tree-shaking support:**
- ✅ All import paths support tree-shaking
- ✅ Root import automatically optimized by bundler
- ✅ Subpath imports for granular control
- ✅ Lite entry for minimal bundle size



## 🛠️ Development

```bash
npm install      # Install dependencies
npm run build    # Build
npm run dev      # Watch mode
npm run clean    # Clean dist
```

---

## 📄 License

MIT

---

**Made with ❤️ for edge computing and TypeScript developers**
