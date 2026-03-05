const { Pool } = require("pg");

const pool = new Pool({
	user: "postgres",
	host: "localhost",
	database: "privacy_risk_analyzer",
	password: "nanobanana",
	port: 5432,
});

module.exports = pool;
