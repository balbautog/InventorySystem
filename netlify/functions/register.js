const { Client } = require("pg");
const bcrypt = require("bcryptjs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: "Username and password required" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered!", userId: result.rows[0].id }),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
