const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.handler = async (event) => {
  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: "No token provided" }) };

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    const res = await client.query("SELECT id, name, price, stock FROM products ORDER BY id ASC");
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ products: res.rows }) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized or failed: " + err.message }) };
  }
};
