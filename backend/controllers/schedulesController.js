const db = require('../database/connection');

// Get all schedules with filters
const getAllSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT s.schedule_id, s.train_id, s.departure_time, s.arrival_time, 
             s.base_fare, s.available_seats, s.status, s.created_at,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.station_code as departure_code,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code,
             r.route_name
      FROM Schedules s
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Routes r ON t.route_id = r.route_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE 1=1
    `;
    
    let binds = [];
    
    if (status) {
      sql += ` AND s.status = :status`;
      binds.push(status);
    }
    
    if (date_from) {
      sql += ` AND s.departure_time >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
      binds.push(date_from);
    }
    
    if (date_to) {
      sql += ` AND s.departure_time <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_to);
    }
    
    sql += ` ORDER BY s.departure_time OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));
    
    const result = await db.executeQuery(sql, binds);
    
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
      error: 'Failed to fetch schedules',
      details: error.message
    });
  }
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT s.schedule_id, s.train_id, s.departure_time, s.arrival_time, 
             s.base_fare, s.available_seats, s.status, s.created_at,
             t.train_name, t.train_type, t.total_capacity,
             ds.station_name as departure_station, ds.station_code as departure_code, ds.city as departure_city,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code, as_tbl.city as arrival_city,
             r.route_name, r.route_code
      FROM Schedules s
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Routes r ON t.route_id = r.route_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE s.schedule_id = :id
    `;
    
    const result = await db.executeQuery(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule',
      details: error.message
    });
  }
};

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const {
      train_id,
      departure_station_id,
      arrival_station_id,
      departure_time,
      arrival_time,
      base_fare,
      available_seats
    } = req.body;
    
    if (!train_id || !departure_station_id || !arrival_station_id || 
        !departure_time || !arrival_time || !base_fare || !available_seats) {
      return res.status(400).json({
        success: false,
        error: 'All schedule fields are required'
      });
    }
    
    // Validate that departure and arrival stations are different
    if (departure_station_id === arrival_station_id) {
      return res.status(400).json({
        success: false,
        error: 'Departure and arrival stations must be different'
      });
    }
    
    // Check if train exists
    const trainCheckSql = `SELECT total_capacity FROM Trains WHERE train_id = :train_id`;
    const trainCheckResult = await db.executeQuery(trainCheckSql, [train_id]);
    
    if (trainCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }
    
    const trainCapacity = trainCheckResult.rows[0].TOTAL_CAPACITY;
    
    if (available_seats > trainCapacity) {
      return res.status(400).json({
        success: false,
        error: `Available seats cannot exceed train capacity (${trainCapacity})`
      });
    }
    
    const sql = `
      INSERT INTO Schedules (
        schedule_id, train_id, departure_station_id, arrival_station_id,
        departure_time, arrival_time, base_fare, available_seats
      ) VALUES (
        schedule_seq.NEXTVAL, :train_id, :departure_station_id, :arrival_station_id,
        TO_TIMESTAMP(:departure_time, 'YYYY-MM-DD HH24:MI:SS'),
        TO_TIMESTAMP(:arrival_time, 'YYYY-MM-DD HH24:MI:SS'),
        :base_fare, :available_seats
      ) RETURNING schedule_id INTO :schedule_id
    `;
    
    const binds = {
      train_id,
      departure_station_id,
      arrival_station_id,
      departure_time,
      arrival_time,
      base_fare,
      available_seats,
      schedule_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };
    
    const result = await db.executeQuery(sql, binds);
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        schedule_id: result.outBinds.schedule_id[0],
        train_id,
        departure_station_id,
        arrival_station_id,
        departure_time,
        arrival_time,
        base_fare,
        available_seats,
        status: 'SCHEDULED'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      details: error.message
    });
  }
};

// Update schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    const allowedFields = [
      'departure_time', 'arrival_time', 'base_fare', 'available_seats', 'status'
    ];
    
    const fieldsToUpdate = Object.keys(updateFields).filter(field => 
      allowedFields.includes(field)
    );
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Handle timestamp fields
    let setClause = [];
    let binds = { schedule_id: id };
    
    fieldsToUpdate.forEach(field => {
      if (field === 'departure_time' || field === 'arrival_time') {
        setClause.push(`${field} = TO_TIMESTAMP(:${field}, 'YYYY-MM-DD HH24:MI:SS')`);
      } else {
        setClause.push(`${field} = :${field}`);
      }
      binds[field] = updateFields[field];
    });
    
    const sql = `
      UPDATE Schedules 
      SET ${setClause.join(', ')}
      WHERE schedule_id = :schedule_id
    `;
    
    const result = await db.executeQuery(sql, binds);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
      details: error.message
    });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `DELETE FROM Schedules WHERE schedule_id = :schedule_id`;
    const result = await db.executeQuery(sql, [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule',
      details: error.message
    });
  }
};

// Search schedules by route
const searchSchedulesByRoute = async (req, res) => {
  try {
    const { departure_station, arrival_station, travel_date } = req.query;
    
    if (!departure_station || !arrival_station) {
      return res.status(400).json({
        success: false,
        error: 'Departure station and arrival station are required'
      });
    }
    
    let sql = `
      SELECT s.schedule_id, s.train_id, s.departure_time, s.arrival_time, 
             s.base_fare, s.available_seats, s.status,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.station_code as departure_code,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code
      FROM Schedules s
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE (UPPER(ds.station_name) LIKE UPPER(:departure_station) OR UPPER(ds.station_code) LIKE UPPER(:departure_station))
        AND (UPPER(as_tbl.station_name) LIKE UPPER(:arrival_station) OR UPPER(as_tbl.station_code) LIKE UPPER(:arrival_station))
        AND s.status IN ('SCHEDULED', 'DELAYED')
        AND s.available_seats > 0
    `;
    
    let binds = [`%${departure_station}%`, `%${departure_station}%`, 
                 `%${arrival_station}%`, `%${arrival_station}%`];
    
    if (travel_date) {
      sql += ` AND TRUNC(s.departure_time) = TO_DATE(:travel_date, 'YYYY-MM-DD')`;
      binds.push(travel_date);
    }
    
    sql += ` ORDER BY s.departure_time`;
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      search_criteria: {
        departure_station,
        arrival_station,
        travel_date: travel_date || 'any'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search schedules',
      details: error.message
    });
  }
};

// Get schedules by train
const getSchedulesByTrain = async (req, res) => {
  try {
    const { trainId } = req.params;
    
    const sql = `
      SELECT s.schedule_id, s.departure_time, s.arrival_time, 
             s.base_fare, s.available_seats, s.status, s.created_at,
             ds.station_name as departure_station, ds.station_code as departure_code,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code
      FROM Schedules s
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE s.train_id = :train_id
      ORDER BY s.departure_time
    `;
    
    const result = await db.executeQuery(sql, [trainId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules for train',
      details: error.message
    });
  }
};

// Update schedule status
const updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['SCHEDULED', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }
    
    const sql = `
      UPDATE Schedules 
      SET status = :status
      WHERE schedule_id = :schedule_id
    `;
    
    const result = await db.executeQuery(sql, [status, id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Schedule status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule status',
      details: error.message
    });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  searchSchedulesByRoute,
  getSchedulesByTrain,
  updateScheduleStatus
};
