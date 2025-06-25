import { getTestDatabase } from "./database-test.ts";
import { mockAuditLog } from "./audit-log-mock.ts";
import app from "../api/app.ts";

// Setup test environment by overriding global functions
export function setupTestEnvironment() {
  // Override the database getter to use test database
  globalThis.getDatabase = getTestDatabase;
  
  // Override audit log to use mock
  globalThis.auditLog = mockAuditLog;
}

// Create a test client that works with Hono's fetch API
export class TestClient {
  private baseURL = "http://localhost:3000"; // Dummy URL for testing

  async request(method: string, path: string, options: {
    headers?: Record<string, string>;
    body?: any;
  } = {}) {
    const url = new URL(path, this.baseURL);
    
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    const request = new Request(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const response = await app.fetch(request);
    
    // Parse response body
    let body;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      status: response.status,
      headers: response.headers,
      body
    };
  }

  async post(path: string, data?: any, headers?: Record<string, string>) {
    return this.request('POST', path, { body: data, headers });
  }

  async get(path: string, headers?: Record<string, string>) {
    return this.request('GET', path, { headers });
  }

  async put(path: string, data?: any, headers?: Record<string, string>) {
    return this.request('PUT', path, { body: data, headers });
  }

  async delete(path: string, headers?: Record<string, string>) {
    return this.request('DELETE', path, { headers });
  }
}

export const testClient = new TestClient();