import app from "./app.ts"

console.log("Server starting on http://localhost:8000");

Deno.serve({ port: 8000 }, app.fetch);