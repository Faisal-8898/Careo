const oracledb = require("oracledb");
const adminProcedures = require('./procedure_executes/adminProcedures');
const stationProcedures = require('./procedure_executes/stationProcedures');
const routeProcedures = require('./procedure_executes/routeProcedures');

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


// Admin Procedure Wrappers - Clean connection management
async function executeGetDashboardStats() {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetDashboardStats(connection);
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

async function executeGetRecentBookings() {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetRecentBookings(connection);
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

async function executeGetPopularRoutes() {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetPopularRoutes(connection);
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

async function executeGetAllPassengers(status = null) {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetAllPassengers(connection, status);
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

async function executeGetAllAdmins(status = null) {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetAllAdmins(connection, status);
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

async function executeGetPassengerStats(passengerId) {
  let connection;
  try {
    connection = await getConnection();
    return await adminProcedures.executeGetPassengerStats(connection, passengerId);
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

// Station Procedure Wrappers - Clean connection management
async function executeGetAllStations(offset, limit) {
  let connection;
  try {
    connection = await getConnection();
    return await stationProcedures.executeGetAllStations(connection, offset, limit);
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

async function executeGetStationById(stationId) {
  let connection;
  try {
    connection = await getConnection();
    return await stationProcedures.executeGetStationById(connection, stationId);
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

async function executeSearchStations(searchTerm) {
  let connection;
  try {
    connection = await getConnection();
    return await stationProcedures.executeSearchStations(connection, searchTerm);
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

// Route Procedure Wrappers - Clean connection management
async function executeGetAllRoutes(offset, limit) {
  let connection;
  try {
    connection = await getConnection();
    return await routeProcedures.executeGetAllRoutes(connection, offset, limit);
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

async function executeGetRouteById(routeId) {
  let connection;
  try {
    connection = await getConnection();
    return await routeProcedures.executeGetRouteById(connection, routeId);
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

async function executeGetRouteStations(routeId) {
  let connection;
  try {
    connection = await getConnection();
    return await routeProcedures.executeGetRouteStations(connection, routeId);
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
  executeGetDashboardStats,
  executeGetRecentBookings,
  executeGetPopularRoutes,
  executeGetAllPassengers,
  executeGetAllAdmins,
  executeGetPassengerStats,
  executeGetAllStations,
  executeGetStationById,
  executeSearchStations,
  executeGetAllRoutes,
  executeGetRouteById,
  executeGetRouteStations,
  close,
  BIND_OUT: oracledb.BIND_OUT,
  NUMBER: oracledb.NUMBER,
  STRING: oracledb.STRING,
};
