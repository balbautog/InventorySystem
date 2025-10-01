const { Client } = require("pg");
const bcrypt = require("bcryptjs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Username and password required" }) };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Insert new user
    const result = await client.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered successfully!", user: result.rows[0] }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Registration failed: " + err.message }),
    };
  }
};
