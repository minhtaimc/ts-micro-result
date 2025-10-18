# ts-micro-result

A tiny Result toolkit for TypeScript services, SDKs, and background jobs. Ship a single union for success, warnings, and failures that travels well across HTTP, gRPC, queues, CLIs, or any other channel you need.

[![npm version](https://img.shields.io/npm/v/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
![npm bundle size](https://img.shields.io/bundlephobia/min/ts-micro-mediator)
[![npm downloads](https://img.shields.io/npm/dm/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![license](https://img.shields.io/npm/l/ts-micro-result.svg)](https://github.com/minhtaimc/ts-micro-result/blob/main/LICENSE)

---

## 🚀 Quick Start

```bash
npm install ts-micro-result
```

```typescript
import { ok, err, defineError, inferStatus } from 'ts-micro-result'

// Define reusable errors
const NotFound = defineError('NOT_FOUND', 'User {id} not found', 404)

// Return Results from your functions
async function getUser(id: string) {
  const user = await db.findUser(id)
  if (!user) return err(NotFound({ id }))
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

---

## ✨ Features

- ✅ **Predictable structure** - `data`, `errors`, `status`, `meta` on every response
- ✅ **Type-safe** - Full TypeScript support with smart type guards
- ✅ **Error templates** - Dynamic messages with autocomplete: `'User {id} not found'`
- ✅ **Error chaining** - Track error causes through your app layers
- ✅ **Functional** - `map` and `flatMap` for composable operations
- ✅ **Tree-shakeable** - Import only what you need, modular architecture
- ✅ **Edge optimized** - 70% less memory, ~5.8KB minified, works in all edge runtimes
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
import { ok, err, defineError } from 'ts-micro-result'

const NotFound = defineError('NOT_FOUND', '{resource} {id} not found', 404)
const ServerError = defineError('SERVER_ERROR', 'Internal server error', 500)

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
const dbError = defineError('DB_ERROR', 'Database error: {reason}', 500)
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

#### `defineError(code, template, status?, level?)`

Define reusable error templates with TypeScript autocomplete.

```typescript
// Simple template
const userNotFound = defineError('USER_NOT_FOUND', 'User {id} not found', 404)
userNotFound({ id: 123 })  // TypeScript autocompletes: { id }

// Multiple variables
const validation = defineError('VALIDATION', 'Field {field} must be {type}', 400)
validation({ field: 'email', type: 'string' })

// No variables
const genericError = defineError('GENERIC', 'Something went wrong')
genericError()  // No params needed

// Optional status (for non-HTTP contexts)
const logicError = defineError('LOGIC_ERROR', 'Invalid operation: {op}')
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

- **Bundle size:** ~5.8KB minified (full library)
- **Tree-shakeable:** ~2.9KB for core only (ok/err)
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
  NotFound: defineError('USER_NOT_FOUND', 'User {id} not found', 404),
  Unauthorized: defineError('USER_UNAUTHORIZED', 'Unauthorized', 401),
  InvalidEmail: defineError('USER_INVALID_EMAIL', 'Invalid email: {email}', 400)
} as const

// errors/product.ts
export const ProductErrors = {
  NotFound: defineError('PRODUCT_NOT_FOUND', 'Product {id} not found', 404),
  OutOfStock: defineError('PRODUCT_OUT_OF_STOCK', 'Product {id} out of stock', 409)
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
const userError = defineError('USER_NOT_FOUND', 'User {id} not found', 404)

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
const notFound = defineError('NOT_FOUND', '{resource} {id} not found', 404)
notFound({ resource: 'User', id: 123 })

// Multiple variables
const validation = defineError('VALIDATION', 'Field {field} must be {type}', 400)
validation({ field: 'email', type: 'string' })

// No variables
const genericError = defineError('GENERIC', 'Something went wrong')
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
const dbError = defineError('DB_ERROR', 'Database error: {reason}', 500)
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

Import only what you need to minimize bundle size.

```typescript
// ✅ Good - tree-shakeable, minimal bundle
import { ok, err } from 'ts-micro-result'

// ✅ Good - specific imports for maximum control
import { ok } from 'ts-micro-result/factories/ok'
import { err } from 'ts-micro-result/factories/err'

// ❌ Avoid - imports everything
import * as Result from 'ts-micro-result'
```

**Bundle size by import:**
- Core only (`ok`, `err`): ~2.9KB
- + Error templates (`defineError`): +0.9KB
- + Validation (`validationErrors`): +0.3KB
- + Serialization (`fromJson`): +0.6KB
- + HTTP utilities (`inferStatus`, `toHttpResponse`): +0.7KB
- + Type guards (`isResult`): +0.4KB
- Full library: ~5.8KB

See the [Tree-Shaking Guide](#-tree-shaking-guide) section for detailed import strategies.

---

## 🌲 Tree-Shaking Guide

The library is fully tree-shakeable with modular architecture. Import only what you need to minimize bundle size.

### Import Strategies

**Strategy 1: Main Entry (Recommended for most cases)**
```typescript
// Import from main entry - bundler will tree-shake unused exports
import { ok, err, defineError, inferStatus } from 'ts-micro-result'
```

**Strategy 2: Direct Module Imports (Maximum control)**
```typescript
// Core types (types only, no runtime code)
import type { Result, ErrorDetail, ResultMeta, ErrorLevel } from 'ts-micro-result'

// Factory functions
import { ok } from 'ts-micro-result/factories/ok'
import { err } from 'ts-micro-result/factories/err'
import { defineError } from 'ts-micro-result/factories/errors'
import { validationErrors } from 'ts-micro-result/factories/validation'

// Utility functions
import { fromJson } from 'ts-micro-result/utils/serialization'
import { isResult } from 'ts-micro-result/utils/guards'
import { inferStatus, toHttpResponse } from 'ts-micro-result/utils/http'

// Core implementation
import { ResultImpl } from 'ts-micro-result/core/result'
```

**Strategy 3: Mixed Approach (Best of both worlds)**
```typescript
// Import core from main entry
import { ok, err, defineError } from 'ts-micro-result'

// Import specific utilities for better tree-shaking
import { inferStatus } from 'ts-micro-result/utils/http'
import { fromJson } from 'ts-micro-result/utils/serialization'
```

### Bundle Size Analysis

| Import Pattern | Bundle Size | What's Included | Use Case |
|----------------|-------------|-----------------|----------|
| `ok, err` only | ~2.9KB | ResultImpl class + factory functions | Minimal error handling |
| `+ defineError` | +0.9KB | Error template system | Reusable error definitions |
| `+ validationErrors` | +0.3KB | Validation helper | Form validation |
| `+ fromJson` | +0.6KB | JSON serialization | API responses |
| `+ isResult` | +0.4KB | Type guard | Runtime type checking |
| `+ inferStatus, toHttpResponse` | +0.7KB | HTTP utilities | Web APIs |
| `+ ResultImpl` | +0KB | Already included | Direct class usage |
| **Full library** | **~5.8KB** | **Everything** | **Complete toolkit** |

### Module-by-Module Breakdown

| Module | Size | Dependencies | Exports |
|--------|------|--------------|---------|
| `core/result` | ~2.7KB | None | `ResultImpl` class |
| `factories/ok` | ~0.2KB | `core/result` | `ok()` function |
| `factories/err` | ~0.2KB | `core/result` | `err()` function |
| `factories/errors` | ~0.9KB | `core/types` | `defineError()` function |
| `factories/validation` | ~0.3KB | `factories/err`, `factories/errors` | `validationErrors()` function |
| `utils/serialization` | ~0.6KB | `core/result`, `core/types` | `fromJson()` function |
| `utils/guards` | ~0.4KB | `core/types` | `isResult()` function |
| `utils/http` | ~0.7KB | `core/types` | `inferStatus()`, `toHttpResponse()` functions |

### Common Import Patterns

**Pattern 1: Minimal (Core Only)**
```typescript
// Only ok() and err() - smallest bundle
import { ok, err } from 'ts-micro-result'

// Bundle: ~2.9KB
// Use when: Simple success/error handling, non-HTTP contexts
// Example: CLI tools, background jobs, simple scripts
```

**Pattern 2: HTTP APIs (Recommended)**
```typescript
// Core + HTTP helpers + error templates
import { ok, err, defineError, toHttpResponse } from 'ts-micro-result'

// Bundle: ~4.5KB
// Use when: Building HTTP APIs (Express, Fastify, etc.)
// Example: REST APIs, GraphQL resolvers, web services
```

**Pattern 3: Full Featured**
```typescript
// Everything you need
import { ok, err, defineError, validationErrors, fromJson, inferStatus } from 'ts-micro-result'

// Bundle: ~5.8KB
// Use when: Complex applications with validation, serialization, etc.
// Example: Full-stack applications, microservices, enterprise apps
```

**Pattern 4: Edge Computing Optimized**
```typescript
// Minimal core for edge functions
import { ok, err } from 'ts-micro-result'
import { inferStatus } from 'ts-micro-result/utils/http'

// Bundle: ~3.6KB
// Use when: Cloudflare Workers, Vercel Edge Functions, etc.
// Example: Edge APIs, CDN functions, serverless edge computing
```

**Pattern 5: Type-Safe Development**
```typescript
// Core + type guards + error templates
import { ok, err, defineError, isResult } from 'ts-micro-result'

// Bundle: ~4.2KB
// Use when: Type-safe development, runtime validation
// Example: Libraries, SDKs, shared utilities
```

### Tree-Shaking Best Practices

**✅ Do:**
```typescript
// Import only what you need
import { ok, err, defineError } from 'ts-micro-result'

// Use specific imports for utilities
import { inferStatus } from 'ts-micro-result/utils/http'

// Import types separately (no runtime cost)
import type { Result, ErrorDetail } from 'ts-micro-result'
```

**❌ Don't:**
```typescript
// Avoid importing everything
import * as Result from 'ts-micro-result'

// Avoid importing unused functions
import { ok, err, defineError, validationErrors, fromJson, isResult } from 'ts-micro-result'
// Only use: ok, err, defineError

// Avoid importing the entire library when you only need core
import { ok, err } from 'ts-micro-result'
// This is fine - bundler will tree-shake unused exports
```

**🔧 Bundler Configuration:**

**Webpack:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false, // ts-micro-result has no side effects
  }
}
```

**Vite:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false
      }
    }
  }
}
```

**esbuild:**
```javascript
// esbuild.config.js
export default {
  bundle: true,
  treeShaking: true,
  // ts-micro-result is tree-shakeable by default
}
```

### File Structure Reference

```
ts-micro-result/
├── index.ts                    # Main entry (re-exports everything)
├── core/
│   ├── types.ts               # TypeScript types only
│   └── result.ts              # ResultImpl class implementation
├── factories/
│   ├── ok.ts                  # ok() function
│   ├── err.ts                 # err() function
│   ├── errors.ts              # defineError() function
│   └── validation.ts          # validationErrors() function
└── utils/
    ├── serialization.ts       # fromJson() function
    ├── guards.ts              # isResult() function
    └── http.ts                # inferStatus(), toHttpResponse() functions
```



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
