// JalNyaya - Streets Controller (CRUD, Search, Filter, Pagination)
const prisma = require('../config/db');

async function getAllStreets(req, res, next) {
  try {
    const { search, zone_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (search) {
      where.OR = [
        { street_name: { contains: search } },
        { area_name: { contains: search } },
        { panchayat_name: { contains: search } }
      ];
    }
    if (zone_id) {
      where.zone_id = parseInt(zone_id);
    }

    const [total, streets] = await Promise.all([
      prisma.street.count({ where }),
      prisma.street.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          zone: true,
          _count: {
            select: { households: true, deliveries: true, complaints: true }
          }
        },
        orderBy: { street_id: 'asc' }
      })
    ]);

    return res.json({
      success: true,
      streets,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getStreetById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const street = await prisma.street.findUnique({
      where: { street_id: id },
      include: {
        zone: true,
        households: true,
        deliveries: {
          take: 5,
          orderBy: { scheduled_date: 'desc' },
          include: { tanker: true, operator: { select: { name: true, phone: true } } }
        },
        complaints: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          include: { resident: { select: { name: true, phone: true } } }
        }
      }
    });

    if (!street) {
      return res.status(404).json({ success: false, message: 'Street not found.' });
    }

    return res.json({ success: true, street });
  } catch (err) {
    next(err);
  }
}

async function createStreet(req, res, next) {
  try {
    const { street_name, area_name, panchayat_name, population, household_count, zone_id } = req.body;

    if (!street_name || !area_name || !panchayat_name || !zone_id) {
      return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const popInt = parseInt(population);
    const hhInt = parseInt(household_count);
    if (popInt <= 0 || hhInt <= 0) {
      return res.status(400).json({ success: false, message: 'Population and household count must be positive numbers.' });
    }

    const street = await prisma.street.create({
      data: {
        street_name: street_name.trim(),
        area_name: area_name.trim(),
        panchayat_name: panchayat_name.trim(),
        population: popInt,
        household_count: hhInt,
        zone_id: parseInt(zone_id),
        priority_score: 50.0
      },
      include: { zone: true }
    });

    return res.status(201).json({ success: true, message: 'Street created successfully.', street });
  } catch (err) {
    next(err);
  }
}

async function updateStreet(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { street_name, area_name, panchayat_name, population, household_count, zone_id } = req.body;

    const data = {};
    if (street_name) data.street_name = street_name.trim();
    if (area_name) data.area_name = area_name.trim();
    if (panchayat_name) data.panchayat_name = panchayat_name.trim();
    if (population !== undefined) {
      if (parseInt(population) <= 0) return res.status(400).json({ success: false, message: 'Population must be > 0.' });
      data.population = parseInt(population);
    }
    if (household_count !== undefined) {
      if (parseInt(household_count) <= 0) return res.status(400).json({ success: false, message: 'Household count must be > 0.' });
      data.household_count = parseInt(household_count);
    }
    if (zone_id) data.zone_id = parseInt(zone_id);

    const updated = await prisma.street.update({
      where: { street_id: id },
      data,
      include: { zone: true }
    });

    return res.json({ success: true, message: 'Street updated successfully.', street: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteStreet(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.street.delete({ where: { street_id: id } });
    return res.json({ success: true, message: 'Street deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function getZones(req, res, next) {
  try {
    const zones = await prisma.zone.findMany({ orderBy: { zone_name: 'asc' } });
    return res.json({ success: true, zones });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStreets,
  getStreetById,
  createStreet,
  updateStreet,
  deleteStreet,
  getZones
};
