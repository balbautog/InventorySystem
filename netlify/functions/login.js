const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // use a strong secret in production

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Username and password required" }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const res = await client.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );

    await client.end();

    if (res.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid username or password" }) };
    }

    const user = res.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid username or password" }) };
    }

    // Create JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "2h",
    });

    return { statusCode: 200, body: JSON.stringify({ message: "Login successful", token }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Login failed: " + err.message }) };
  }
};
