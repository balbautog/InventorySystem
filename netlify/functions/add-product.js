const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: "Unauthorized" };
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET);

  const { name, price, stock } = JSON.parse(event.body);
  if (!name || price == null || stock == null) return { statusCode: 400, body: "Missing fields" };

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("INSERT INTO products (name, price, stock) VALUES ($1,$2,$3)", [name, price, stock]);
    await client.end();
    return { statusCode: 200, body: JSON.stringify({ message: "Product added" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
