const oracledb = require("oracledb");

// Oracle client configuration
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.DB_USERNAME || "system",
  password: process.env.DB_PASSWORD || "secret",
  connectString: `${process.env.DB_HOST || "localhost"}:${
    process.env.DB_PORT || "1521"
  }/${process.env.DB_SERVICE || "XEPDB1"}`,
  poolMin: parseInt(process.env.DB_POOL_MIN) || 1,
  poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 1,
};

let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log("Oracle Database connection pool created successfully");
  } catch (err) {
    console.error("Error creating Oracle Database connection pool:", err);
    process.exit(1);
  }
}

async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (err) {
    console.error("Error getting database connection:", err);
    throw err;
  }
}

async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function close() {
  try {
    if (pool) {
      await pool.close();
      console.log("Oracle Database connection pool closed");
    }
  } catch (err) {
    console.error("Error closing Oracle Database connection pool:", err);
  }
}

// Initialize the connection pool
initialize();

// Graceful shutdown
process.on("SIGINT", close);
process.on("SIGTERM", close);

module.exports = {
  getConnection,
  executeQuery,
  close,
  BIND_OUT: oracledb.BIND_OUT,
  NUMBER: oracledb.NUMBER,
  STRING: oracledb.STRING,
};
