import { sign } from 'hono/jwt';
import { JWT_SECRET_KEY } from "../api/secrets.ts";
import { getDatabase } from "../api/database.ts";

export interface TestUser {
  id?: number;
  username: string;
  password: string;
  role: string;
  token?: string;
}

export interface TestPatient {
  full_name: string;
  date_of_birth: string;
  ssn: string;
  symptoms?: string;
  clinical_notes?: string;
}

export const testUsers: Record<string, TestUser> = {
  clinician: {
    id: 1000,
    username: "test_clinician",
    password: "password123",
    role: "Clinician"
  },
  admin: {
    id: 1001,
    username: "test_admin", 
    password: "password123",
    role: "Admin"
  },
  both: {
    id: 1002,
    username: "test_both", 
    password: "password123",
    role: "Clinician,Admin"
  }
};

export const testPatients: Record<string, TestPatient> = {
  johnDoe: {
    full_name: "John Doe",
    date_of_birth: "1990-01-01",
    ssn: "123-45-6789",
    symptoms: "Headache and fever",
    clinical_notes: "Patient reports symptoms for 3 days"
  },
  janeSmith: {
    full_name: "Jane Smith", 
    date_of_birth: "1985-05-15",
    ssn: "987-65-4321",
    symptoms: "Chest pain",
    clinical_notes: "Referred by primary care physician"
  },
  bobJohnson: {
    full_name: "Bob Johnson",
    date_of_birth: "1992-12-08", 
    ssn: "555-44-3333",
    symptoms: "Back pain",
    clinical_notes: "Work-related injury"
  }
};

export async function seedTestUsers(): Promise<void> {
  const db = getDatabase();
  
  // Insert test users and get their IDs
  for (const [key, user] of Object.entries(testUsers)) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, password, role)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(user.id, user.username, user.password, user.role);
    
    // Get the inserted user ID
    const getUserStmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const insertedUser = getUserStmt.get(user.username) as any;
    
    testUsers[key].id = insertedUser.id;
    
    // Generate JWT token
    const payload = {
      id: insertedUser.id,
      username: insertedUser.username,
      role: insertedUser.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };
    
    testUsers[key].token = await sign(payload, JWT_SECRET_KEY);
  }
}

export function getTestUserToken(userKey: string): string {
  const user = testUsers[userKey];
  if (!user?.token) {
    throw new Error(`Token not found for user: ${userKey}`);
  }
  return user.token;
}

export function getTestUser(userKey: string): TestUser {
  const user = testUsers[userKey];
  if (!user) {
    throw new Error(`User not found: ${userKey}`);
  }
  return user;
}