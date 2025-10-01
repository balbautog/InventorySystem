const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.handler = async (event) => {
  if (event.httpMethod !== "DELETE") return { statusCode: 405, body: "Method Not Allowed" };

  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: "Unauthorized" };
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET);

  const { id } = JSON.parse(event.body);
  if (!id) return { statusCode: 400, body: "Missing id" };

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("DELETE FROM products WHERE id=$1", [id]);
    await client.end();
    return { statusCode: 200, body: JSON.stringify({ message: "Product deleted" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
