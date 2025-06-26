import type { Context } from "hono";
import { Allowed, ROLE } from "../middleware/rbac.ts";
import { PatientModel } from "../models/PatientModel.ts";
import { validateAndParseSSN } from "../utils/ssnValidator.ts";
import { auditLog } from "../audit/AuditLog.ts";

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
        c.status(400)
        return c.render({ 
          error: "Missing required fields: full_name, date_of_birth, ssn" 
        });
      }

      // Validate and parse SSN
      let parsedSSN: number;
      try {
        parsedSSN = validateAndParseSSN(ssn);
      } catch (error) {
        c.status(400)
        return c.render({ 
          error: `Invalid SSN: ${error.message}` 
        })
      }

      // Create patient using the model
      const patient = PatientModel.create({
        full_name,
        date_of_birth,
        ssn: parsedSSN,
        symptoms,
        clinical_notes
      }, clinicianId);

      // Audit log the patient creation
      auditLog.log(
        payload,
        "patient_created",
        { 
          patient_id: patient.id,
          patient_name: patient.full_name,
        }
      );
      c.status(201)
      return c.render({
        message: "Patient intake completed successfully",
        patient: patient,
        assigned_clinician: payload.username
      });
      
    } catch (error) {
      console.error("Patient intake error:", error);
      
      if (error.message.includes("UNIQUE constraint failed: patients.ssn")) {
        c.status(409)
        return c.render({ error: "A patient with this SSN already exists" });
      }
      c.status(500)
      return c.render({ error: "Internal server error" });
    }
  }

  @Allowed([ROLE.Clinician, ROLE.Admin])
  getPatients(c: Context) {
    try {
      const payload = c.get("jwtPayload");
      const userRoles = payload.role.split(',').map((r: string) => r.trim());
      
      let patients: PatientModel[];
      
      // Admins can see all patients, Clinicians only see their assigned patients
      if (userRoles.includes(ROLE.Admin)) {
        patients = PatientModel.findAll();
      } else {
        patients = PatientModel.findByClinicianId(payload.id);
      }

      return c.render({
        patients: patients
      });
      
    } catch (error) {
      console.error("Get patients error:", error);
      c.status(500)
      return c.render({ error: "Internal server error" });
    }
  }

  @Allowed([ROLE.Clinician, ROLE.Admin])
  async getPatient(c: Context) {
    try {
      const payload = c.get("jwtPayload");
      const userRoles = payload.role.split(',').map((r: string) => r.trim());
      const patientId = c.req.param('id');
      
      const patient = PatientModel.findById(patientId);
      
      if (!patient) {
        c.status(404)
        return c.render({ error: "Patient not found" });
      }
      
      // If user is not an Admin, check if they are assigned to this patient
      if (!userRoles.includes(ROLE.Admin)) {
        const assignedClinicians = patient.getAssignedClinicians();
        const isAssigned = assignedClinicians.some(clinician => clinician.id === payload.id);
        
        if (!isAssigned) {
          c.status(404)
          return c.render({ error: "Patient not found" });
        }
      }
      // Audit log the patient view
      auditLog.log(
        payload,
        "patient_viewed",
        { 
          patient_id: patient.id,
          patient_name: patient.full_name,
        }
      );
      
      return c.render({
        patient: patient
      });
      
    } catch (error) {
      console.error("Get patient error:", error);
      c.status(500)
      return c.render({ error: "Internal server error" });
    }
  }
}