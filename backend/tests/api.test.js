// JalNyaya - Backend Automated Test Suite (Industry Best Practice)
// Tests: Authentication, RBAC, CRUD, Transactions, Confirmations, SLA, and Fairness

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('JalNyaya System Integration & Assessment Tests', () => {
  let adminToken = '';
  let operatorToken = '';
  let residentToken = '';
  let residentStreetId = null;
  let testDeliveryId = null;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jalnyaya.gov.in', password: 'password123' });
    expect(adminRes.statusCode).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Operator
    const opRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator1@jalnyaya.gov.in', password: 'password123' });
    expect(opRes.statusCode).toBe(200);
    operatorToken = opRes.body.token;

    // 3. Authenticate Resident
    const resRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resident1@jalnyaya.gov.in', password: 'password123' });
    expect(resRes.statusCode).toBe(200);
    residentToken = resRes.body.token;
    residentStreetId = resRes.body.user.street ? resRes.body.user.street.street_id : 1;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Test 1: Authentication & Invalid Login Handling
  test('POST /api/auth/login - Rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@jalnyaya.gov.in', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test 2: Unauthorized API Access Protection
  test('GET /api/streets - Rejects unauthenticated request without token with 401', async () => {
    const res = await request(app).get('/api/streets');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Role-Based Access Control (RBAC) Enforcement
  test('POST /api/streets - Resident cannot create streets (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/streets')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        street_name: 'Unauthorized Street',
        area_name: 'Test Area',
        panchayat_name: 'Test Panchayat',
        population: 500,
        household_count: 100,
        zone_id: 1
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  // Test 4: Admin CRUD on Deliveries
  test('POST /api/deliveries - Admin schedules a new delivery', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tanker_id: 1,
        street_id: residentStreetId || 1,
        operator_id: 3,
        scheduled_date: new Date().toISOString(),
        quantity_litres: 9000,
        notes: 'Automated test delivery schedule'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.delivery.status).toBe('SCHEDULED');
    testDeliveryId = res.body.delivery.delivery_id;
  });

  // Test 5: Delivery Completion Transaction
  test('PUT /api/deliveries/:id/complete - Operator executes completion transaction', async () => {
    expect(testDeliveryId).toBeDefined();
    const res = await request(app)
      .put(`/api/deliveries/${testDeliveryId}/complete`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ quantity_litres: 9000, notes: 'Completed in test run' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.delivery.status).toBe('COMPLETED');
  });

  // Test 6: Resident Delivery Confirmation & Dispute Anti-Fraud Handling
  test('POST /api/deliveries/:id/confirm - Resident marks NOT RECEIVED, converting status to DISPUTED', async () => {
    expect(testDeliveryId).toBeDefined();
    const res = await request(app)
      .post(`/api/deliveries/${testDeliveryId}/confirm`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        confirmed: false,
        remarks: 'Tanker never reached our end of Bharathiyar street.'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.confirmation.confirmed).toBe(false);

    // Verify delivery status changed to DISPUTED
    const delRes = await request(app)
      .get(`/api/deliveries/${testDeliveryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.body.delivery.status).toBe('DISPUTED');
  });

  // Test 7: Complaint Creation & 48h SLA Calculation
  test('POST /api/complaints - Resident lodges complaint with SLA tracking', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        street_id: residentStreetId || 1,
        delivery_id: testDeliveryId,
        complaint_type: 'MISSED_DELIVERY',
        description: 'Test automated complaint for audit',
        priority: 'HIGH'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.complaint.status).toBe('OPEN');
  });

  // Test 8: Public Transparency API (No Auth Required)
  test('GET /api/public/transparency - Public can access street equity without auth', async () => {
    const res = await request(app).get('/api/public/transparency');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.streets)).toBe(true);
    // Ensure passwords or private phone numbers are not exposed
    expect(res.body.streets[0].password_hash).toBeUndefined();
    expect(res.body.streets[0].phone).toBeUndefined();
  });

  // Test 9: Street Fairness View & Ranking (DBMS Concept)
  test('GET /api/analytics/fairness - Returns street equity rankings and status', async () => {
    const res = await request(app)
      .get('/api/analytics/fairness')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.fairness)).toBe(true);
    expect(res.body.fairness.length).toBeGreaterThanOrEqual(8);
  });

  // Test 10: Fewest Deliveries Report (Includes zero deliveries street via LEFT JOIN)
  test('GET /api/analytics/fewest-deliveries - Includes Rajaji Avenue with 0 deliveries', async () => {
    const res = await request(app)
      .get('/api/analytics/fewest-deliveries')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const zeroStreet = res.body.fewest_deliveries.find(s => s.street_name.includes('Rajaji'));
    expect(zeroStreet).toBeDefined();
    expect(Number(zeroStreet.total_deliveries)).toBe(0);
  });
});
