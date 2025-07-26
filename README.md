# ts-micro-result

A lightweight TypeScript Result type implementation for functional error handling.

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
```

## API

### Types

- `Result<T>` - Union type representing either success or error
- `ErrorDetail` - Error information structure

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

# Run tests
npm test

# Watch mode for development
npm run dev
```

## License

MIT 