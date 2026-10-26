// JalNyaya - Water Sources & Depletion Monitoring Controller
const prisma = require('../config/db');

async function getAllWaterSources(req, res, next) {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.source_type = type;

    const sources = await prisma.waterSource.findMany({
      where,
      include: {
        _count: { select: { readings: true, alerts: true } }
      },
      orderBy: { source_id: 'asc' }
    });

    const enriched = sources.map(s => ({
      ...s,
      percentage_level: Math.round(((s.current_level_litres / s.capacity_litres) * 100) * 10) / 10
    }));

    return res.json({ success: true, sources: enriched });
  } catch (err) {
    next(err);
  }
}

async function getWaterSourceById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const source = await prisma.waterSource.findUnique({
      where: { source_id: id },
      include: {
        readings: {
          take: 20,
          orderBy: { reading_date: 'desc' },
          include: { recorder: { select: { name: true } } }
        },
        alerts: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!source) return res.status(404).json({ success: false, message: 'Water source not found.' });

    return res.json({
      success: true,
      source: {
        ...source,
        percentage_level: Math.round(((source.current_level_litres / source.capacity_litres) * 100) * 10) / 10
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createWaterSource(req, res, next) {
  try {
    const { source_name, source_type, location, capacity_litres, current_level_litres } = req.body;

    if (!source_name || !source_type || !location || !capacity_litres) {
      return res.status(400).json({ success: false, message: 'All water source details are required.' });
    }

    const cap = parseInt(capacity_litres);
    const current = current_level_litres !== undefined ? parseInt(current_level_litres) : cap;

    if (cap <= 0 || current < 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be > 0 and current level >= 0.' });
    }
    if (current > cap) {
      return res.status(400).json({ success: false, message: 'Current water level cannot exceed source capacity.' });
    }

    const source = await prisma.waterSource.create({
      data: {
        source_name: source_name.trim(),
        source_type,
        location: location.trim(),
        capacity_litres: cap,
        current_level_litres: current,
        status: current <= cap * 0.2 ? 'DEPLETED' : 'ACTIVE'
      }
    });

    return res.status(201).json({ success: true, message: 'Water source created successfully.', source });
  } catch (err) {
    next(err);
  }
}

async function updateWaterSource(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { source_name, source_type, location, capacity_litres, status } = req.body;

    const data = {};
    if (source_name) data.source_name = source_name.trim();
    if (source_type) data.source_type = source_type;
    if (location) data.location = location.trim();
    if (capacity_litres !== undefined) {
      const cap = parseInt(capacity_litres);
      if (cap <= 0) return res.status(400).json({ success: false, message: 'Capacity must be > 0.' });
      data.capacity_litres = cap;
    }
    if (status) data.status = status;

    const updated = await prisma.waterSource.update({
      where: { source_id: id },
      data
    });

    return res.json({ success: true, message: 'Water source updated successfully.', source: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 21 & 22: Add water reading, compute depletion versus 30-day average,
 * and generate automated alerts when crossing threshold (<80% low, <60% critical).
 */
async function addWaterLevelReading(req, res, next) {
  try {
    const sourceId = parseInt(req.params.id);
    const { level_litres } = req.body;
    const recordedBy = req.user.user_id;

    if (level_litres === undefined) {
      return res.status(400).json({ success: false, message: 'Level in litres is required.' });
    }

    const level = parseInt(level_litres);
    if (level < 0) {
      return res.status(400).json({ success: false, message: 'Water level cannot be negative.' });
    }

    const source = await prisma.waterSource.findUnique({ where: { source_id: sourceId } });
    if (!source) return res.status(404).json({ success: false, message: 'Water source not found.' });

    if (level > source.capacity_litres) {
      return res.status(400).json({ success: false, message: `Reading (${level} L) exceeds source capacity (${source.capacity_litres} L).` });
    }

    const pct = Math.round(((level / source.capacity_litres) * 100) * 10) / 10;

    // 1. Insert Reading
    const reading = await prisma.waterLevelReading.create({
      data: {
        source_id: sourceId,
        reading_date: new Date(),
        level_litres: level,
        percentage_level: pct,
        recorded_by: recordedBy
      }
    });

    // 2. Update Source current level & status
    await prisma.waterSource.update({
      where: { source_id: sourceId },
      data: {
        current_level_litres: level,
        status: pct <= 25 ? 'DEPLETED' : 'ACTIVE'
      }
    });

    // 3. Historical 30-day average check for depletion alert
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const avgData = await prisma.waterLevelReading.aggregate({
      where: {
        source_id: sourceId,
        reading_date: { gte: thirtyDaysAgo },
        reading_id: { not: reading.reading_id }
      },
      _avg: { level_litres: true }
    });

    const historicalAvg = avgData._avg.level_litres || source.capacity_litres;
    let alertCreated = null;

    if (pct < 60 || level < historicalAvg * 0.6) {
      alertCreated = await prisma.alert.create({
        data: {
          source_id: sourceId,
          alert_type: 'CRITICAL_WATER_LEVEL',
          message: `CRITICAL ALERT: Source "${source.source_name}" fell to ${pct}% capacity (${level} L). Aquifer depletion emergency.`,
          severity: 'CRITICAL',
          resolved: false
        }
      });
    } else if (pct < 80 || level < historicalAvg * 0.8) {
      alertCreated = await prisma.alert.create({
        data: {
          source_id: sourceId,
          alert_type: 'LOW_WATER_LEVEL',
          message: `Depletion Warning: Source "${source.source_name}" fell to ${pct}% capacity (${level} L). Monitor inflow.`,
          severity: 'WARNING',
          resolved: false
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Reading recorded successfully.',
      reading,
      alert: alertCreated
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Water Level Trends (Database-backed for charts)
 */
async function getWaterTrends(req, res, next) {
  try {
    const { source_id } = req.query;
    const where = {};
    if (source_id) where.source_id = parseInt(source_id);

    const readings = await prisma.waterLevelReading.findMany({
      where,
      take: 40,
      orderBy: { reading_date: 'asc' },
      include: {
        source: { select: { source_name: true, capacity_litres: true } }
      }
    });

    const trendData = readings.map(r => ({
      reading_id: r.reading_id,
      source_id: r.source_id,
      source_name: r.source.source_name,
      date: r.reading_date.toISOString().split('T')[0],
      level_litres: r.level_litres,
      percentage: r.percentage_level,
      capacity: r.source.capacity_litres
    }));

    return res.json({ success: true, trends: trendData });
  } catch (err) {
    next(err);
  }
}

/**
 * Alerts management
 */
async function getAlerts(req, res, next) {
  try {
    const { resolved } = req.query;
    const where = {};
    if (resolved !== undefined) where.resolved = (resolved === 'true');

    const alerts = await prisma.alert.findMany({
      where,
      take: 20,
      orderBy: { created_at: 'desc' },
      include: {
        source: { select: { source_name: true } },
        delivery: { select: { delivery_id: true, status: true, street: { select: { street_name: true } } } }
      }
    });

    return res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.alert.update({
      where: { alert_id: id },
      data: { resolved: true }
    });
    return res.json({ success: true, message: 'Alert resolved.', alert: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllWaterSources,
  getWaterSourceById,
  createWaterSource,
  updateWaterSource,
  addWaterLevelReading,
  getWaterTrends,
  getAlerts,
  resolveAlert
};
