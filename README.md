# ts-micro-result

A lightweight TypeScript Result type implementation for functional error handling with comprehensive error support.

[![npm version](https://img.shields.io/npm/v/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![npm downloads](https://img.shields.io/npm/dm/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![bundle size](https://img.shields.io/bundlephobia/min/ts-micro-result)](https://bundlephobia.com/package/ts-micro-result)
[![license](https://img.shields.io/npm/l/ts-micro-result.svg)](https://github.com/minhtaimc/ts-micro-result/blob/main/LICENSE)

## Features

- ⚡ **Ultra lightweight** - Only ~500B minified and gzipped
- 🛡️ **Type-safe** - Full TypeScript support with type guards
- 🔧 **Flexible error handling** - Support for both simple and complex error structures
- 📦 **Zero dependencies** - No external dependencies required
- 🎯 **Simple API** - Easy to use with minimal learning curve

## Installation

```bash
npm install ts-micro-result
```

## Usage

```typescript
import { Result, ok, err, ErrorDetail, ErrorIssue, hasIssues } from 'ts-micro-result';

// Success case
const successResult: Result<string> = ok("Hello, World!");

// Error case
const errorDetail: ErrorDetail = {
  code: "VALIDATION_ERROR",
  message: "Invalid input"
};
const errorResult: Result<never> = err(errorDetail);

// Type-safe handling using methods
function handleResult(result: Result<string>) {
  if (result.isOk()) {
    console.log("Success:", result.data); // TypeScript knows this is string
  } else {
    console.log("Error:", result.error.code, result.error.message);
  }
}

// Common ErrorDetail examples
const commonErrors = {
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data"
  },
  NOT_FOUND: {
    code: "NOT_FOUND", 
    message: "Resource not found"
  },
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    message: "Access denied"
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    message: "Internal server error"
  },
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    message: "Network connection failed"
  }
} as const;

// Using predefined errors
const userNotFound = err(commonErrors.NOT_FOUND);
const validationFailed = err(commonErrors.VALIDATION_ERROR);

// Field-level errors with issues
const fieldErrors = {
  email: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    issues: [
      { path: "email", message: "Invalid email format" },
      { path: "email", message: "Email is required" }
    ]
  },
  password: {
    code: "VALIDATION_ERROR", 
    message: "Password validation failed",
    issues: [
      { path: "password", message: "Password must be at least 8 characters" },
      { path: "password", message: "Password must contain uppercase letter" }
    ]
  }
} as const;

// Using field-level errors
const emailError = err(fieldErrors.email);
const passwordError = err(fieldErrors.password);

// Handling field-level errors
function handleValidationError(result: Result<string>) {
  if (result.isError()) {
    console.log("Error:", result.error.message);
    if (hasIssues(result.error)) {
      result.error.issues!.forEach(issue => {
        console.log(`Field ${issue.path}: ${issue.message}`);
      });
    }
  }
}
```

## API Reference

### Types

- `Result<T>` - Union type representing either success or error
- `ErrorDetail` - Error information structure with optional code, message and optional issues array
- `ErrorIssue` - Individual error issue with required path for field-level errors

### Functions

- `ok<T>(data?: T): Result<T>` - Creates a success result
- `err(error: ErrorDetail): Result<never>` - Creates an error result
- `hasIssues(error: ErrorDetail): boolean` - Checks if error has validation issues

### Methods

- `result.isOk(): this is Ok<T>` - Type guard to check if result is success
- `result.isError(): this is Err` - Type guard to check if result is error

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev
```

## License

MIT 