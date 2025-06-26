# Kyros Demo

## Running

1. Install Deno using homebrew `brew install deno` or the instructions on Deno's website: https://docs.deno.com/runtime/

2. Add dependencies using `deno install`

3. Create users. Users can only be created on the command line using `deno task create-user` The program will walk you through creating a username, password, and assigning roles.  You may want to run this multiple times to create Admin and Clinician users.

4. Run the servers using `deno task start`

You should see this in your console: 
```
  VITE v6.3.5  ready in 93 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

5. Copy and paste the url into your browser to see the app.

You can also run the tests with `deno task test`

Implementation notes:  I tried to be thoughtful on the core areas of the prompt, while tangental areas (e.g. database) are more prototype level code. I'm aware that they are not necessarilly maintainable choices.

Role based access control: I wanted to have a similar interface for protecting individual fields within a response (e.g. SSN, PII) and protecting entire routes by using a declarative decorator-based syntax. Implementation is in middleware for both.

AuditLogging: I implemented an AuditLog abstraction layer that allows for plugging in different logging/telemetry services.  The example implementation is simply appending to a local file (audit_log.jsonl), but this could easily be swapped out for a SaaS such as Sentry in the future.

Note: patient_viewed actions will show up duplicated in the logs.  This is expected when running React in a development environment, and would not show up in production.

Tests are presented as an example of possible tests, and are not intended to be a complete test suite for this application.  They can be found in tests/e2e.test.ts.  In these tests, I only test whether the SSNs appear redacted in the JSON api, since the UI cannot display data it does not have. Additional browser automation tests using Selenium or Playwright could be added to verify this, but given the current state of the frontend (which dosen't retain state between components), it feels like overkill.