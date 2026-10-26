// JalNyaya - Tankers Controller (CRUD, Search, Filter, Pagination)
const prisma = require('../config/db');

async function getAllTankers(req, res, next) {
  try {
    const { search, status, operator_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (search) {
      where.vehicle_number = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    if (operator_id) {
      where.operator_id = parseInt(operator_id);
    }

    const [total, tankers] = await Promise.all([
      prisma.tanker.count({ where }),
      prisma.tanker.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          operator: { select: { user_id: true, name: true, phone: true } },
          _count: { select: { deliveries: true } }
        },
        orderBy: { tanker_id: 'asc' }
      })
    ]);

    return res.json({
      success: true,
      tankers,
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

async function getTankerById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const tanker = await prisma.tanker.findUnique({
      where: { tanker_id: id },
      include: {
        operator: { select: { user_id: true, name: true, phone: true } },
        deliveries: {
          take: 10,
          orderBy: { scheduled_date: 'desc' },
          include: { street: true }
        }
      }
    });

    if (!tanker) return res.status(404).json({ success: false, message: 'Tanker not found.' });
    return res.json({ success: true, tanker });
  } catch (err) {
    next(err);
  }
}

async function createTanker(req, res, next) {
  try {
    const { vehicle_number, capacity_litres, operator_id, status } = req.body;

    if (!vehicle_number || !capacity_litres || !operator_id) {
      return res.status(400).json({ success: false, message: 'Vehicle number, capacity, and operator are required.' });
    }

    const cap = parseInt(capacity_litres);
    if (cap <= 0) {
      return res.status(400).json({ success: false, message: 'Tanker capacity must be greater than zero.' });
    }

    // Verify operator role
    const opUser = await prisma.user.findUnique({
      where: { user_id: parseInt(operator_id) },
      include: { role: true }
    });
    if (!opUser || opUser.role.role_name !== 'OPERATOR') {
      return res.status(400).json({ success: false, message: 'Assigned user must have the OPERATOR role.' });
    }

    const tanker = await prisma.tanker.create({
      data: {
        vehicle_number: vehicle_number.trim().toUpperCase(),
        capacity_litres: cap,
        operator_id: parseInt(operator_id),
        status: status || 'AVAILABLE',
        last_service_date: new Date()
      },
      include: { operator: { select: { user_id: true, name: true } } }
    });

    return res.status(201).json({ success: true, message: 'Tanker added successfully.', tanker });
  } catch (err) {
    next(err);
  }
}

async function updateTanker(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { vehicle_number, capacity_litres, operator_id, status, last_service_date } = req.body;

    const data = {};
    if (vehicle_number) data.vehicle_number = vehicle_number.trim().toUpperCase();
    if (capacity_litres !== undefined) {
      const cap = parseInt(capacity_litres);
      if (cap <= 0) return res.status(400).json({ success: false, message: 'Capacity must be > 0.' });
      data.capacity_litres = cap;
    }
    if (operator_id) data.operator_id = parseInt(operator_id);
    if (status) data.status = status;
    if (last_service_date) data.last_service_date = new Date(last_service_date);

    const updated = await prisma.tanker.update({
      where: { tanker_id: id },
      data,
      include: { operator: { select: { user_id: true, name: true } } }
    });

    return res.json({ success: true, message: 'Tanker updated successfully.', tanker: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTanker(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.tanker.delete({ where: { tanker_id: id } });
    return res.json({ success: true, message: 'Tanker deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTankers,
  getTankerById,
  createTanker,
  updateTanker,
  deleteTanker
};
