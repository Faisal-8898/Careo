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
    
    const sql = `DELETE FROM Trains WHERE train_id = :train_id`;
    const result = await db.executeQuery(sql, [id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Train deleted successfully'
    });
  } catch (error) {
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
