# ts-micro-result

A tiny Result toolkit for TypeScript services, SDKs, and background jobs. Ship a single union for success, warnings, and failures that travels well across HTTP, gRPC, queues, CLIs, or any other channel you need.

[![npm version](https://img.shields.io/npm/v/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![npm downloads](https://img.shields.io/npm/dm/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![license](https://img.shields.io/npm/l/ts-micro-result.svg)](https://github.com/minhtaimc/ts-micro-result/blob/main/LICENSE)

## Features

- Predictable structure: `data`, `errors`, `status`, and `meta` on every response.
- Type guards that separate success, error, and warning flows with zero boilerplate.
- Declarative error factories you can share between HTTP handlers, workers, and SDKs.
- Included helpers for HTTP status inference and batched validation errors.
- Dependency free, framework agnostic, and tiny enough for edge runtimes.

## Installation

```bash
npm install ts-micro-result
```

## Quick start

```ts
import { ok, err, inferStatus, defineError, type Result } from "ts-micro-result"

const NotFound = defineError("NOT_FOUND", "Resource not found", 404)

export async function getUser(id: string): Promise<Result<User>> {
  const user = await loadUser(id)
  if (!user) {
    return err(NotFound({ meta: { resource: "user", id } }))
  }
  return ok(user, { traceId: crypto.randomUUID() })
}

const result = await getUser("42")
if (result.isError()) {
  logger.warn({ errors: result.errors })
} else {
  cacheUser(result.data)
}

// When exposing over HTTP (optional)
const status = inferStatus(result)
sendJson(status, result)
```

## Error helpers

```ts
import { defineError, validationErrors } from "ts-micro-result"

const Errors = {
  EmailExists: defineError("EMAIL_EXISTS", "Email already in use", 409),
  InvalidCredentials: defineError("INVALID_CREDENTIALS", "Login failed", 401, "warning")
} as const

// Bulk validation for forms, APIs, or message handlers
return validationErrors([
  { path: "email", message: "Invalid email address" },
  { path: "password", message: "Password must be at least 10 characters" }
])
```

## API snapshot

### Types

- `Result<T>` - typed container with `isOk`, `isError`, and `hasWarning`
- `ErrorDetail` - `code`, `message`, optional `status`, `level`, `path`, `meta`
- `ResultMeta` - flexible metadata bag (pagination, trace IDs, timestamps, etc.)
- `ErrorLevel` - `"info" | "warning" | "error" | "critical"`

### Factories

- `createResult(data, errors, status?, meta?)` - low-level constructor for custom flows
- `ok(data?, meta?, status?)` - success result (defaults to status `200`)
- `err(errorOrErrors, meta?, fallbackStatus?)` - error result (defaults to status `400`)
- `defineError(code, message, status, level?)` - reusable error builder

### Helpers

- `validationErrors([{ path, message }])` - compose multiple field/path errors at once
- `inferStatus(result)` - infer the most appropriate HTTP status when you need it

## Usage patterns

- **HTTP / RPC adapters**: serialize `Result` directly, pair with `inferStatus` when mapping to status codes.
- **Queues & background jobs**: attach retry hints or trace IDs through the `meta` field.
- **Frontend SDKs**: use `hasWarning` to surface non-blocking issues while continuing the happy path.
- **CLIs & automation**: return structured errors that translate cleanly to logs or exit codes.

## Development

```bash
npm install
npm run build
npm run dev
```

## License

MIT
