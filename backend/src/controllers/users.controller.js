// JalNyaya - Users Controller (Single unified users table RBAC)
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function getAllUsers(req, res, next) {
  try {
    const { search, role_id, street_id, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * pageSize;

    const where = {};
    if (role_id) where.role_id = parseInt(role_id);
    if (street_id) where.street_id = parseInt(street_id);
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          user_id: true,
          name: true,
          email: true,
          phone: true,
          is_active: true,
          created_at: true,
          role: true,
          street: { select: { street_id: true, street_name: true, area_name: true } }
        },
        orderBy: { user_id: 'asc' }
      })
    ]);

    return res.json({
      success: true,
      users,
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

async function getUserById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
        role: true,
        street: true
      }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, phone, password, role_id, street_id } = req.body;

    if (!name || !email || !phone || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, password, and role are required.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password_hash,
        role_id: parseInt(role_id),
        street_id: street_id ? parseInt(street_id) : null
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        street: true,
        created_at: true
      }
    });

    return res.status(201).json({ success: true, message: 'User created successfully.', user });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, role_id, street_id, is_active, password } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (phone) data.phone = phone.trim();
    if (role_id) data.role_id = parseInt(role_id);
    if (street_id !== undefined) data.street_id = street_id ? parseInt(street_id) : null;
    if (is_active !== undefined) data.is_active = Boolean(is_active);
    if (password) data.password_hash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { user_id: id },
      data,
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        street: true,
        is_active: true
      }
    });

    return res.json({ success: true, message: 'User updated successfully.', user: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.user.delete({ where: { user_id: id } });
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
