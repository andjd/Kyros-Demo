import { getDatabase } from "../database.ts";

function prompt(message: string): string {
  console.log(message);
  const buf = new Uint8Array(1024);
  const n = Deno.stdin.readSync(buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

function main() {
  console.log("Creating a new user...\n");
  
  const username = prompt("Enter username:");
  if (!username) {
    console.error("Username is required");
    Deno.exit(1);
  }
  
  const password = prompt("Enter password:");
  if (!password) {
    console.error("Password is required");
    Deno.exit(1);
  }
  
  console.log("Select role(s):");
  console.log("1. Admin");
  console.log("2. Clinician");
  console.log("3. Both Admin and Clinician");
  const roleInput = prompt("Enter choice (1, 2, or 3):");
  
  let role: string;
  if (roleInput === "1") {
    role = "Admin";
  } else if (roleInput === "2") {
    role = "Clinician";
  } else if (roleInput === "3") {
    role = "Admin,Clinician";
  } else {
    console.error("Invalid role selection");
    Deno.exit(1);
  }
  
  try {
    const db = getDatabase();
    const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    stmt.run(username, password, role);
    
    console.log(`\nUser '${username}' created successfully with role '${role}'`);
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.error("Username already exists");
    } else {
      console.error("Error creating user:", error.message);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}