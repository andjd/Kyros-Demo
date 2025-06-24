import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign, verify } from "@hono/jwt";
import { jwt } from "@hono/jwt";
import { getDatabase } from "./database.ts";

const app = new Hono();

// JWT secret key
const JWT_SECRET = "your-secret-key-change-this-in-production";

app.use("/*", cors());

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

// Login endpoint
app.post("/api/login", async (c) => {
  try {
    const { username, password }: LoginRequest = await c.req.json();

    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = stmt.get(username) as User | undefined;

    if (!user || user.password !== password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Create JWT
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    const token = await sign(payload, JWT_SECRET);

    return c.json({
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Protected route example
app.get("/api/profile", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, new TextEncoder().encode(JWT_SECRET));

    return c.json({
      user: {
        id: payload.id,
        username: payload.username,
        role: payload.role,
      }
    });
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

console.log("Server starting on http://localhost:8000");

Deno.serve({ port: 8000 }, app.fetch);