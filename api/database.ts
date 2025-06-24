import { Database } from "@db/sqlite";

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = new Database("./database.sqlite");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  if (!db) return;
  
  // Create tables here
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Clinician')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}