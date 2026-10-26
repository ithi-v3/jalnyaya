// JalNyaya - Deliveries Controller (CRUD, Transaction, Confirmations & Disputes)
const prisma = require('../config/db');

async function getAllDeliveries(req, res, next) {
  try {
    const { search, status, street_id, operator_id, tanker_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (status) where.status = status;
    if (street_id) where.street_id = parseInt(street_id);
    if (operator_id) where.operator_id = parseInt(operator_id);
    if (tanker_id) where.tanker_id = parseInt(tanker_id);
    if (search) {
      where.OR = [
        { street: { street_name: { contains: search } } },
        { tanker: { vehicle_number: { contains: search } } },
        { notes: { contains: search } }
      ];
    }

    // If operator is logged in, restrict to assigned deliveries if they ask for my deliveries
    if (req.user && req.user.role.role_name === 'OPERATOR' && req.query.mine === 'true') {
      where.operator_id = req.user.user_id;
    }

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          street: { select: { street_id: true, street_name: true, area_name: true, panchayat_name: true } },
          tanker: { select: { tanker_id: true, vehicle_number: true, capacity_litres: true } },
          operator: { select: { user_id: true, name: true, phone: true } },
          confirmations: {
            include: { resident: { select: { name: true, phone: true } } }
          },
          payments: true
        },
        orderBy: { scheduled_date: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      deliveries,
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

async function getDeliveryById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const delivery = await prisma.delivery.findUnique({
      where: { delivery_id: id },
      include: {
        street: true,
        tanker: true,
        operator: { select: { user_id: true, name: true, phone: true } },
        confirmations: {
          include: { resident: { select: { name: true, phone: true } } }
        },
        complaints: true,
        payments: true
      }
    });

    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    return res.json({ success: true, delivery });
  } catch (err) {
    next(err);
  }
}

async function createDelivery(req, res, next) {
  try {
    const { tanker_id, street_id, operator_id, scheduled_date, quantity_litres, notes } = req.body;

    if (!tanker_id || !street_id || !operator_id || !scheduled_date || !quantity_litres) {
      return res.status(400).json({ success: false, message: 'All scheduling fields are required.' });
    }

    const qty = parseInt(quantity_litres);
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity in litres must be positive.' });
    }

    const delivery = await prisma.delivery.create({
      data: {
        tanker_id: parseInt(tanker_id),
        street_id: parseInt(street_id),
        operator_id: parseInt(operator_id),
        scheduled_date: new Date(scheduled_date),
        quantity_litres: qty,
        status: 'SCHEDULED',
        notes: notes ? notes.trim() : null
      },
      include: {
        street: true,
        tanker: true,
        operator: { select: { name: true } }
      }
    });

    return res.status(201).json({ success: true, message: 'Delivery scheduled successfully.', delivery });
  } catch (err) {
    next(err);
  }
}

/**
 * Requirement 19: Multi-step Database Transaction for Delivery Completion
 * 1. Validate tanker availability and status.
 * 2. Update delivery status to COMPLETED and set delivery timestamp.
 * 3. Record delivered quantity.
 * 4. Update street last_delivery_date.
 * 5. Update tanker status to AVAILABLE.
 * Rollback completely if any step fails.
 */
