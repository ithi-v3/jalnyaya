// JalNyaya - Centralized Error Handling Middleware

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Prisma Unique Constraint Violation (P2002)
  if (err.code === 'P2002') {
    const target = err.meta && err.meta.target ? err.meta.target : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
      field: target
    });
  }

  // Prisma Foreign Key Constraint Failure (P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Referenced foreign key record does not exist or cannot be modified.'
    });
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found in the database.'
    });
  }

  // Custom Application Status Code
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
