# ts-micro-result

A lightweight TypeScript Result type implementation for functional error handling with comprehensive error support.

[![npm version](https://img.shields.io/npm/v/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
[![npm downloads](https://img.shields.io/npm/dm/ts-micro-result.svg)](https://www.npmjs.com/package/ts-micro-result)
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
import { Result, ok, err, ErrorDetail } from 'ts-micro-result';

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

## Common Data Patterns

### Validation Errors
const validationError = {
  code: "VALIDATION_ERROR",
  message: "Validation failed",
  data: {
    fields: [
      { field: "email", message: "Invalid email format", value: "invalid-email" },
      { field: "password", message: "Password too short", value: "123" },
      { field: "age", message: "Age must be positive", value: -5 }
    ],
    totalErrors: 3
  }
} as const;

### Web API Errors
const apiError = {
  code: "UNAUTHORIZED",
  message: "Access denied",
  data: {
    status: 401,
    timestamp: new Date().toISOString(),
    requestId: "req_12345",
    endpoint: "/api/users/profile"
  }
} as const;

### Database Errors
const dbError = {
  code: "DATABASE_ERROR",
  message: "Failed to create user",
  data: {
    operation: "INSERT",
    table: "users",
    constraint: "unique_email",
    attemptedValue: "user@example.com",
    originalError: "duplicate key value violates unique constraint"
  }
} as const;

### Business Logic Errors
const businessError = {
  code: "INSUFFICIENT_BALANCE",
  message: "Account balance too low",
  data: {
    currentBalance: 50.00,
    requiredAmount: 100.00,
    accountId: "acc_67890",
    currency: "USD",
    lastTransaction: "2024-01-15T10:30:00Z"
  }
} as const;

// Using errors with data
const emailError = err(validationError);
const accessError = err(apiError);
const databaseError = err(dbError);
const balanceError = err(businessError);

## Error Handling Examples

### Validation Error Handling
function handleValidationError(result: Result<string>) {
  if (result.isError() && result.error.data?.fields) {
    console.log("Validation failed with", result.error.data.totalErrors, "errors:");
    result.error.data.fields.forEach(field => {
      console.log(`- ${field.field}: ${field.message} (value: ${field.value})`);
    });
  }
}

### API Error Handling
function handleApiError(result: Result<string>) {
  if (result.isError() && result.error.data?.status) {
    console.log(`HTTP ${result.error.data.status}: ${result.error.message}`);
    console.log(`Request ID: ${result.error.data.requestId}`);
    console.log(`Endpoint: ${result.error.data.endpoint}`);
    console.log(`Timestamp: ${result.error.data.timestamp}`);
  }
}

### Database Error Handling
function handleDatabaseError(result: Result<string>) {
  if (result.isError() && result.error.data?.operation) {
    console.log(`Database ${result.error.data.operation} failed on table ${result.error.data.table}`);
    console.log(`Constraint: ${result.error.data.constraint}`);
    console.log(`Value: ${result.error.data.attemptedValue}`);
    console.log(`Original error: ${result.error.data.originalError}`);
  }
}

### Business Logic Error Handling
function handleBusinessError(result: Result<string>) {
  if (result.isError() && result.error.data?.currentBalance !== undefined) {
    console.log(`Business rule violation: ${result.error.message}`);
    console.log(`Current balance: $${result.error.data.currentBalance}`);
    console.log(`Required amount: $${result.error.data.requiredAmount}`);
    console.log(`Account: ${result.error.data.accountId}`);
    console.log(`Currency: ${result.error.data.currency}`);
  }
}
```

## API Reference

### Types

- `Result<T>` - Union type representing either success or error
- `ErrorDetail` - Error information structure with optional code, message and optional data object

### Functions

- `ok<T>(data?: T): Result<T>` - Creates a success result
- `err(error: ErrorDetail): Result<never>` - Creates an error result

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