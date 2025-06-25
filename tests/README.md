# End-to-End Tests

This directory contains end-to-end tests for the patient management system using both traditional approach and modern testing frameworks.

## Test Coverage

The tests cover the following scenarios:

1. **Patient Intake Authorization**
   - ✅ Clinician role can use patient intake endpoint
   - ✅ Non-Clinician role cannot use patient intake endpoint  
   - ✅ Unauthenticated user cannot use patient intake endpoint

2. **SSN Redaction**
   - ✅ Admin role sees unredacted SSN (full SSN: 123-45-6789)
   - ✅ Non-Admin role sees redacted SSN (redacted: XXX-XX-6789)

3. **Audit Logging**
   - ✅ Patient creation is logged
   - ✅ Patient viewing is logged
   - ✅ User login is logged

## Test Approaches


### 2. Deno Standard + Custom Test Client Tests (`e2e-deno.test.ts`) ⭐ **Recommended**
- Uses **Deno's standard test runner** and **custom Hono-compatible test client**
- **In-memory database** for isolation
- **Mock audit logging** for faster tests
- No external dependencies or server setup required

## Files Structure

```
tests/
├── README.md                 # This file
├── e2e.test.ts              # Original tests (requires server)
├── e2e-deno.test.ts         # Deno standard + custom test client (isolated)
├── test-utils.ts            # Custom Hono-compatible test client
├── test-server.ts           # Test server setup with mocks
├── database-test.ts         # In-memory database adapter
├── audit-log-mock.ts        # Mock audit log implementation
├── fixtures.ts              # Test data and user fixtures
├── setup-test-users.ts      # Script to create test users (for original tests)
```

## Running Tests

### Deno Standard + Custom Test Client (Recommended)
```bash
# Run isolated tests with in-memory database
deno task test
```

### Original Tests (Requires Server)
1. **Start the API server:**
   ```bash
   deno task api
   ```

2. **Set up test users** (run once):
   ```bash
   deno task setup-test-users
   ```

3. **Run tests:**
   ```bash
   deno task test
   ```

## Test Features

### In-Memory Database
- SQLite in-memory database (`:memory:`)
- Fresh database for each test run
- No persistent data or cleanup required

### Mock Audit Log
- Captures all audit events during tests
- Queryable by user, action, or details
- Automatic cleanup between tests

### Test Fixtures
- Pre-defined test users (Admin, Clinician, Regular)
- JWT tokens automatically generated
- Sample patient data for consistent testing

### Custom Test Client
- Hono-compatible HTTP testing
- Uses native Fetch API
- Direct integration with Hono app
- No external HTTP dependencies

## Benefits of Deno Standard + Custom Test Client Approach

✅ **Isolation**: Each test runs with clean in-memory database  
✅ **Speed**: No external server or database I/O  
✅ **Reliability**: No race conditions or port conflicts  
✅ **Maintainability**: Self-contained test environment  
✅ **Debugging**: Full control over test data and state  

## Troubleshooting

**Deno standard tests fail:**
- Check import paths in test files
- Ensure all dependencies are in deno.json

**Original tests fail with "Login failed":**
- Ensure test users are created: `deno task setup-test-users`
- Verify API server is running: `deno task api`

**Database errors in original tests:**
- Check database file permissions
- Ensure database schema is up to date