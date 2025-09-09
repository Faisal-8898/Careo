const oracledb = require("oracledb");

// Oracle client configuration
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.DB_USERNAME || "trainuser",
  password: process.env.DB_PASSWORD || "secret",
  connectString: `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "1521"
    }/${process.env.DB_SERVICE || "XE"}`,
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

    // Add timeout to prevent hanging queries
    const queryOptions = {
      ...options,
      timeout: 10000 // 10 second timeout
    };

    const result = await connection.execute(sql, binds, queryOptions);
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
    if (err.code !== 'NJS-065') { // Don't log if pool is already closed
      console.error("Error closing Oracle Database connection pool:", err);
    }
  }
}

// Initialize the connection pool
initialize();

// Note: Graceful shutdown is handled in server.js

module.exports = {
  getConnection,
  executeQuery,
  close,
  BIND_OUT: oracledb.BIND_OUT,
  NUMBER: oracledb.NUMBER,
  STRING: oracledb.STRING,
};