async function completeDeliveryTransaction(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.id);
    const { quantity_litres, notes } = req.body;

    // Interactive Transaction with ACID Guarantees
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Fetch and lock/verify the delivery record
      const delivery = await tx.delivery.findUnique({
        where: { delivery_id: deliveryId },
        include: { tanker: true }
      });

      if (!delivery) {
        throw new Error('Delivery record not found.');
      }

      if (delivery.status === 'COMPLETED') {
        throw new Error('Delivery is already marked as COMPLETED.');
      }

      // Step 2: Validate tanker status
      if (delivery.tanker.status === 'MAINTENANCE' || delivery.tanker.status === 'OUT_OF_SERVICE') {
        throw new Error(`Tanker ${delivery.tanker.vehicle_number} is under ${delivery.tanker.status} and cannot execute deliveries.`);
      }

      const deliveredVolume = quantity_litres ? parseInt(quantity_litres) : delivery.quantity_litres;
      if (deliveredVolume <= 0) {
        throw new Error('Delivered quantity must be greater than zero.');
      }

      const completionTimestamp = new Date();

      // Step 3: Update Delivery Status and Quantity
      const updatedDelivery = await tx.delivery.update({
        where: { delivery_id: deliveryId },
        data: {
          status: 'COMPLETED',
          delivery_date: completionTimestamp,
          quantity_litres: deliveredVolume,
          notes: notes ? notes.trim() : delivery.notes
        }
      });

      // Step 4: Update Street's Last Delivery Date
      await tx.street.update({
        where: { street_id: delivery.street_id },
        data: {
          last_delivery_date: completionTimestamp
        }
      });

      // Step 5: Update Tanker Status
      await tx.tanker.update({
        where: { tanker_id: delivery.tanker_id },
        data: { status: 'AVAILABLE' }
      });

      return updatedDelivery;
    });

    return res.json({
      success: true,
      message: 'Delivery completed successfully via ACID database transaction.',
      delivery: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Delivery completion transaction failed and rolled back.'
    });
  }
}

/**
 * Resident Delivery Confirmation / Anti-Fraud Dispute Submission
 * If resident marks confirmed = false, delivery status changes to DISPUTED and alert is raised.
 */
async function submitDeliveryConfirmation(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.id);
    const residentId = req.user.user_id;
    const { confirmed, remarks } = req.body;

    if (confirmed === undefined) {
      return res.status(400).json({ success: false, message: 'Confirmation status (true/false) is required.' });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { delivery_id: deliveryId },
      include: { street: true }
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found.' });
    }

    // Check existing confirmation
    const existing = await prisma.deliveryConfirmation.findFirst({
      where: { delivery_id: deliveryId, resident_id: residentId }
    });

    let confirmation;
    if (existing) {
      confirmation = await prisma.deliveryConfirmation.update({
        where: { confirmation_id: existing.confirmation_id },
        data: {
          confirmed: Boolean(confirmed),
          remarks: remarks ? remarks.trim() : existing.remarks,
          confirmation_time: new Date()
        }
      });
    } else {
      confirmation = await prisma.deliveryConfirmation.create({
        data: {
          delivery_id: deliveryId,
          resident_id: residentId,
          confirmed: Boolean(confirmed),
          remarks: remarks ? remarks.trim() : null
        }
      });
    }

    // Anti-fraud dispute handling:
    // When resident indicates delivery was NOT received:
    if (!confirmed) {
      await prisma.delivery.update({
        where: { delivery_id: deliveryId },
        data: {
          status: 'DISPUTED',
          notes: `${delivery.notes || ''} [DISPUTED: Resident reported delivery was NOT received]`.trim()
        }
      });

      // Ensure alert exists
      await prisma.alert.create({
        data: {
          delivery_id: deliveryId,
          alert_type: 'DELIVERY_DISPUTE',
          message: `Resident Fraud Alert: Resident ${req.user.name} reported that Delivery #${deliveryId} at ${delivery.street.street_name} was NOT received. Remarks: ${remarks || 'None'}`,
          severity: 'CRITICAL',
          resolved: false
        }
      });
    }

    return res.json({
      success: true,
      message: confirmed 
        ? 'Delivery verified and confirmed successfully.' 
        : 'Dispute registered. Delivery marked as DISPUTED for Panchayat Administrative audit.',
      confirmation
    });
  } catch (err) {
    next(err);
  }
}

async function cancelDelivery(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    const updated = await prisma.delivery.update({
      where: { delivery_id: id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `[CANCELLED: ${reason}]` : '[CANCELLED by Administrator]'
      }
    });

    return res.json({ success: true, message: 'Delivery cancelled successfully.', delivery: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  completeDeliveryTransaction,
  submitDeliveryConfirmation,
  cancelDelivery
};
