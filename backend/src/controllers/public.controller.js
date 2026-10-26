// JalNyaya - Public Transparency Controller (No Auth Required, Safe Public Data)
const prisma = require('../config/db');

async function getPublicTransparencyData(req, res, next) {
  try {
    // Query street_fairness_view, completely sanitized
    const query = `
      SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        s.panchayat_name,
        s.population,
        s.household_count,
        f.deliveries_count AS monthly_deliveries,
        f.total_litres_received,
        f.litres_per_person,
        f.overall_average_litres_per_person,
        f.fairness_percentage,
        f.fairness_status,
        f.fairness_rank,
        s.last_delivery_date
      FROM streets s
      LEFT JOIN street_fairness_view f ON s.street_id = f.street_id
      ORDER BY f.fairness_rank ASC, s.street_name ASC;
    `;

    const publicStreets = await prisma.$queryRawUnsafe(query);

    // Summary stats for public display
    const totalLitres = publicStreets.reduce((acc, curr) => acc + Number(curr.total_litres_received || 0), 0);
    const totalDeliveries = publicStreets.reduce((acc, curr) => acc + Number(curr.monthly_deliveries || 0), 0);

    return res.json({
      success: true,
      message: 'JalNyaya Public Water Equity Transparency Portal',
      panchayat_name: 'Vadavalli & Perur Panchayat Federation',
      summary: {
        total_streets: publicStreets.length,
        total_litres_distributed: totalLitres,
        total_completed_deliveries: totalDeliveries
      },
      streets: publicStreets
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicTransparencyData
};
