// JalNyaya - Analytics, Fairness & DBMS Reports Controller
const prisma = require('../config/db');

/**
 * Requirement 14: Core Fairness Tracker View
 * Retrieves street_fairness_view data with ranking and equity status
 */
async function getStreetFairness(req, res, next) {
  try {
    const { status } = req.query;
    let query = `SELECT * FROM street_fairness_view`;
    const params = [];

    if (status) {
      query += ` WHERE fairness_status = ?`;
      params.push(status);
    }
    query += ` ORDER BY fairness_rank ASC;`;

    // Execute raw query against MySQL database view
    const fairnessRows = await prisma.$queryRawUnsafe(query, ...params);
    return res.json({ success: true, fairness: fairnessRows });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 15: Streets with Fewest Deliveries
 * MUST include streets with ZERO deliveries via LEFT JOIN
 */
async function getFewestDeliveries(req, res, next) {
  try {
    const query = `
      SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        s.panchayat_name,
        s.population,
        s.household_count,
        COUNT(d.delivery_id) AS total_deliveries,
        COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres_delivered
      FROM streets s
      LEFT JOIN deliveries d ON s.street_id = d.street_id
      GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count
      ORDER BY total_deliveries ASC, s.population DESC;
    `;
    const rows = await prisma.$queryRawUnsafe(query);
    return res.json({ success: true, fewest_deliveries: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 16: Automatic Delivery Priority View
 */
async function getDeliveryPriority(req, res, next) {
  try {
    const { zone_id } = req.query;
    let rows;
    if (zone_id) {
      rows = await prisma.$queryRawUnsafe(`CALL generate_delivery_priority(?);`, parseInt(zone_id));
      // MySQL CALL returns array of result arrays
      const list = Array.isArray(rows[0]) ? rows[0] : rows;
      return res.json({ success: true, priority_schedule: list });
    } else {
      rows = await prisma.$queryRawUnsafe(`SELECT * FROM delivery_priority_view ORDER BY priority_rank ASC;`);
      return res.json({ success: true, priority_schedule: rows });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 23: Operator Dispute Rate Ranking
 */
async function getOperatorDisputes(req, res, next) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM operator_dispute_view ORDER BY dispute_rate_percentage DESC;`);
    return res.json({ success: true, operator_disputes: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 17: Call Stored Procedure calculate_street_fairness
 */
async function recalculateFairnessProcedure(req, res, next) {
  try {
    const result = await prisma.$queryRawUnsafe(`CALL calculate_street_fairness();`);
    const data = Array.isArray(result[0]) ? result[0] : result;
    return res.json({
      success: true,
      message: 'Stored procedure calculate_street_fairness() executed successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 33: Admin Dashboard Aggregates
 */
async function getAdminDashboard(req, res, next) {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalStreets,
      totalHouseholds,
      deliveriesThisMonth,
      openComplaints,
      activeTankers,
      criticalWaterSources,
      recentAlerts
    ] = await Promise.all([
      prisma.street.count(),
      prisma.household.count(),
      prisma.delivery.count({
        where: { scheduled_date: { gte: startOfMonth }, status: 'COMPLETED' }
      }),
      prisma.complaint.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
      }),
      prisma.tanker.count({
        where: { status: 'AVAILABLE' }
      }),
      prisma.waterSource.count({
        where: { status: 'DEPLETED' }
      }),
      prisma.alert.findMany({
        where: { resolved: false },
        take: 5,
        orderBy: { created_at: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      overview: {
        totalStreets,
        totalHouseholds,
        deliveriesThisMonth,
        openComplaints,
        activeTankers,
        criticalWaterSources
      },
      recentAlerts
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Resident Dashboard Specific
 */
async function getResidentDashboard(req, res, next) {
  try {
    const user = req.user;
    if (!user.street_id) {
      return res.json({
        success: true,
        message: 'No street assigned to this resident.',
        myStreet: null
      });
    }

    const [street, lastDelivery, upcomingDelivery, complaints, fairness] = await Promise.all([
      prisma.street.findUnique({
        where: { street_id: user.street_id },
        include: { zone: true }
      }),
      prisma.delivery.findFirst({
        where: { street_id: user.street_id, status: 'COMPLETED' },
        orderBy: { delivery_date: 'desc' },
        include: { tanker: true, operator: { select: { name: true, phone: true } } }
      }),
      prisma.delivery.findFirst({
        where: { street_id: user.street_id, status: 'SCHEDULED' },
        orderBy: { scheduled_date: 'asc' },
        include: { tanker: true, operator: { select: { name: true, phone: true } } }
      }),
      prisma.complaint.findMany({
        where: { resident_id: user.user_id },
        orderBy: { created_at: 'desc' },
        take: 5
      }),
      prisma.$queryRawUnsafe(`SELECT * FROM street_fairness_view WHERE street_id = ?;`, user.street_id)
    ]);

    return res.json({
      success: true,
      myStreet: street,
      lastDelivery,
      upcomingDelivery,
      myComplaints: complaints,
      streetFairness: fairness[0] || null
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Operator Dashboard Specific
 */
async function getOperatorDashboard(req, res, next) {
  try {
    const operatorId = req.user.user_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [assignedDeliveries, todayDeliveries, disputedDeliveries, assignedComplaints, myTankers] = await Promise.all([
      prisma.delivery.count({ where: { operator_id: operatorId } }),
      prisma.delivery.findMany({
        where: {
          operator_id: operatorId,
          scheduled_date: { gte: today, lt: tomorrow }
        },
        include: { street: true, tanker: true }
      }),
      prisma.delivery.findMany({
        where: { operator_id: operatorId, status: 'DISPUTED' },
        include: { street: true, confirmations: true }
      }),
      prisma.complaint.findMany({
        where: { assigned_operator_id: operatorId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        include: { street: true, resident: { select: { name: true, phone: true } } }
      }),
      prisma.tanker.findMany({
        where: { operator_id: operatorId }
      })
    ]);

    return res.json({
      success: true,
      overview: {
        totalAssigned: assignedDeliveries,
        todayCount: todayDeliveries.length,
        disputedCount: disputedDeliveries.length,
        openComplaintsCount: assignedComplaints.length
      },
      todayDeliveries,
      disputedDeliveries,
      assignedComplaints,
      myTankers
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStreetFairness,
  getFewestDeliveries,
  getDeliveryPriority,
  getOperatorDisputes,
  recalculateFairnessProcedure,
  getAdminDashboard,
  getResidentDashboard,
  getOperatorDashboard
};
