const db = require('../database/connection');

// Get all trains
const getAllTrains = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT t.train_id, t.train_name, t.train_type, t.total_capacity, t.status, t.created_at,
             r.route_id, r.route_name, r.route_code
      FROM Trains t
      JOIN Routes r ON t.route_id = r.route_id
    `;

    let binds = [];

    if (status) {
      sql += ` WHERE t.status = :status`;
      binds.push(status);
    }

    sql += ` ORDER BY t.train_name OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));

    const result = await db.executeQuery(sql, binds);


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
      error: 'Failed to fetch trains',
      details: error.message
    });
  }
};

// Get train by ID
const getTrainById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT t.train_id, t.train_name, t.train_type, t.total_capacity, t.status, t.created_at,
             r.route_id, r.route_name, r.route_code
      FROM Trains t
      JOIN Routes r ON t.route_id = r.route_id
      WHERE t.train_id = :id
    `;

    const result = await db.executeQuery(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train',
      details: error.message
    });
  }
};

// Create new train
const createTrain = async (req, res) => {
  try {
    const { train_name, train_type, route_id, total_capacity = 100, status = 'ACTIVE' } = req.body;

    if (!train_name || !train_type || !route_id) {
      return res.status(400).json({
        success: false,
        error: 'Train name, train type, and route ID are required'
      });
    }

    // Check if route exists
    const routeCheckSql = `SELECT COUNT(*) as count FROM Routes WHERE route_id = :route_id`;
    const routeCheckResult = await db.executeQuery(routeCheckSql, [route_id]);

    if (routeCheckResult.rows[0].COUNT === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    const sql = `
      INSERT INTO Trains (train_id, train_name, train_type, route_id, total_capacity, status)
      VALUES (train_seq.NEXTVAL, :train_name, :train_type, :route_id, :total_capacity, :status)
      RETURNING train_id INTO :train_id
    `;

    const binds = {
      train_name,
      train_type,
      route_id,
      total_capacity,
      status,
      train_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };

    const result = await db.executeQuery(sql, binds);

    res.status(201).json({
      success: true,
      message: 'Train created successfully',
      data: {
        train_id: result.outBinds.train_id[0],
        train_name,
        train_type,
        route_id,
        total_capacity,
        status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create train',
      details: error.message
    });
  }
};

// Update train
const updateTrain = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const allowedFields = ['train_name', 'train_type', 'route_id', 'total_capacity', 'status'];
    const fieldsToUpdate = Object.keys(updateFields).filter(field =>
      allowedFields.includes(field)
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // If route_id is being updated, check if it exists
    if (updateFields.route_id) {
      const routeCheckSql = `SELECT COUNT(*) as count FROM Routes WHERE route_id = :route_id`;
      const routeCheckResult = await db.executeQuery(routeCheckSql, [updateFields.route_id]);

      if (routeCheckResult.rows[0].COUNT === 0) {
        return res.status(404).json({
          success: false,
          error: 'Route not found'
        });
      }
    }

    const setClause = fieldsToUpdate.map(field => `${field} = :${field}`).join(', ');
    const sql = `
      UPDATE Trains 
      SET ${setClause}
      WHERE train_id = :train_id
    `;

    const binds = { ...updateFields, train_id: id };
    const result = await db.executeQuery(sql, binds);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    res.json({
      success: true,
      message: 'Train updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update train',
      details: error.message
    });
  }
};

// Delete train
const deleteTrain = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete train with ID: ${id}`);

    // First check if train exists
    const checkTrainSql = `SELECT train_name FROM Trains WHERE train_id = :train_id`;
    console.log('Checking if train exists...');
    const trainResult = await db.executeQuery(checkTrainSql, [id]);

    if (trainResult.rows.length === 0) {
      console.log('Train not found');
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    const trainName = trainResult.rows[0].TRAIN_NAME;
    console.log(`Found train: ${trainName}`);

    // Check for related schedules
    const scheduleCheckSql = `SELECT COUNT(*) as count FROM Schedules WHERE train_id = :train_id`;
    console.log('Checking for related schedules...');
    const scheduleResult = await db.executeQuery(scheduleCheckSql, [id]);
    const scheduleCount = scheduleResult.rows[0].COUNT;

    if (scheduleCount > 0) {
      console.log(`Found ${scheduleCount} schedules for train ${id}`);
      return res.status(400).json({
        success: false,
        error: `Cannot delete train "${trainName}" because it has ${scheduleCount} schedule(s). Please delete all schedules first.`
      });
    }

    // Check for related reservations (if any exist)
    const reservationCheckSql = `SELECT COUNT(*) as count FROM Reservations r JOIN Schedules s ON r.schedule_id = s.schedule_id WHERE s.train_id = :train_id`;
    console.log('Checking for related reservations...');
    const reservationResult = await db.executeQuery(reservationCheckSql, [id]);
    const reservationCount = reservationResult.rows[0].COUNT;

    if (reservationCount > 0) {
      console.log(`Found ${reservationCount} reservations for train ${id}`);
      return res.status(400).json({
        success: false,
        error: `Cannot delete train "${trainName}" because it has ${reservationCount} reservation(s). Please cancel all reservations first.`
      });
    }

    // If no related records, proceed with deletion
    console.log(`No related records found. Proceeding with deletion of train ${id}...`);
    const deleteSql = `DELETE FROM Trains WHERE train_id = :train_id`;

    try {
      const result = await db.executeQuery(deleteSql, [id]);
      console.log(`Delete result: ${result.rowsAffected} rows affected`);

      if (result.rowsAffected === 0) {
        console.log('No rows were affected by the delete operation');
        return res.status(404).json({
          success: false,
          error: 'Train not found or already deleted'
        });
      }

      console.log(`Successfully deleted train ${id}`);
      res.json({
        success: true,
        message: `Train "${trainName}" deleted successfully`
      });
    } catch (deleteError) {
      console.error('Error during delete operation:', deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error('Error in deleteTrain:', error);

    // Handle Oracle constraint errors specifically
    if (error.errorNum === 2292) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete train because it has related records (schedules or reservations). Please delete all related records first.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete train',
      details: error.message
    });
  }
};

// Get trains by route
const getTrainsByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    const sql = `
      SELECT t.train_id, t.train_name, t.train_type, t.total_capacity, t.status, t.created_at,
             r.route_name, r.route_code
      FROM Trains t
      JOIN Routes r ON t.route_id = r.route_id
      WHERE t.route_id = :route_id AND t.status = 'ACTIVE'
      ORDER BY t.train_name
    `;

    const result = await db.executeQuery(sql, [routeId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trains for route',
      details: error.message
    });
  }
};

module.exports = {
  getAllTrains,
  getTrainById,
  createTrain,
  updateTrain,
  deleteTrain,
  getTrainsByRoute
};
