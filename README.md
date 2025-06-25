# Vite + Deno + React + TypeScript

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

Implementation notes:  I tried to be thoughtful on the core areas of the prompt, while tangental areas (e.g. database) are more prototype style, and I'm aware that they are not necessarilly maintainable choices.

Role based access control: I wanted to have a similar interface for protecting individual fields within a response (e.g. SSN, PII) and protecting entire routes by using a declarative decorator-based syntax. Implementation is in middleware for both.

AuditLogging: I implemented an AuditLog abstraction layer that allows for plugging in different logging/telemetry services.  The example implementation is simply appending to a local file (audit_log.jsonl), but this could easily be swapped out for .

Note: patient_viewed actions will show up duplicated in the logs.  This is expected when running React in a development environment, and would not show up in production.