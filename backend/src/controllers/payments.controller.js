// JalNyaya - Payments Controller (CRUD & Financial Reporting in ₹ INR)
const prisma = require('../config/db');

async function getAllPayments(req, res, next) {
  try {
    const { status, method, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (status) where.payment_status = status;
    if (method) where.payment_method = method;

    const [total, payments, stats] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          delivery: {
            include: {
              street: { select: { street_name: true, area_name: true } },
              tanker: { select: { vehicle_number: true } }
            }
          }
        },
        orderBy: { payment_date: 'desc' }
      }),
      prisma.payment.aggregate({
        where: { payment_status: 'PAID' },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: { payment_id: true }
      })
    ]);

    return res.json({
      success: true,
      payments,
      summary: {
        totalPaidAmount: stats._sum.amount || 0,
        averageAmount: stats._avg.amount || 0,
        paidCount: stats._count.payment_id || 0
      },
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

async function createPayment(req, res, next) {
  try {
    const { delivery_id, amount, payment_method, payment_status, reference_number } = req.body;

    if (!delivery_id || amount === undefined || !payment_method) {
      return res.status(400).json({ success: false, message: 'Delivery ID, amount, and payment method are required.' });
    }

    const amt = parseFloat(amount);
    if (amt < 0) {
      return res.status(400).json({ success: false, message: 'Payment amount cannot be negative.' });
    }

    const refNo = reference_number || `PAY-JAL-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        delivery_id: parseInt(delivery_id),
        amount: amt,
        payment_method,
        payment_status: payment_status || 'PAID',
        reference_number: refNo
      },
      include: {
        delivery: {
          include: { street: true }
        }
      }
    });

    return res.status(201).json({ success: true, message: 'Payment recorded successfully.', payment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPayments,
  createPayment
};
