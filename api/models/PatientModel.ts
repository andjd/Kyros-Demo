import "reflect-metadata";
import { Transform, Exclude, Expose } from "class-transformer";
import { getDatabase } from "../database.ts";
import { ROLE } from "../middleware/rbac.ts";
import { nanoid } from "https://deno.land/x/nanoid/mod.ts";

export class PatientModel {
  @Expose()
  id!: string;

  @Expose()
  full_name!: string;

  @Expose()
  date_of_birth!: string;

  @Expose()
  @Transform(({ value, _, options}) => {
    const userRoles = options?.groups || [];
    
    // Convert number to formatted string
    const ssnDigits = value.toString().padStart(9, '0');
    const ssnString = `${ssnDigits.slice(0, 3)}-${ssnDigits.slice(3, 5)}-${ssnDigits.slice(5, 9)}`;
    
    // If user has Admin role, show full SSN
    if (userRoles.includes(ROLE.Admin)) {
      return ssnString;
    }
    
    // For Clinicians or others, redact SSN - keep last 4 digits
    if (ssnString) {
      const parts = ssnString.split('-');
      if (parts.length === 3) {
        return `XXX-XX-${parts[2]}`;
      }
      // Fallback - keep last 4 characters
      return 'XXX-XX-' + ssnString.slice(-4);
    }
    
    return 'XXX-XX-XXXX';
  })
  ssn!: number;

  @Expose()
  symptoms?: string;

  @Expose()
  clinical_notes?: string;

  @Expose()
  created_at!: string;

  @Expose()
  updated_at!: string;

  constructor(data?: Partial<PatientModel>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // Static factory methods for database operations
  static create(patientData: {
    full_name: string;
    date_of_birth: string;
    ssn: number;
    symptoms?: string;
    clinical_notes?: string;
  }, clinicianId: number): PatientModel {
    const db = getDatabase();
    const patientId = nanoid();
    
    // Start transaction
    db.exec("BEGIN TRANSACTION");
    
    try {
      // Insert patient
      const patientStmt = db.prepare(`
        INSERT INTO patients (id, full_name, date_of_birth, ssn, symptoms, clinical_notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      patientStmt.run(
        patientId,
        patientData.full_name,
        patientData.date_of_birth,
        patientData.ssn,
        patientData.symptoms || null,
        patientData.clinical_notes || null
      );
      
      // Assign the creating clinician to the patient
      const assignmentStmt = db.prepare(`
        INSERT INTO patient_clinicians (patient_id, clinician_id)
        VALUES (?, ?)
      `);
      
      assignmentStmt.run(patientId, clinicianId);
      
      db.exec("COMMIT");
      
      // Return the created patient
      return PatientModel.findById(patientId)!;
      
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  static findById(id: string): PatientModel | null {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM patients WHERE id = ?`);
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return new PatientModel(row as any);
  }

  static findByClinicianId(clinicianId: number): PatientModel[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT p.* FROM patients p
      INNER JOIN patient_clinicians pc ON p.id = pc.patient_id
      WHERE pc.clinician_id = ?
      ORDER BY p.created_at DESC
    `);
    
    const rows = stmt.all(clinicianId);
    return rows.map(row => new PatientModel(row as any));
  }

  static findAll(): PatientModel[] {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM patients ORDER BY created_at DESC`);
    const rows = stmt.all();
    return rows.map(row => new PatientModel(row as any));
  }

  // Instance methods
  save(): PatientModel {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE patients 
      SET full_name = ?, date_of_birth = ?, ssn = ?, symptoms = ?, clinical_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      this.full_name,
      this.date_of_birth,
      this.ssn,
      this.symptoms || null,
      this.clinical_notes || null,
      this.id
    );
    
    return PatientModel.findById(this.id)!;
  }

  delete(): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM patients WHERE id = ?`);
    stmt.run(this.id);
    return true
  }

  // Helper method to get assigned clinicians
  getAssignedClinicians(): any[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.role, pc.assigned_at
      FROM users u
      INNER JOIN patient_clinicians pc ON u.id = pc.clinician_id
      WHERE pc.patient_id = ?
    `);
    
    const rows = stmt.all(this.id)
    return rows.map(row => new PatientModel(row as any));
  }

  // Assign a clinician to this patient
  assignClinician(clinicianId: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO patient_clinicians (patient_id, clinician_id)
      VALUES (?, ?)
    `);
    
    stmt.run(this.id, clinicianId);
    return true;
  }

  // Remove a clinician from this patient
  unassignClinician(clinicianId: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM patient_clinicians 
      WHERE patient_id = ? AND clinician_id = ?
    `);
    
    stmt.run(this.id, clinicianId);
    return true;
  }
}