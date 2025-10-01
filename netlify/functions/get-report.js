const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.handler = async (event) => {
  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: "Unauthorized" };
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Sales summary per product for the logged-in user
    const res = await client.query(`
      SELECT p.name, SUM(s.quantity) AS total_sold, SUM(s.total) AS total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.user_id = $1
      GROUP BY p.name
      ORDER BY total_revenue DESC
    `, [decoded.userId]);

    // Total revenue
    const totalRes = await client.query(`
      SELECT SUM(total) AS total_revenue
      FROM sales
      WHERE user_id = $1
    `, [decoded.userId]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        products: res.rows,
        totalRevenue: totalRes.rows[0].total_revenue || 0
      })
    };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
