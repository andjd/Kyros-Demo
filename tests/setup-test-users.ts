#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-ffi

import { getDatabase } from "../api/database.ts";

interface TestUser {
  username: string;
  password: string;
  role: string;
}

const testUsers: TestUser[] = [
  {
    username: "test_clinician",
    password: "password123",
    role: "Clinician"
  },
  {
    username: "test_admin",
    password: "password123", 
    role: "Admin"
  },
  {
    username: "test_regular",
    password: "password123",
    role: "Regular"
  }
];

function setupTestUsers() {
  const db = getDatabase();
  
  console.log("Setting up test users...");
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(user.username);
      
      if (existingUser) {
        console.log(`⚠️  User ${user.username} already exists, skipping...`);
        continue;
      }
      
      // Insert the test user
      const stmt = db.prepare(`
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(user.username, user.password, user.role);
      console.log(`✓ Created test user: ${user.username} (${user.role})`);
      
    } catch (error) {
      console.error(`✗ Failed to create user ${user.username}:`, error.message);
    }
  }
  
  console.log("Test user setup complete!");
}

if (import.meta.main) {
  setupTestUsers();
}