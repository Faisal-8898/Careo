const db = require('../database/connection');

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Use stored procedure instead of direct query
    const result = await db.executeGetAllRoutes(offset, parseInt(limit));

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routes',
      details: error.message
    });
  }
};

// Get route by ID with stations
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Use stored procedure instead of direct queries
    const result = await db.executeGetRouteById(id);

    if (result.routeRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    const route = result.routeRows[0];
    route.stations = result.stationsRows;

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route',
      details: error.message
    });
  }
};

// Create new route
const createRoute = async (req, res) => {
  try {
    const { route_name, route_code } = req.body;

    if (!route_name || !route_code) {
      return res.status(400).json({
        success: false,
        error: 'Route name and route code are required'
      });
    }

    const sql = `
      INSERT INTO Routes (route_id, route_name, route_code)
      VALUES (route_seq.NEXTVAL, :route_name, :route_code)
      RETURNING route_id INTO :route_id
    `;

    const binds = {
      route_name,
      route_code: route_code.toUpperCase(),
      route_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };

    const result = await db.executeQuery(sql, binds);

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: {
        route_id: result.outBinds.route_id[0],
        route_name,
        route_code: route_code.toUpperCase()
      }
    });
  } catch (error) {
    if (error.message.includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Route code already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create route',
        details: error.message
      });
    }
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const allowedFields = ['route_name', 'route_code'];
    const fieldsToUpdate = Object.keys(updateFields).filter(field =>
      allowedFields.includes(field)
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Uppercase route code if provided
    if (updateFields.route_code) {
      updateFields.route_code = updateFields.route_code.toUpperCase();
    }

    const setClause = fieldsToUpdate.map(field => `${field} = :${field}`).join(', ');
    const sql = `
      UPDATE Routes 
      SET ${setClause}
      WHERE route_id = :route_id
    `;

    const binds = { ...updateFields, route_id: id };
    const result = await db.executeQuery(sql, binds);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route updated successfully'
    });
  } catch (error) {
    if (error.message.includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Route code already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update route',
        details: error.message
      });
    }
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM Routes WHERE route_id = :route_id`;
    const result = await db.executeQuery(sql, [id]);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete route',
      details: error.message
    });
  }
};

// Add station to route
const addStationToRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { station_id, stop_sequence, distance_km = 0 } = req.body;

    if (!station_id || !stop_sequence) {
      return res.status(400).json({
        success: false,
        error: 'Station ID and stop sequence are required'
      });
    }

    // Check if route exists
    const routeCheckSql = `SELECT COUNT(*) as count FROM Routes WHERE route_id = :route_id`;
    const routeCheckResult = await db.executeQuery(routeCheckSql, [id]);

    if (routeCheckResult.rows[0].COUNT === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Check if station exists
    const stationCheckSql = `SELECT COUNT(*) as count FROM Stations WHERE station_id = :station_id`;
    const stationCheckResult = await db.executeQuery(stationCheckSql, [station_id]);

    if (stationCheckResult.rows[0].COUNT === 0) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }

    const sql = `
      INSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km)
      VALUES (:route_id, :station_id, :stop_sequence, :distance_km)
    `;

    await db.executeQuery(sql, [id, station_id, stop_sequence, distance_km]);

    res.status(201).json({
      success: true,
      message: 'Station added to route successfully'
    });
  } catch (error) {
    if (error.message.includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Station already exists in this route'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add station to route',
        details: error.message
      });
    }
  }
};

// Remove station from route
const removeStationFromRoute = async (req, res) => {
  try {
    const { id, stationId } = req.params;

    const sql = `
      DELETE FROM Route_Stations 
      WHERE route_id = :route_id AND station_id = :station_id
    `;

    const result = await db.executeQuery(sql, [id, stationId]);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Station not found in this route'
      });
    }

    res.json({
      success: true,
      message: 'Station removed from route successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove station from route',
      details: error.message
    });
  }
};

// Get all stations in a route
const getRouteStations = async (req, res) => {
  try {
    const { id } = req.params;

    // Use stored procedure instead of direct query
    const result = await db.executeGetRouteStations(id);

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route stations',
      details: error.message
    });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  addStationToRoute,
  removeStationFromRoute,
  getRouteStations
};
