// JalNyaya - Complaints Controller (CRUD, SLA 48h, Assignment, Resolution)
const prisma = require('../config/db');

async function getAllComplaints(req, res, next) {
  try {
    const { search, status, priority, complaint_type, street_id, assigned_operator_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (complaint_type) where.complaint_type = complaint_type;
    if (street_id) where.street_id = parseInt(street_id);
    if (assigned_operator_id) where.assigned_operator_id = parseInt(assigned_operator_id);

    // If resident is logged in and filtering for their own complaints
    if (req.user && req.user.role.role_name === 'RESIDENT' && req.query.mine === 'true') {
      where.resident_id = req.user.user_id;
    }

    // If operator is logged in and filtering for their assigned complaints
    if (req.user && req.user.role.role_name === 'OPERATOR' && req.query.mine === 'true') {
      where.assigned_operator_id = req.user.user_id;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { street: { street_name: { contains: search } } },
        { resident: { name: { contains: search } } }
      ];
    }

    const [total, rawComplaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          resident: { select: { user_id: true, name: true, phone: true } },
          street: { select: { street_id: true, street_name: true, area_name: true } },
          assignedOperator: { select: { user_id: true, name: true, phone: true } },
          delivery: { select: { delivery_id: true, scheduled_date: true, status: true } }
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    // Calculate dynamic SLA elapsed hours and status for each complaint
    const complaints = rawComplaints.map(c => {
      const created = new Date(c.created_at).getTime();
      const end = c.resolved_at ? new Date(c.resolved_at).getTime() : Date.now();
      const elapsedHours = Math.round(((end - created) / (1000 * 60 * 60)) * 10) / 10;

      let slaStatus = 'WITHIN SLA';
      if (c.status === 'RESOLVED') {
        slaStatus = elapsedHours <= 48 ? 'RESOLVED WITHIN SLA' : 'RESOLVED BREACHED';
      } else {
        if (elapsedHours > 48) slaStatus = 'BREACHED';
        else if (elapsedHours >= 36) slaStatus = 'DUE SOON';
        else slaStatus = 'WITHIN SLA';
      }

      return {
        ...c,
        elapsed_hours: elapsedHours,
        sla_status: slaStatus
      };
    });

    return res.json({
      success: true,
      complaints,
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

async function getComplaintById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const complaint = await prisma.complaint.findUnique({
      where: { complaint_id: id },
      include: {
        resident: { select: { user_id: true, name: true, phone: true, email: true } },
        street: true,
        assignedOperator: { select: { user_id: true, name: true, phone: true } },
        delivery: true
      }
    });

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const created = new Date(complaint.created_at).getTime();
    const end = complaint.resolved_at ? new Date(complaint.resolved_at).getTime() : Date.now();
    const elapsedHours = Math.round(((end - created) / (1000 * 60 * 60)) * 10) / 10;

    let slaStatus = 'WITHIN SLA';
    if (complaint.status === 'RESOLVED') {
      slaStatus = elapsedHours <= 48 ? 'RESOLVED WITHIN SLA' : 'RESOLVED BREACHED';
    } else {
      if (elapsedHours > 48) slaStatus = 'BREACHED';
      else if (elapsedHours >= 36) slaStatus = 'DUE SOON';
      else slaStatus = 'WITHIN SLA';
    }

    return res.json({
      success: true,
      complaint: {
        ...complaint,
        elapsed_hours: elapsedHours,
        sla_status: slaStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const { street_id, delivery_id, complaint_type, description, priority } = req.body;
    const resident_id = req.user.user_id;

    if (!street_id || !complaint_type || !description) {
      return res.status(400).json({ success: false, message: 'Street, complaint type, and description are required.' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        resident_id,
        street_id: parseInt(street_id),
        delivery_id: delivery_id ? parseInt(delivery_id) : null,
        complaint_type,
        description: description.trim(),
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      },
      include: {
        street: true,
        resident: { select: { name: true } }
      }
    });

    return res.status(201).json({ success: true, message: 'Complaint lodged successfully with 48h SLA monitoring.', complaint });
  } catch (err) {
    next(err);
  }
}

async function assignOperator(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { operator_id } = req.body;

    if (!operator_id) {
      return res.status(400).json({ success: false, message: 'Operator ID is required for assignment.' });
    }

    const updated = await prisma.complaint.update({
      where: { complaint_id: id },
      data: {
        assigned_operator_id: parseInt(operator_id),
        status: 'IN_PROGRESS'
      },
      include: {
        assignedOperator: { select: { user_id: true, name: true, phone: true } }
      }
    });

    return res.json({ success: true, message: 'Operator assigned successfully.', complaint: updated });
  } catch (err) {
    next(err);
  }
}

async function resolveComplaint(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const resolutionTime = new Date();

    const existing = await prisma.complaint.findUnique({ where: { complaint_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const hours = Math.round(((resolutionTime - new Date(existing.created_at)) / (1000 * 60 * 60)) * 10) / 10;

    const updated = await prisma.complaint.update({
      where: { complaint_id: id },
      data: {
        status: 'RESOLVED',
        resolved_at: resolutionTime
      }
    });

    return res.json({
      success: true,
      message: `Complaint marked as RESOLVED in ${hours} hours (${hours <= 48 ? 'Met 48h SLA' : 'Exceeded 48h SLA'}).`,
      complaint: updated,
      resolution_hours: hours,
      met_sla: hours <= 48
    });
  } catch (err) {
    next(err);
  }
}

async function getSlaReport(req, res, next) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM complaint_sla_view ORDER BY elapsed_hours DESC;`);
    return res.json({ success: true, sla_report: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  assignOperator,
  resolveComplaint,
  getSlaReport
};
