const oracledb = require('oracledb');

/**
 * Route Procedure Executions
 * This module contains all procedure execution methods for route-related operations
 */

// Execute GetAllRoutes procedure
async function executeGetAllRoutes(connection, offset, limit) {
    try {
        const result = await connection.execute(
            `BEGIN GetAllRoutes(:p_offset, :p_limit, :p_routes); END;`,
            {
                p_offset: offset,
                p_limit: limit,
                p_routes: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_routes;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetAllRoutes:", err);
        throw err;
    }
}

// Execute GetRouteById procedure
async function executeGetRouteById(connection, routeId) {
    try {
        const result = await connection.execute(
            `BEGIN GetRouteById(:p_route_id, :p_route, :p_stations); END;`,
            {
                p_route_id: routeId,
                p_route: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
                p_stations: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        // Get route data
        const routeCursor = result.outBinds.p_route;
        const routeRows = await routeCursor.getRows();
        await routeCursor.close();

        // Get stations data
        const stationsCursor = result.outBinds.p_stations;
        const stationsRows = await stationsCursor.getRows();
        await stationsCursor.close();

        return {
            routeRows,
            stationsRows
        };
    } catch (err) {
        console.error("Error executing GetRouteById:", err);
        throw err;
    }
}

// Execute GetRouteStations procedure
async function executeGetRouteStations(connection, routeId) {
    try {
        const result = await connection.execute(
            `BEGIN GetRouteStations(:p_route_id, :p_stations); END;`,
            {
                p_route_id: routeId,
                p_stations: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_stations;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetRouteStations:", err);
        throw err;
    }
}

module.exports = {
    executeGetAllRoutes,
    executeGetRouteById,
    executeGetRouteStations
};
