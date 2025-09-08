const db = require("../database/connection");

// Get all stations
const getAllStations = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT station_id, station_name, station_code, city, created_at
      FROM Stations
      ORDER BY station_name
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await db.executeQuery(sql, [offset, parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch stations",
      details: error.message,
    });
  }
};

// Get station by ID
const getStationById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT station_id, station_name, station_code, city, created_at
      FROM Stations
      WHERE station_id = :id
    `;

    const result = await db.executeQuery(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch station",
      details: error.message,
    });
  }
};

// Create new station
const createStation = async (req, res) => {
  try {
    const { station_name, station_code, city } = req.body;

    if (!station_name || !station_code || !city) {
      return res.status(400).json({
        success: false,
        error: "Station name, station code, and city are required",
      });
    }

    const sql = `
      INSERT INTO Stations (station_id, station_name, station_code, city)
      VALUES (station_seq.NEXTVAL, :station_name, :station_code, :city)
      RETURNING station_id INTO :station_id
    `;

    const binds = {
      station_name,
      station_code: station_code.toUpperCase(),
      city,
      station_id: { dir: db.BIND_OUT, type: db.NUMBER },
    };

    const result = await db.executeQuery(sql, binds);

    res.status(201).json({
      success: true,
      message: "Station created successfully",
      data: {
        station_id: result.outBinds.station_id[0],
        station_name,
        station_code: station_code.toUpperCase(),
        city,
      },
    });
  } catch (error) {
    if (error.message.includes("unique constraint")) {
      res.status(409).json({
        success: false,
        error: "Station code already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create station",
        details: error.message,
      });
    }
  }
};

// Update station
const updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const allowedFields = ["station_name", "station_code", "city"];
    const fieldsToUpdate = Object.keys(updateFields).filter((field) =>
      allowedFields.includes(field)
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    // Uppercase station code if provided
    if (updateFields.station_code) {
      updateFields.station_code = updateFields.station_code.toUpperCase();
    }

    const setClause = fieldsToUpdate
      .map((field) => `${field} = :${field}`)
      .join(", ");
    const sql = `
      UPDATE Stations 
      SET ${setClause}
      WHERE station_id = :station_id
    `;

    const binds = { ...updateFields, station_id: id };
    const result = await db.executeQuery(sql, binds);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    res.json({
      success: true,
      message: "Station updated successfully",
    });
  } catch (error) {
    if (error.message.includes("unique constraint")) {
      res.status(409).json({
        success: false,
        error: "Station code already exists",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to update station",
        details: error.message,
      });
    }
  }
};

// Delete station
const deleteStation = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `DELETE FROM Stations WHERE station_id = :station_id`;
    const result = await db.executeQuery(sql, [id]);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    res.json({
      success: true,
      message: "Station deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete station",
      details: error.message,
    });
  }
};

// Search stations
const searchStations = async (req, res) => {
  try {
    const { term } = req.params;

    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search term must be at least 2 characters long",
      });
    }

    const sql = `
      SELECT station_id, station_name, station_code, city
      FROM Stations
      WHERE UPPER(station_name) LIKE UPPER(:term)
         OR UPPER(station_code) LIKE UPPER(:term)
         OR UPPER(city) LIKE UPPER(:term)
      ORDER BY station_name
      FETCH FIRST 20 ROWS ONLY
    `;

    const searchTerm = `%${term}%`;
    const result = await db.executeQuery(sql, [
      searchTerm,
      searchTerm,
      searchTerm,
    ]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to search stations",
      details: error.message,
    });
  }
};

module.exports = {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  searchStations,
};
