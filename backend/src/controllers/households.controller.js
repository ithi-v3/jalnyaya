// JalNyaya - Households Controller (CRUD, Search, Filter, Pagination)
const prisma = require('../config/db');

async function getAllHouseholds(req, res, next) {
  try {
    const { search, street_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (search) {
      where.OR = [
        { head_name: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    if (street_id) {
      where.street_id = parseInt(street_id);
    }

    const [total, households] = await Promise.all([
      prisma.household.count({ where }),
      prisma.household.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          street: {
            select: { street_id: true, street_name: true, area_name: true }
          }
        },
        orderBy: { household_id: 'asc' }
      })
    ]);

    return res.json({
      success: true,
      households,
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

async function getHouseholdById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const household = await prisma.household.findUnique({
      where: { household_id: id },
      include: { street: true }
    });

    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found.' });
    }

    return res.json({ success: true, household });
  } catch (err) {
    next(err);
  }
}

async function createHousehold(req, res, next) {
  try {
    const { street_id, head_name, members_count, phone, water_requirement } = req.body;

    if (!street_id || !head_name || !members_count || !phone) {
      return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const members = parseInt(members_count);
    if (members <= 0) {
      return res.status(400).json({ success: false, message: 'Members count must be greater than zero.' });
    }

    const reqLitres = water_requirement ? parseInt(water_requirement) : members * 70;
    if (reqLitres <= 0) {
      return res.status(400).json({ success: false, message: 'Water requirement must be positive.' });
    }

    const household = await prisma.household.create({
      data: {
        street_id: parseInt(street_id),
        head_name: head_name.trim(),
        members_count: members,
        phone: phone.trim(),
        water_requirement: reqLitres
      },
      include: { street: true }
    });

    // Update household_count on street
    await prisma.street.update({
      where: { street_id: parseInt(street_id) },
      data: { household_count: { increment: 1 } }
    });

    return res.status(201).json({ success: true, message: 'Household registered successfully.', household });
  } catch (err) {
    next(err);
  }
}

async function updateHousehold(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { head_name, members_count, phone, water_requirement, street_id } = req.body;

    const data = {};
    if (head_name) data.head_name = head_name.trim();
    if (phone) data.phone = phone.trim();
    if (members_count !== undefined) {
      const count = parseInt(members_count);
      if (count <= 0) return res.status(400).json({ success: false, message: 'Members count must be > 0.' });
      data.members_count = count;
    }
    if (water_requirement !== undefined) {
      const litres = parseInt(water_requirement);
      if (litres <= 0) return res.status(400).json({ success: false, message: 'Water requirement must be > 0.' });
      data.water_requirement = litres;
    }
    if (street_id) data.street_id = parseInt(street_id);

    const updated = await prisma.household.update({
      where: { household_id: id },
      data,
      include: { street: true }
    });

    return res.json({ success: true, message: 'Household updated successfully.', household: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteHousehold(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.household.findUnique({ where: { household_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Household not found.' });

    await prisma.household.delete({ where: { household_id: id } });
    await prisma.street.update({
      where: { street_id: existing.street_id },
      data: { household_count: { decrement: 1 } }
    });

    return res.json({ success: true, message: 'Household deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllHouseholds,
  getHouseholdById,
  createHousehold,
  updateHousehold,
  deleteHousehold
};
