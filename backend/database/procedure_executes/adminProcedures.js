const oracledb = require('oracledb');

/**
 * Admin Procedure Executions
 * This module contains all procedure execution methods for admin-related operations
 */

// Execute GetDashboardStats procedure
async function executeGetDashboardStats(connection) {
    try {
        const result = await connection.execute(
            `BEGIN GetDashboardStats(:p_total_passengers, :p_total_trains, :p_total_reservations, :p_total_revenue, :p_today_bookings, :p_today_revenue, :p_pending_payments, :p_cancelled_bookings); END;`,
            {
                p_total_passengers: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_total_trains: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_total_reservations: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_total_revenue: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_today_bookings: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_today_revenue: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_pending_payments: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_cancelled_bookings: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }
        );
        return result;
    } catch (err) {
        console.error("Error executing GetDashboardStats:", err);
        throw err;
    }
}

// Execute GetRecentBookings procedure
async function executeGetRecentBookings(connection) {
    try {
        const result = await connection.execute(
            `BEGIN GetRecentBookings(:p_recent_bookings); END;`,
            {
                p_recent_bookings: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_recent_bookings;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetRecentBookings:", err);
        throw err;
    }
}

// Execute GetPopularRoutes procedure
async function executeGetPopularRoutes(connection) {
    try {
        const result = await connection.execute(
            `BEGIN GetPopularRoutes(:p_popular_routes); END;`,
            {
                p_popular_routes: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_popular_routes;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetPopularRoutes:", err);
        throw err;
    }
}

// Execute GetAllPassengers procedure
async function executeGetAllPassengers(connection, status = null) {
    try {
        const result = await connection.execute(
            `BEGIN GetAllPassengers(:p_status, :p_passengers); END;`,
            {
                p_status: status,
                p_passengers: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_passengers;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetAllPassengers:", err);
        throw err;
    }
}

// Execute GetAllAdmins procedure
async function executeGetAllAdmins(connection, status = null) {
    try {
        const result = await connection.execute(
            `BEGIN GetAllAdmins(:p_status, :p_admins); END;`,
            {
                p_status: status,
                p_admins: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_admins;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetAllAdmins:", err);
        throw err;
    }
}

// Execute GetPassengerStats procedure
async function executeGetPassengerStats(connection, passengerId) {
    try {
        const result = await connection.execute(
            `BEGIN GetPassengerStats(:p_passenger_id, :p_total_bookings, :p_confirmed_bookings, :p_cancelled_bookings, :p_total_spent); END;`,
            {
                p_passenger_id: passengerId,
                p_total_bookings: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_confirmed_bookings: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_cancelled_bookings: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                p_total_spent: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }
        );
        return result;
    } catch (err) {
        console.error("Error executing GetPassengerStats:", err);
        throw err;
    }
}

module.exports = {
    executeGetDashboardStats,
    executeGetRecentBookings,
    executeGetPopularRoutes,
    executeGetAllPassengers,
    executeGetAllAdmins,
    executeGetPassengerStats
};
