import { Database } from "@db/sqlite";

let testDatabase: Database | null = null;

export function getTestDatabase(): Database {
  if (!testDatabase) {
    // Create in-memory database
    testDatabase = new Database(":memory:");
    
    // Create tables
    testDatabase.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    testDatabase.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        ssn INTEGER NOT NULL UNIQUE,
        symptoms TEXT,
        clinical_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    testDatabase.exec(`
      CREATE TABLE IF NOT EXISTS patient_clinicians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        clinician_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (clinician_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(patient_id, clinician_id)
      );
    `);
  }
  
  return testDatabase;
}

export function resetTestDatabase() {
  if (testDatabase) {
    testDatabase.exec("DELETE FROM patient_clinicians");
    testDatabase.exec("DELETE FROM patients");
    testDatabase.exec("DELETE FROM users");
  }
}

export function closeTestDatabase() {
  if (testDatabase) {
    testDatabase.close();
    testDatabase = null;
  }
}