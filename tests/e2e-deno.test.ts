import { assertEquals, assertNotEquals, assert } from "jsr:@std/assert";
import { setupTestEnvironment, testClient } from "./test-utils.ts";
import { closeTestDatabase } from "./database-test.ts";
import { mockAuditLog } from "./audit-log-mock.ts";
import { seedTestUsers, getTestUserToken, testPatients } from "./fixtures.ts";

function teardownTestEnvironment() {
  closeTestDatabase();
}

function clearAuditLogs() {
  mockAuditLog.clear();
}

// Test setup - run once before all tests
let setupComplete = false;
async function ensureSetup() {
  if (!setupComplete) {
    setupTestEnvironment();
    await seedTestUsers();
    setupComplete = true;
  }
}

// Patient Intake Authorization Tests
Deno.test("Patient Intake - Clinician role can use patient intake endpoint", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  const token = getTestUserToken("clinician");
  
  const response = await testClient.post("/api/patients/intake", testPatients.johnDoe, {
    "Authorization": `Bearer ${token}`
  });

  assertEquals(response.status, 201);
  assertEquals(response.body.message, "Patient intake completed successfully");
  assertEquals(response.body.patient.full_name, testPatients.johnDoe.full_name);
  assertEquals(response.body.assigned_clinician, "test_clinician");
  
  // Verify audit log
  const logs = mockAuditLog.getLogsByAction("patient_created");
  assertEquals(logs.length, 1);
});

Deno.test("Patient Intake - Non-Clinician role cannot use patient intake endpoint", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  const token = getTestUserToken("regular");
  
  const response = await testClient.post("/api/patients/intake", testPatients.janeSmith, {
    "Authorization": `Bearer ${token}`
  });

  assertEquals(response.status, 403);
  assertEquals(response.body.error, "Insufficient permissions");
  
  // Verify no audit log for failed attempt
  const logs = mockAuditLog.getLogsByAction("patient_created");
  assertEquals(logs.length, 0);
});

Deno.test("Patient Intake - Unauthenticated user cannot use patient intake endpoint", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  const response = await testClient.post("/api/patients/intake", testPatients.bobJohnson);

  assertEquals(response.status, 401);
  // Should get JWT middleware error
  assert(response.body.error || response.body.message);
  
  // Verify no audit log for unauthenticated attempt
  const logs = mockAuditLog.getLogsByAction("patient_created");
  assertEquals(logs.length, 0);
});

// SSN Redaction Tests
Deno.test("SSN Redaction - Admin role sees unredacted SSN", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  // Create a patient for SSN redaction test
  const clinicianToken = getTestUserToken("clinician");
  
  const createResponse = await testClient.post("/api/patients/intake", {
    ...testPatients.johnDoe,
    ssn: "987-65-1234" // Specific SSN for this test
  }, {
    "Authorization": `Bearer ${clinicianToken}`
  });
    
  assertEquals(createResponse.status, 201);
  const patientId = createResponse.body.patient.id;
  
  // Clear logs from creation
  clearAuditLogs();
  
  // Fetch patient as admin
  const adminToken = getTestUserToken("admin");
  
  const response = await testClient.get(`/api/patients/${patientId}`, {
    "Authorization": `Bearer ${adminToken}`
  });

  assertEquals(response.status, 200);
  assertEquals(response.body.patient.ssn, "987-65-1234", "Admin should see full unredacted SSN");
  
  // Verify audit log
  const logs = mockAuditLog.getLogsByAction("patient_viewed");
  assertEquals(logs.length, 1);
});

Deno.test("SSN Redaction - Non-Admin role sees redacted SSN", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  // Create a patient for SSN redaction test
  const clinicianToken = getTestUserToken("clinician");
  
  const createResponse = await testClient.post("/api/patients/intake", {
    ...testPatients.johnDoe,
    ssn: "555-44-3333" // Specific SSN for this test
  }, {
    "Authorization": `Bearer ${clinicianToken}`
  });
    
  assertEquals(createResponse.status, 201);
  const patientId = createResponse.body.patient.id;
  
  // Clear logs from creation
  clearAuditLogs();
  
  // Fetch patient as clinician (non-admin)
  const response = await testClient.get(`/api/patients/${patientId}`, {
    "Authorization": `Bearer ${clinicianToken}`
  });

  assertEquals(response.status, 200);
  assertEquals(response.body.patient.ssn, "XXX-XX-3333", "Clinician should see redacted SSN with only last 4 digits");
  assertNotEquals(response.body.patient.ssn, "555-44-3333", "SSN should be redacted for non-admin users");
  
  // Verify audit log
  const logs = mockAuditLog.getLogsByAction("patient_viewed");
  assertEquals(logs.length, 1);
});

// Audit Log Verification Tests
Deno.test("Audit Log - Patient creation is logged", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  const token = getTestUserToken("clinician");
  
  const response = await testClient.post("/api/patients/intake", {
    full_name: "Audit Test Patient",
    date_of_birth: "1995-01-01",
    ssn: "111-22-3333",
    symptoms: "Test symptoms"
  }, {
    "Authorization": `Bearer ${token}`
  });

  assertEquals(response.status, 201);

  const logs = mockAuditLog.getLogsByAction("patient_created");
  assertEquals(logs.length, 1);
  assertEquals(logs[0].details?.patient_name, "Audit Test Patient");
});

Deno.test("Audit Log - Patient viewing is logged", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  // First create a patient
  const clinicianToken = getTestUserToken("clinician");
  
  const createResponse = await testClient.post("/api/patients/intake", {
    full_name: "View Test Patient",
    date_of_birth: "1996-01-01", 
    ssn: "222-33-4444",
    symptoms: "Test symptoms"
  }, {
    "Authorization": `Bearer ${clinicianToken}`
  });
    
  assertEquals(createResponse.status, 201);
  const patientId = createResponse.body.patient.id;
  
  // Clear logs from creation
  clearAuditLogs();
  
  // Now view the patient
  const viewResponse = await testClient.get(`/api/patients/${patientId}`, {
    "Authorization": `Bearer ${clinicianToken}`
  });

  assertEquals(viewResponse.status, 200);

  const logs = mockAuditLog.getLogsByAction("patient_viewed");
  assertEquals(logs.length, 1);
  assertEquals(logs[0].details?.patient_name, "View Test Patient");
});

Deno.test("Audit Log - User login is logged", async () => {
  await ensureSetup();
  clearAuditLogs();
  
  const response = await testClient.post("/api/login", {
    username: "test_clinician",
    password: "password123"
  });

  assertEquals(response.status, 200);

  const logs = mockAuditLog.getLogsByAction("user_login");
  assert(logs.length >= 1, "Login should be logged");
});

// Cleanup after all tests
Deno.test("Cleanup - Teardown test environment", () => {
  teardownTestEnvironment();
});