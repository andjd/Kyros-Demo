import { assertEquals } from "jsr:@std/assert";
import { delay } from "jsr:@std/async"
import { setupTestEnvironment, cleanupTestEnvironment, testClient } from "./test-utils.ts";
import { closeTestDatabase, resetTestDatabase } from "./database-test.ts";
import * as mockAuditLog from "./audit-log-mock.ts";
import { seedTestUsers, getTestUserToken, testPatients, testUsers } from "./fixtures.ts";
import {
  beforeEach,
  describe,
  it,
  beforeAll,
  afterAll,
} from "jsr:@std/testing/bdd";

describe("Application", () => {
  beforeAll(async () => {
    setupTestEnvironment()
    await seedTestUsers()
  })

  afterAll(() => {
    cleanupTestEnvironment();
    closeTestDatabase();
  })

  beforeEach(async () => {
    mockAuditLog.clear()
    resetTestDatabase()
    await seedTestUsers()
  })

  describe("Patient Intake Permissions", () => {

    it("Allows Clinicians to create patient records", async () => {
      const token = getTestUserToken("clinician");
  
      const response = await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${token}`
      });

      assertEquals(response.status, 201);
    })

    it("Does not allow Admins to create patient records", async () => {
      const token = getTestUserToken("admin");
  
      const response = await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${token}`
      });
    
      assertEquals(response.status, 403);
    })

    it("Allows Admin to create paitent records if they also have the Clinician role", async () => {
      const token = getTestUserToken("both");
  
      const response = await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${token}`
      });

      assertEquals(response.status, 201);
    })

    it("Does not allow non-logged in users to create patient records", async () => {
  
      const response = await testClient.post("/api/patients/intake", testPatients.johnDoe);

      assertEquals(response.status, 401);
    })
  })

  describe("SSN Redaction", () => {
    it("shows Admins unredacted SSNs", async () => {
      const clinicianToken = getTestUserToken("clinician");
      const adminToken = getTestUserToken("admin");

      // Create a patient first
      await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${clinicianToken}`
      });

      // Admin should see full SSN
      const adminResponse = await testClient.get("/api/patients", {
        "Authorization": `Bearer ${adminToken}`
      });
      assertEquals(adminResponse.status, 200);
      assertEquals(adminResponse.body.patients[0].ssn, "123-45-6789");
    })

    it("shows clinicians redacted SSNs", async () => {
      const clinicianToken = getTestUserToken("clinician");

      // Create a patient
      await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${clinicianToken}`
      });

      // Clinician should see redacted SSN
      const clinicianResponse = await testClient.get("/api/patients", {
        "Authorization": `Bearer ${clinicianToken}`
      });

      assertEquals(clinicianResponse.status, 200);
      assertEquals(clinicianResponse.body.patients[0].ssn, "XXX-XX-6789");
    })
  })

  describe("Audit Logging", () => {
    it("logs when a patient is created", async () => {
      const clinicianToken = getTestUserToken("clinician");

      const response = await testClient.post("/api/patients/intake", testPatients.johnDoe, {
        "Authorization": `Bearer ${clinicianToken}`
      });

      assertEquals(response.status, 201);
      await delay(5)
      const logs = mockAuditLog.getLogs();
      assertEquals(logs.length, 1);

      const patientCreationLog = logs[logs.length - 1];
      assertEquals(patientCreationLog.action, "patient_created");
      assertEquals(patientCreationLog.userId, testUsers.clinician.id);
      assertEquals(patientCreationLog.payload.patient_name, "John Doe");
    })

    it("logs when a patient is viewed", async () => {
      const clinicianToken = getTestUserToken("clinician");

      // Create a patient first
      const createResponse = await testClient.post("/api/patients/intake", testPatients.janeSmith, {
        "Authorization": `Bearer ${clinicianToken}`
      });
      assertEquals(createResponse.status, 201);
      const patientID = createResponse.body.patient.id
      await delay(5)
      mockAuditLog.clear()

      // View the patient
      const viewResponse = await testClient.get(`/api/patients/${patientID}`, {
        "Authorization": `Bearer ${clinicianToken}`
      });


      assertEquals(viewResponse.status, 200);
      await delay(5)
      
      const logs = mockAuditLog.getLogs();
      assertEquals(logs.length, 1);
      const patientViewLog = logs[0];
      assertEquals(patientViewLog.action, "patient_viewed");
      assertEquals(patientViewLog.userId, testUsers.clinician.id);
    })

    it("logs when a user logs in", async () => {

      const response = await testClient.post("/api/login", {
        username: "test_clinician",
        password: "password123"
      });

      assertEquals(response.status, 200);
      await delay(5)
      const logs = mockAuditLog.getLogs();
      assertEquals(logs.length, 1);

      const loginLog = logs[0];
      assertEquals(loginLog.action, "user_login");
      assertEquals(loginLog.userId, testUsers.clinician.id);
    })
  })
})
