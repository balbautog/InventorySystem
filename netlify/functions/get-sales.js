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

    const res = await client.query(`
      SELECT s.id, s.quantity, s.total, s.created_at, p.name AS product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.user_id=$1
      ORDER BY s.created_at DESC
      LIMIT 20
    `, [decoded.userId]);

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ sales: res.rows }) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
