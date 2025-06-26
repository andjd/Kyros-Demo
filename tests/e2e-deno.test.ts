import { assertEquals } from "jsr:@std/assert";
import { setupTestEnvironment, cleanupTestEnvironment, testClient } from "./test-utils.ts";
import { closeTestDatabase, resetTestDatabase } from "./database-test.ts";
import { mockAuditLog } from "./audit-log-mock.ts";
import { seedTestUsers, getTestUserToken, testPatients } from "./fixtures.ts";
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
      console.dir(response)
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

    })

    it("shows clinicians redacted SSNs", async () => {

    })
  })

  describe("Audit Logging", () => {
    it("logs when a patient is created", async () => {

    })

    it("logs whin a patient is viewed", async () => {

    })

    it("logs when a user logs in", async () => {

    })
  })
})
