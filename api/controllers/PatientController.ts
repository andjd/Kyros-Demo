import type { Context } from "hono";
import { Allowed, ROLE } from "../middleware/rbac.ts";
import { PatientModel } from "../models/PatientModel.ts";
import { validateAndParseSSN } from "../utils/ssnValidator.ts";

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

      // Validate and parse SSN
      let parsedSSN: number;
      try {
        parsedSSN = validateAndParseSSN(ssn);
      } catch (error) {
        return c.json({ 
          error: `Invalid SSN: ${error.message}` 
        }, 400);
      }

      // Create patient using the model
      const patient = PatientModel.create({
        full_name,
        date_of_birth,
        ssn: parsedSSN,
        symptoms,
        clinical_notes
      }, clinicianId);
      
      return c.json({
        message: "Patient intake completed successfully",
        patient: patient,
        assigned_clinician: payload.username
      }, 201);
      
    } catch (error) {
      console.error("Patient intake error:", error);
      
      if (error.message.includes("UNIQUE constraint failed: patients.ssn")) {
        return c.json({ error: "A patient with this SSN already exists" }, 409);
      }
      
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  @Allowed([ROLE.Clinician, ROLE.Admin])
  async getPatients(c: Context) {
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
      
      return c.json({
        patients: patients
      });
      
    } catch (error) {
      console.error("Get patients error:", error);
      return c.json({ error: "Internal server error" }, 500);
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
        return c.json({ error: "Patient not found" }, 404);
      }
      
      // If user is not an Admin, check if they are assigned to this patient
      if (!userRoles.includes(ROLE.Admin)) {
        const assignedClinicians = patient.getAssignedClinicians();
        const isAssigned = assignedClinicians.some(clinician => clinician.id === payload.id);
        
        if (!isAssigned) {
          return c.json({ error: "Patient not found" }, 404);
        }
      }
      
      return c.json({
        patient: patient
      });
      
    } catch (error) {
      console.error("Get patient error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
}