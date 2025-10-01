const { Client } = require("pg");

exports.handler = async function () {
  const client = new Client({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


  try {
    await client.connect();
    const result = await client.query("SELECT NOW()");
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connected to Neon DB ✅",
        time: result.rows[0].now,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
