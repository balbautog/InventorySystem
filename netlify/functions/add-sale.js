const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: "Unauthorized" };
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET); // decoded.userId

  const { product_id, quantity } = JSON.parse(event.body);
  if (!product_id || quantity < 1) return { statusCode: 400, body: "Missing fields" };

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get product and check stock
    const resProduct = await client.query("SELECT price, stock FROM products WHERE id=$1", [product_id]);
    if (resProduct.rows.length === 0) throw new Error("Product not found");

    const product = resProduct.rows[0];
    if (quantity > product.stock) throw new Error("Not enough stock");

    const total = quantity * parseFloat(product.price);

    // Insert sale
    await client.query(
      "INSERT INTO sales (user_id, product_id, quantity, total) VALUES ($1, $2, $3, $4)",
      [decoded.userId, product_id, quantity, total]
    );

    // Update stock
    await client.query("UPDATE products SET stock=stock-$1 WHERE id=$2", [quantity, product_id]);

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ message: "Sale recorded" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
