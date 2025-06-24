import { Context } from "hono";
import { getDatabase } from "../database.ts";
import { Allowed, ROLE } from "../rbac.ts";

export class PatientController {
  @Allowed([ROLE.Clinician])
  async postIntake(c: Context) {
    try {
      const payload = c.get("jwtPayload");
      const clinicianId = payload.id;
      
      const {
        full_name,
        date_of_birth,
        ssn,
        symptoms,
        clinical_notes
      } = await c.req.json();

      // Validate required fields
      if (!full_name || !date_of_birth || !ssn) {
        return c.json({ 
          error: "Missing required fields: full_name, date_of_birth, ssn" 
        }, 400);
      }

      const db = getDatabase();
      
      // Start transaction
      db.exec("BEGIN TRANSACTION");
      
      try {
        // Insert patient
        const patientStmt = db.prepare(`
          INSERT INTO patients (full_name, date_of_birth, ssn, symptoms, clinical_notes)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const patientResult = patientStmt.run(
          full_name,
          date_of_birth,
          ssn,
          symptoms || null,
          clinical_notes || null
        );
        
        const patientId = patientResult.lastInsertRowid;
        
        // Assign the creating clinician to the patient
        const assignmentStmt = db.prepare(`
          INSERT INTO patient_clinicians (patient_id, clinician_id)
          VALUES (?, ?)
        `);
        
        assignmentStmt.run(patientId, clinicianId);
        
        db.exec("COMMIT");
        
        return c.json({
          message: "Patient intake completed successfully",
          patient: {
            id: patientId,
            full_name,
            date_of_birth,
            ssn,
            symptoms,
            clinical_notes,
            assigned_clinician: payload.username
          }
        }, 201);
        
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      
    } catch (error) {
      console.error("Patient intake error:", error);
      
      if (error.message.includes("UNIQUE constraint failed: patients.ssn")) {
        return c.json({ error: "A patient with this SSN already exists" }, 409);
      }
      
      return c.json({ error: "Internal server error" }, 500);
    }
  }
}