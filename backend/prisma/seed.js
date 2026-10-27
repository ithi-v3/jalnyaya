// JalNyaya - Seed Data Script
// Seeds realistic Tamil Nadu Panchayat dataset into MySQL database via Prisma Client

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting JalNyaya Seeding ---');

  // Clean existing data in reverse foreign-key order
  await prisma.payment.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.waterLevelReading.deleteMany();
  await prisma.waterSource.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.deliveryConfirmation.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.tanker.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();
  await prisma.street.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.role.deleteMany();

  // 1. Roles
  const adminRole = await prisma.role.create({
    data: { role_name: 'ADMIN', description: 'Panchayat Administrative Officer with full supervisory control' }
  });
  const operatorRole = await prisma.role.create({
    data: { role_name: 'OPERATOR', description: 'Water tanker driver and distribution operator' }
  });
  const residentRole = await prisma.role.create({
    data: { role_name: 'RESIDENT', description: 'Village resident and household representative' }
  });

  // 2. Zones (Tamil Nadu Panchayat Administrative Zones)
  const zoneNorth = await prisma.zone.create({
    data: { zone_name: 'Zone A - Vadavalli Panchayat North', description: 'High-density residential and agricultural fringe' }
  });
  const zoneCentral = await prisma.zone.create({
    data: { zone_name: 'Zone B - Thondamuthur Central', description: 'Commercial core, bus stand area and schools' }
  });
  const zoneSouth = await prisma.zone.create({
    data: { zone_name: 'Zone C - Perur Chettipalayam South', description: 'Semi-rural artisan settlements and agrarian clusters' }
  });

  // 3. Streets (10 Realistic Tamil Nadu Streets)
  const streetsData = [
    { name: 'Bharathiyar Street', area: 'Vadavalli', panchayat: 'Vadavalli Special Village', pop: 480, hh: 110, zone: zoneNorth.zone_id, daysAgo: 2, score: 24.5 },
    { name: 'Kamarajar Salai', area: 'Vadavalli', panchayat: 'Vadavalli Special Village', pop: 620, hh: 145, zone: zoneNorth.zone_id, daysAgo: 3, score: 32.0 },
    { name: 'Periyar Nagar Main Road', area: 'Thondamuthur', panchayat: 'Thondamuthur Town Panchayat', pop: 750, hh: 180, zone: zoneCentral.zone_id, daysAgo: 1, score: 18.2 },
    { name: 'Anna Street', area: 'Thondamuthur', panchayat: 'Thondamuthur Town Panchayat', pop: 510, hh: 120, zone: zoneCentral.zone_id, daysAgo: 5, score: 48.7 },
    { name: 'Valluvar Kudiyiruppu', area: 'Perur', panchayat: 'Perur Chettipalayam Panchayat', pop: 340, hh: 85, zone: zoneSouth.zone_id, daysAgo: 7, score: 68.4 },
    { name: 'Gandhi Road', area: 'Perur', panchayat: 'Perur Chettipalayam Panchayat', pop: 590, hh: 140, zone: zoneSouth.zone_id, daysAgo: 4, score: 38.0 },
    { name: 'VOC Nagar 2nd Cross', area: 'Vadavalli', panchayat: 'Vadavalli Special Village', pop: 410, hh: 98, zone: zoneNorth.zone_id, daysAgo: 6, score: 55.6 },
    { name: 'Nehru Street', area: 'Thondamuthur', panchayat: 'Thondamuthur Town Panchayat', pop: 380, hh: 92, zone: zoneCentral.zone_id, daysAgo: 2, score: 22.0 },
    { name: 'Thiru Vi Ka Street', area: 'Perur', panchayat: 'Perur Chettipalayam Panchayat', pop: 670, hh: 160, zone: zoneSouth.zone_id, daysAgo: 9, score: 82.5 },
    { name: 'Rajaji Avenue (New Colony)', area: 'Vadavalli', panchayat: 'Vadavalli Special Village', pop: 290, hh: 70, zone: zoneNorth.zone_id, daysAgo: null, score: 95.0 } // ZERO DELIVERIES street!
  ];

  const createdStreets = [];
  for (const s of streetsData) {
    const lastDate = s.daysAgo ? new Date(Date.now() - s.daysAgo * 86400000) : null;
    const st = await prisma.street.create({
      data: {
        street_name: s.name,
        area_name: s.area,
        panchayat_name: s.panchayat,
        population: s.pop,
        household_count: s.hh,
        zone_id: s.zone,
        last_delivery_date: lastDate,
        priority_score: s.score
      }
    });
    createdStreets.push(st);
  }

  // 4. Users (18 Users: 2 Admins, 4 Operators, 12 Residents across streets)
  const passwordHash = await bcrypt.hash('password123', 10);

  // Admins
  const adminUser1 = await prisma.user.create({
    data: { name: 'K. Murugesan (Panchayat Secy)', email: 'admin@jalnyaya.gov.in', phone: '9842101122', password_hash: passwordHash, role_id: adminRole.role_id }
  });
  const adminUser2 = await prisma.user.create({
    data: { name: 'S. Annamalai (Executive Officer)', email: 'eo@jalnyaya.gov.in', phone: '9842103344', password_hash: passwordHash, role_id: adminRole.role_id }
  });

  // Operators
  const op1 = await prisma.user.create({
    data: { name: 'R. Senthamil (Driver-Op 1)', email: 'operator1@jalnyaya.gov.in', phone: '9789123451', password_hash: passwordHash, role_id: operatorRole.role_id }
  });
  const op2 = await prisma.user.create({
    data: { name: 'M. Ponnusamy (Driver-Op 2)', email: 'operator2@jalnyaya.gov.in', phone: '9789123452', password_hash: passwordHash, role_id: operatorRole.role_id }
  });
  const op3 = await prisma.user.create({
    data: { name: 'V. Karthikeyan (Driver-Op 3)', email: 'operator3@jalnyaya.gov.in', phone: '9789123453', password_hash: passwordHash, role_id: operatorRole.role_id }
  });
  const op4 = await prisma.user.create({
    data: { name: 'G. Selvam (Driver-Op 4)', email: 'operator4@jalnyaya.gov.in', phone: '9789123454', password_hash: passwordHash, role_id: operatorRole.role_id }
  });

  // Residents
  const residentsData = [
    { name: 'K. Subramanian', email: 'resident1@jalnyaya.gov.in', phone: '9443100101', streetIdx: 0 },
    { name: 'Selvi Radhakrishnan', email: 'resident2@jalnyaya.gov.in', phone: '9443100102', streetIdx: 1 },
    { name: 'Deepa Sundaram', email: 'resident3@jalnyaya.gov.in', phone: '9443100103', streetIdx: 2 },
    { name: 'P. Muthuvel', email: 'resident4@jalnyaya.gov.in', phone: '9443100104', streetIdx: 3 },
    { name: 'N. Kalaiselvi', email: 'resident5@jalnyaya.gov.in', phone: '9443100105', streetIdx: 4 },
    { name: 'T. Arumugam', email: 'resident6@jalnyaya.gov.in', phone: '9443100106', streetIdx: 5 },
    { name: 'S. Balamurugan', email: 'resident7@jalnyaya.gov.in', phone: '9443100107', streetIdx: 6 },
    { name: 'M. Meenakshi', email: 'resident8@jalnyaya.gov.in', phone: '9443100108', streetIdx: 7 },
    { name: 'C. Vijayan', email: 'resident9@jalnyaya.gov.in', phone: '9443100109', streetIdx: 8 },
    { name: 'V. Jayanthi', email: 'resident10@jalnyaya.gov.in', phone: '9443100110', streetIdx: 9 }, // Resident of zero delivery street!
    { name: 'A. Dhanalakshmi', email: 'resident11@jalnyaya.gov.in', phone: '9443100111', streetIdx: 0 },
    { name: 'R. Velusamy', email: 'resident12@jalnyaya.gov.in', phone: '9443100112', streetIdx: 4 }
  ];

  const createdResidents = [];
  for (const r of residentsData) {
    const res = await prisma.user.create({
      data: {
        name: r.name,
        email: r.email,
        phone: r.phone,
        password_hash: passwordHash,
        role_id: residentRole.role_id,
        street_id: createdStreets[r.streetIdx].street_id
      }
    });
    createdResidents.push(res);
  }

  // 5. Households (30 Sample Households across Streets)
  const householdHeads = [
    'A. Ramasamy', 'S. Lakshmi', 'T. Duraisamy', 'M. Saravanan', 'G. Kannan',
    'K. Marimuthu', 'V. Chitra', 'P. Natarajan', 'R. Thangavel', 'N. Revathi',
    'D. Soundararajan', 'E. Kasthuri', 'B. Loganathan', 'S. Parvathi', 'J. Ganesan',
    'M. Palanisamy', 'V. Malarvizhi', 'C. Boopathi', 'K. Valli', 'A. Senthil',
    'R. Gomathi', 'P. Manikandan', 'S. Usha', 'N. Sivakumar', 'T. Karpagam',
    'K. Chelladurai', 'V. Bhuvaneswari', 'G. Rajendran', 'M. Saraswathi', 'P. Vijayaraghavan'
  ];

  for (let i = 0; i < householdHeads.length; i++) {
    const street = createdStreets[i % createdStreets.length];
    const members = (i % 4) + 3; // 3 to 6 members
    await prisma.household.create({
      data: {
        street_id: street.street_id,
        head_name: householdHeads[i],
        members_count: members,
        phone: `94432001${(i + 10).toString().padStart(2, '0')}`,
        water_requirement: members * 70 // approx 70 litres/person/day standard
      }
    });
  }

  // 6. Tankers (5 Tankers)
  const tankersData = [
    { vehicle: 'TN-38-AF-4012', cap: 9000, op: op1.user_id, status: 'AVAILABLE', daysService: 12 },
    { vehicle: 'TN-38-BK-7890', cap: 12000, op: op2.user_id, status: 'IN_TRANSIT', daysService: 5 },
    { vehicle: 'TN-38-CM-1122', cap: 9000, op: op3.user_id, status: 'AVAILABLE', daysService: 28 },
    { vehicle: 'TN-38-DJ-9034', cap: 6000, op: op4.user_id, status: 'AVAILABLE', daysService: 18 },
    { vehicle: 'TN-38-EN-5510', cap: 12000, op: op1.user_id, status: 'MAINTENANCE', daysService: 45 }
  ];

  const createdTankers = [];
  for (const t of tankersData) {
    const tanker = await prisma.tanker.create({
      data: {
        vehicle_number: t.vehicle,
        capacity_litres: t.cap,
        operator_id: t.op,
        status: t.status,
        last_service_date: new Date(Date.now() - t.daysService * 86400000)
      }
    });
    createdTankers.push(tanker);
  }

  // 7. Water Sources (5 Sources)
  const sourcesData = [
    { name: 'Siruvani Reservoir Intake Main', type: 'RESERVOIR', loc: 'Siruvani Foothills Pump Station', cap: 250000, level: 215000, status: 'ACTIVE' },
    { name: 'Noyyal Basin Feeder Borewell #4', type: 'BOREWELL', loc: 'Thondamuthur East Fields', cap: 80000, level: 52000, status: 'ACTIVE' },
    { name: 'Vadavalli Panchayat Overhead Tank 1', type: 'OVERHEAD_TANK', loc: 'Vadavalli Water Works Campus', cap: 100000, level: 78000, status: 'ACTIVE' },
    { name: 'Perur Heritage Open Well System', type: 'OPEN_WELL', loc: 'Perur Temple Tank Peripheral', cap: 60000, level: 22000, status: 'DEPLETED' }, // Critically depleted!
    { name: 'Kurichi Panchayat Community Borewell', type: 'BOREWELL', loc: 'Kurichi Industrial Fringe', cap: 75000, level: 41000, status: 'ACTIVE' }
  ];

  const createdSources = [];
  for (const ws of sourcesData) {
    const source = await prisma.waterSource.create({
      data: {
        source_name: ws.name,
        source_type: ws.type,
        location: ws.loc,
        capacity_litres: ws.cap,
        current_level_litres: ws.level,
        status: ws.status
      }
    });
    createdSources.push(source);
  }

  // 8. Water Level Readings (35 Time-Series Readings over past 20 days)
  console.log('Generating water level trend readings...');
  for (const ws of createdSources) {
    for (let day = 15; day >= 0; day--) {
      // simulate realistic variation, showing Perur well steadily dropping
      let dropFactor = 1.0;
      if (ws.source_name.includes('Perur')) {
        dropFactor = 0.9 - (15 - day) * 0.035; // drops steadily to ~36%
      } else {
        dropFactor = 0.85 + (Math.sin(day) * 0.08);
      }
      const recordedLitres = Math.max(5000, Math.round(ws.capacity_litres * dropFactor));
      const pct = Math.round((recordedLitres / ws.capacity_litres) * 1000) / 10;

      await prisma.waterLevelReading.create({
        data: {
          source_id: ws.source_id,
          reading_date: new Date(Date.now() - day * 86400000),
          level_litres: recordedLitres,
          percentage_level: pct,
          recorded_by: adminUser1.user_id
        }
      });
    }
  }

  // 9. Deliveries (38 Realistic Deliveries across streets 0 to 8; Street 9 gets ZERO deliveries!)
  console.log('Generating tanker deliveries...');
  const createdDeliveries = [];
  const operators = [op1, op2, op3, op4];

  // We assign varying delivery counts to show fairness inequality:
  // Street 0 (Bharathiyar): 7 deliveries (High)
  // Street 1 (Kamarajar): 6 deliveries (High)
  // Street 2 (Periyar): 8 deliveries (High)
  // Street 3 (Anna): 5 deliveries
  // Street 4 (Valluvar): 2 deliveries (Critical)
  // Street 5 (Gandhi): 4 deliveries
  // Street 6 (VOC): 3 deliveries
  // Street 7 (Nehru): 2 deliveries
  // Street 8 (Thiru Vi Ka): 1 delivery (Critical)
  // Street 9 (Rajaji): 0 deliveries (ZERO)

  const streetDeliveriesMap = [
    { sIdx: 0, count: 7 },
    { sIdx: 1, count: 6 },
    { sIdx: 2, count: 8 },
    { sIdx: 3, count: 5 },
    { sIdx: 4, count: 2 },
    { sIdx: 5, count: 4 },
    { sIdx: 6, count: 3 },
    { sIdx: 7, count: 2 },
    { sIdx: 8, count: 1 }
  ];

  let deliveryCounter = 0;
  for (const item of streetDeliveriesMap) {
    const street = createdStreets[item.sIdx];
    for (let c = 0; c < item.count; c++) {
      deliveryCounter++;
      const op = operators[deliveryCounter % operators.length];
      const tanker = createdTankers[deliveryCounter % createdTankers.length];
      const daysAgo = Math.floor(c * 3) + 1;
      const scheduledDate = new Date(Date.now() - daysAgo * 86400000);
      
      // Let's create:
      // Mostly COMPLETED
      // Delivery #12 DISPUTED (Operator 3)
      // Delivery #25 DISPUTED (Operator 2)
      // Delivery #34 SCHEDULED (Upcoming today/tomorrow)
      let status = 'COMPLETED';
      let deliveryDate = new Date(scheduledDate.getTime() + 7200000);
      if (deliveryCounter === 12 || deliveryCounter === 25) {
        status = 'DISPUTED';
      } else if (deliveryCounter === 35 || deliveryCounter === 38) {
        status = 'SCHEDULED';
        deliveryDate = null;
      }

      const del = await prisma.delivery.create({
        data: {
          tanker_id: tanker.tanker_id,
          street_id: street.street_id,
          operator_id: op.user_id,
          scheduled_date: scheduledDate,
          delivery_date: deliveryDate,
          quantity_litres: tanker.capacity_litres,
          status: status,
          notes: status === 'DISPUTED' 
            ? 'Resident claimed tanker left before distributing water to tail-end houses.'
            : `Routine morning delivery to street distribution valve point #${(c % 3) + 1}.`
        }
      });
      createdDeliveries.push(del);
    }
  }

  // 10. Delivery Confirmations (22 Confirmations: 20 Confirmed, 2 NOT RECEIVED causing dispute)
  console.log('Generating resident delivery confirmations...');
  for (let i = 0; i < Math.min(22, createdDeliveries.length); i++) {
    const del = createdDeliveries[i];
    if (del.status === 'SCHEDULED') continue;

    // Pick resident from the same street if available, otherwise resident 0
    const resident = createdResidents.find(r => r.street_id === del.street_id) || createdResidents[0];
    const isDisputed = (del.status === 'DISPUTED');

    await prisma.deliveryConfirmation.create({
      data: {
        delivery_id: del.delivery_id,
        resident_id: resident.user_id,
        confirmed: !isDisputed,
        remarks: isDisputed 
          ? 'Tanker water was muddy and driver departed after 15 minutes.'
          : 'Water received in full volume at public taps. Tanker arrived on time.',
        confirmation_time: new Date(del.scheduled_date.getTime() + 10800000)
      }
    });
  }

  // 11. Complaints (12 Realistic Complaints: some OPEN, some IN_PROGRESS, some RESOLVED, and 2 SLA-BREACHED!)
  console.log('Generating complaints and SLA records...');
  const complaintsData = [
    { resIdx: 4, streetIdx: 4, type: 'MISSED_DELIVERY', desc: 'No tanker delivery in Valluvar Kudiyiruppu for 7 consecutive days. Taps completely dry.', status: 'OPEN', priority: 'URGENT', hoursAgo: 72, resolvedAgo: null, opIdx: 0 }, // BREACHED SLA! (72h > 48h)
    { resIdx: 8, streetIdx: 8, type: 'INSUFFICIENT_QUANTITY', desc: 'Thiru Vi Ka street received only half tanker; western tenements got zero water.', status: 'IN_PROGRESS', priority: 'HIGH', hoursAgo: 50, resolvedAgo: null, opIdx: 1 }, // BREACHED SLA! (50h > 48h)
    { resIdx: 9, streetIdx: 9, type: 'MISSED_DELIVERY', desc: 'Rajaji Avenue has never received a panchayat tanker delivery since occupation began.', status: 'OPEN', priority: 'URGENT', hoursAgo: 38, resolvedAgo: null, opIdx: 2 }, // DUE SOON!
    { resIdx: 0, streetIdx: 0, type: 'WATER_QUALITY', desc: 'Slight turbidity and sediment observed in the morning tanker water batch.', status: 'RESOLVED', priority: 'MEDIUM', hoursAgo: 96, resolvedAgo: 60, opIdx: 0 }, // RESOLVED within SLA (36h <= 48h)
    { resIdx: 1, streetIdx: 1, type: 'TIMING_ISSUE', desc: 'Tanker arrived at 2:30 PM unannounced during working hours instead of morning 7 AM.', status: 'RESOLVED', priority: 'LOW', hoursAgo: 120, resolvedAgo: 40, opIdx: 1 }, // RESOLVED BREACHED (80h > 48h)
    { resIdx: 2, streetIdx: 2, type: 'OPERATOR_BEHAVIOUR', desc: 'Driver refused to fill communal storage syntax and demanded private tips.', status: 'IN_PROGRESS', priority: 'HIGH', hoursAgo: 20, resolvedAgo: null, opIdx: 2 }, // WITHIN SLA
    { resIdx: 3, streetIdx: 3, type: 'MISSED_DELIVERY', desc: 'Scheduled tanker on Friday failed to arrive at Anna Street.', status: 'RESOLVED', priority: 'MEDIUM', hoursAgo: 60, resolvedAgo: 42, opIdx: 3 }, // RESOLVED within SLA (18h)
    { resIdx: 5, streetIdx: 5, type: 'WATER_QUALITY', desc: 'Strong chlorine smell in Gandhi Road delivery water.', status: 'OPEN', priority: 'LOW', hoursAgo: 14, resolvedAgo: null, opIdx: 3 },
    { resIdx: 6, streetIdx: 6, type: 'INSUFFICIENT_QUANTITY', desc: 'Tanker hose broke midway during delivery at VOC Nagar.', status: 'OPEN', priority: 'HIGH', hoursAgo: 8, resolvedAgo: null, opIdx: 0 },
    { resIdx: 7, streetIdx: 7, type: 'OTHER', desc: 'Overhead distribution pipe valve at Nehru Street is leaking heavily.', status: 'RESOLVED', priority: 'MEDIUM', hoursAgo: 48, resolvedAgo: 24, opIdx: 1 },
    { resIdx: 10, streetIdx: 0, type: 'TIMING_ISSUE', desc: 'Requested early morning timing adjustment for student school preparation.', status: 'OPEN', priority: 'LOW', hoursAgo: 5, resolvedAgo: null, opIdx: null },
    { resIdx: 11, streetIdx: 4, type: 'MISSED_DELIVERY', desc: 'Repeated shortage in Valluvar Kudiyiruppu; families forced to purchase private cans.', status: 'OPEN', priority: 'URGENT', hoursAgo: 22, resolvedAgo: null, opIdx: 2 }
  ];

  for (const c of complaintsData) {
    const resident = createdResidents[c.resIdx];
    const street = createdStreets[c.streetIdx];
    const assignedOp = c.opIdx !== null ? operators[c.opIdx] : null;
    const createdAt = new Date(Date.now() - c.hoursAgo * 3600000);
    const resolvedAt = c.resolvedAgo !== null ? new Date(Date.now() - c.resolvedAgo * 3600000) : null;

    await prisma.complaint.create({
      data: {
        resident_id: resident.user_id,
        street_id: street.street_id,
        complaint_type: c.type,
        description: c.desc,
        status: c.status,
        priority: c.priority,
        created_at: createdAt,
        resolved_at: resolvedAt,
        assigned_operator_id: assignedOp ? assignedOp.user_id : null
      }
    });
  }

  // 12. Alerts (6 Active / Historical Alerts)
  console.log('Generating system alerts...');
  await prisma.alert.create({
    data: {
      source_id: createdSources[3].source_id, // Perur Open Well
      alert_type: 'CRITICAL_WATER_LEVEL',
      message: 'CRITICAL DEPLETION: Perur Heritage Open Well has dropped to 36.6% capacity (22,000 L). Inflow rate severely declining.',
      severity: 'CRITICAL',
      resolved: false
    }
  });

  await prisma.alert.create({
    data: {
      source_id: createdSources[1].source_id, // Noyyal Well
      alert_type: 'LOW_WATER_LEVEL',
      message: 'Depletion Warning: Noyyal Basin Feeder Borewell #4 reached 65% capacity. Pumping rate throttled to preserve aquifer.',
      severity: 'WARNING',
      resolved: false
    }
  });

  await prisma.alert.create({
    data: {
      delivery_id: createdDeliveries[11].delivery_id,
      alert_type: 'DELIVERY_DISPUTE',
      message: 'Delivery Dispute Flagged: Resident at Bharathiyar Street marked Delivery #12 as NOT RECEIVED. Immediate inspection ordered.',
      severity: 'CRITICAL',
      resolved: false
    }
  });

  await prisma.alert.create({
    data: {
      alert_type: 'SLA_BREACH',
      message: 'SLA Breach Warning: Complaint #1 (Valluvar Kudiyiruppu water shortage) exceeded 48 hours without resolution.',
      severity: 'WARNING',
      resolved: false
    }
  });

  // 13. Payments (15 Payment Records in ₹ INR)
  console.log('Generating payments records in INR...');
  const paymentMethods = ['PANCHAYAT_VOUCHER', 'UPI', 'BANK_TRANSFER', 'CASH'];
  for (let i = 0; i < 15; i++) {
    const del = createdDeliveries[i];
    const amount = (del.quantity_litres / 1000) * 85.0; // ₹85 per 1,000 litres
    await prisma.payment.create({
      data: {
        delivery_id: del.delivery_id,
        amount: amount,
        payment_date: new Date(del.scheduled_date.getTime() + 14400000),
        payment_method: paymentMethods[i % paymentMethods.length],
        payment_status: i === 11 ? 'FAILED' : 'PAID',
        reference_number: `PAY-JAL-2026-${(1000 + i).toString()}`
      }
    });
  }

  console.log('--- JalNyaya Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
