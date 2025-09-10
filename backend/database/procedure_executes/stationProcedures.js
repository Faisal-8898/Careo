const oracledb = require('oracledb');

/**
 * Station Procedure Executions
 * This module contains all procedure execution methods for station-related operations
 */

// Execute GetAllStations procedure
async function executeGetAllStations(connection, offset, limit) {
    try {
        const result = await connection.execute(
            `BEGIN GetAllStations(:p_offset, :p_limit, :p_stations); END;`,
            {
                p_offset: offset,
                p_limit: limit,
                p_stations: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_stations;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetAllStations:", err);
        throw err;
    }
}

// Execute GetStationById procedure
async function executeGetStationById(connection, stationId) {
    try {
        const result = await connection.execute(
            `BEGIN GetStationById(:p_station_id, :p_station); END;`,
            {
                p_station_id: stationId,
                p_station: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_station;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing GetStationById:", err);
        throw err;
    }
}

// Execute SearchStations procedure
async function executeSearchStations(connection, searchTerm) {
    try {
        const result = await connection.execute(
            `BEGIN SearchStations(:p_search_term, :p_stations); END;`,
            {
                p_search_term: searchTerm,
                p_stations: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.p_stations;
        const rows = await cursor.getRows();
        await cursor.close();

        return { rows };
    } catch (err) {
        console.error("Error executing SearchStations:", err);
        throw err;
    }
}

module.exports = {
    executeGetAllStations,
    executeGetStationById,
    executeSearchStations
};
