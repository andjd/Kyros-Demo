import { Database } from "@db/sqlite";
import test from "node:test";

let db: Database | null = null;
let testDb: Database | null = null

export function getDatabase(): Database {
  if (!db) {
    db = new Database("./database.sqlite");
    initializeSchema();
  }
  return testDb || db;
}

export function mockDatabase(new_db) {
  testDb = new_db
}


function initializeSchema() {
  if (!db) return;
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      date_of_birth DATE NOT NULL,
      ssn INTEGER UNIQUE NOT NULL,
      symptoms TEXT,
      clinical_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create junction table for patient-clinician relationship (HABTM)
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient_clinicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      clinician_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (clinician_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (patient_id, clinician_id)
    )
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}