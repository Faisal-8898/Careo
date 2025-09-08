const db = require('../database/connection');

// Get audit trail for trains
const getTrainAudit = async (req, res) => {
  try {
    const { page = 1, limit = 20, operation_type, user_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT audit_id, train_id, operation_type,
             old_train_name, old_train_type, old_route_id, old_total_capacity, old_status,
             new_train_name, new_train_type, new_route_id, new_total_capacity, new_status,
             audit_timestamp, user_id, change_reason
      FROM Audit_Trains
      WHERE 1=1
    `;
    
    let binds = [];
    
    if (operation_type) {
      sql += ` AND operation_type = :operation_type`;
      binds.push(operation_type);
    }
    
    if (user_id) {
      sql += ` AND user_id = :user_id`;
      binds.push(user_id);
    }
    
    if (date_from) {
      sql += ` AND audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
      binds.push(date_from);
    }
    
    if (date_to) {
      sql += ` AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_to);
    }
    
    sql += ` ORDER BY audit_timestamp DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      provenance_type: 'HOW - Shows evolution/transformation history of train records'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train audit trail',
      details: error.message
    });
  }
};

// Get audit trail for specific train
const getTrainAuditById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT audit_id, train_id, operation_type,
             old_train_name, old_train_type, old_route_id, old_total_capacity, old_status,
             new_train_name, new_train_type, new_route_id, new_total_capacity, new_status,
             audit_timestamp, user_id, change_reason
      FROM Audit_Trains
      WHERE train_id = :train_id
      ORDER BY audit_timestamp DESC
    `;
    
    const result = await db.executeQuery(sql, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'HOW - Shows complete change history for this specific train'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train audit trail',
      details: error.message
    });
  }
};

// Get audit trail for schedules
const getScheduleAudit = async (req, res) => {
  try {
    const { page = 1, limit = 20, operation_type, user_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT audit_id, schedule_id, operation_type,
             old_train_id, old_departure_station_id, old_arrival_station_id,
             old_departure_time, old_arrival_time, old_base_fare, old_available_seats, old_status,
             new_train_id, new_departure_station_id, new_arrival_station_id,
             new_departure_time, new_arrival_time, new_base_fare, new_available_seats, new_status,
             audit_timestamp, user_id, change_reason
      FROM Audit_Schedules
      WHERE 1=1
    `;
    
    let binds = [];
    
    if (operation_type) {
      sql += ` AND operation_type = :operation_type`;
      binds.push(operation_type);
    }
    
    if (user_id) {
      sql += ` AND user_id = :user_id`;
      binds.push(user_id);
    }
    
    if (date_from) {
      sql += ` AND audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
      binds.push(date_from);
    }
    
    if (date_to) {
      sql += ` AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_to);
    }
    
    sql += ` ORDER BY audit_timestamp DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      provenance_type: 'HOW - Shows schedule status transitions and modifications'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule audit trail',
      details: error.message
    });
  }
};

// Get audit trail for specific schedule
const getScheduleAuditById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT audit_id, schedule_id, operation_type,
             old_train_id, old_departure_station_id, old_arrival_station_id,
             old_departure_time, old_arrival_time, old_base_fare, old_available_seats, old_status,
             new_train_id, new_departure_station_id, new_arrival_station_id,
             new_departure_time, new_arrival_time, new_base_fare, new_available_seats, new_status,
             audit_timestamp, user_id, change_reason
      FROM Audit_Schedules
      WHERE schedule_id = :schedule_id
      ORDER BY audit_timestamp DESC
    `;
    
    const result = await db.executeQuery(sql, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'HOW - Shows complete modification history for this schedule'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule audit trail',
      details: error.message
    });
  }
};

// Get audit trail for passengers (reservations)
const getPassengerAudit = async (req, res) => {
  try {
    const { page = 1, limit = 20, operation_type, user_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT audit_id, reservation_id, operation_type,
             old_passenger_id, old_schedule_id, old_seat_number, old_booking_reference,
             old_passenger_name, old_passenger_age, old_passenger_gender,
             old_booking_status, old_fare_amount,
             new_passenger_id, new_schedule_id, new_seat_number, new_booking_reference,
             new_passenger_name, new_passenger_age, new_passenger_gender,
             new_booking_status, new_fare_amount,
             audit_timestamp, user_id, change_reason
      FROM Audit_Passengers
      WHERE 1=1
    `;
    
    let binds = [];
    
    if (operation_type) {
      sql += ` AND operation_type = :operation_type`;
      binds.push(operation_type);
    }
    
    if (user_id) {
      sql += ` AND user_id = :user_id`;
      binds.push(user_id);
    }
    
    if (date_from) {
      sql += ` AND audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
      binds.push(date_from);
    }
    
    if (date_to) {
      sql += ` AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_to);
    }
    
    sql += ` ORDER BY audit_timestamp DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      provenance_type: 'HOW - Shows booking status transitions and reservation changes'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passenger audit trail',
      details: error.message
    });
  }
};

// Get audit trail for specific reservation
const getPassengerAuditById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT audit_id, reservation_id, operation_type,
             old_passenger_id, old_schedule_id, old_seat_number, old_booking_reference,
             old_passenger_name, old_passenger_age, old_passenger_gender,
             old_booking_status, old_fare_amount,
             new_passenger_id, new_schedule_id, new_seat_number, new_booking_reference,
             new_passenger_name, new_passenger_age, new_passenger_gender,
             new_booking_status, new_fare_amount,
             audit_timestamp, user_id, change_reason
      FROM Audit_Passengers
      WHERE reservation_id = :reservation_id
      ORDER BY audit_timestamp DESC
    `;
    
    const result = await db.executeQuery(sql, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'HOW - Shows complete modification history for this reservation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passenger audit trail',
      details: error.message
    });
  }
};

// Get audit trail for payments
const getPaymentAudit = async (req, res) => {
  try {
    const { page = 1, limit = 20, operation_type, user_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT audit_id, payment_id, operation_type,
             old_reservation_id, old_amount, old_payment_method, old_payment_status,
             old_transaction_id, old_refund_amount, old_refund_date,
             new_reservation_id, new_amount, new_payment_method, new_payment_status,
             new_transaction_id, new_refund_amount, new_refund_date,
             audit_timestamp, user_id, change_reason
      FROM Audit_Payments
      WHERE 1=1
    `;
    
    let binds = [];
    
    if (operation_type) {
      sql += ` AND operation_type = :operation_type`;
      binds.push(operation_type);
    }
    
    if (user_id) {
      sql += ` AND user_id = :user_id`;
      binds.push(user_id);
    }
    
    if (date_from) {
      sql += ` AND audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
      binds.push(date_from);
    }
    
    if (date_to) {
      sql += ` AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_to);
    }
    
    sql += ` ORDER BY audit_timestamp DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      },
      provenance_type: 'WHY - Shows payment status changes and refund justifications'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment audit trail',
      details: error.message
    });
  }
};

// Get audit trail for specific payment
const getPaymentAuditById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT audit_id, payment_id, operation_type,
             old_reservation_id, old_amount, old_payment_method, old_payment_status,
             old_transaction_id, old_refund_amount, old_refund_date,
             new_reservation_id, new_amount, new_payment_method, new_payment_status,
             new_transaction_id, new_refund_amount, new_refund_date,
             audit_timestamp, user_id, change_reason
      FROM Audit_Payments
      WHERE payment_id = :payment_id
      ORDER BY audit_timestamp DESC
    `;
    
    const result = await db.executeQuery(sql, [id]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'WHY - Shows complete payment transaction history and justifications'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment audit trail',
      details: error.message
    });
  }
};

// Get all actions by a specific user (WHERE provenance)
const getAuditByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, table_name, date_from, date_to } = req.query;
    
    let results = [];
    
    // Query each audit table
    const tables = [
      { name: 'trains', table: 'Audit_Trains', id_field: 'train_id' },
      { name: 'schedules', table: 'Audit_Schedules', id_field: 'schedule_id' },
      { name: 'passengers', table: 'Audit_Passengers', id_field: 'reservation_id' },
      { name: 'payments', table: 'Audit_Payments', id_field: 'payment_id' }
    ];
    
    for (const tableInfo of tables) {
      if (table_name && table_name !== tableInfo.name) continue;
      
      let sql = `
        SELECT audit_id, ${tableInfo.id_field} as entity_id,
               operation_type, audit_timestamp, change_reason, '${tableInfo.name}' as table_name
        FROM ${tableInfo.table}
        WHERE user_id = :user_id
      `;
      
      let binds = [userId];
      
      if (date_from) {
        sql += ` AND audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')`;
        binds.push(date_from);
      }
      
      if (date_to) {
        sql += ` AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
        binds.push(date_to);
      }
      
      sql += ` ORDER BY audit_timestamp DESC`;
      
      const result = await db.executeQuery(sql, binds);
      results = results.concat(result.rows);
    }
    
    // Sort all results by timestamp
    results.sort((a, b) => new Date(b.AUDIT_TIMESTAMP) - new Date(a.AUDIT_TIMESTAMP));
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length
      },
      provenance_type: 'WHERE - Shows all actions taken by the specified user across all tables'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user audit trail',
      details: error.message
    });
  }
};

// Get audit records within date range
const getAuditByDateRange = async (req, res) => {
  try {
    const { date_from, date_to, table_name } = req.query;
    
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        error: 'date_from and date_to parameters are required'
      });
    }
    
    let results = {
      trains: [],
      schedules: [],
      passengers: [],
      payments: []
    };
    
    const tables = [
      { name: 'trains', table: 'Audit_Trains', id_field: 'train_id' },
      { name: 'schedules', table: 'Audit_Schedules', id_field: 'schedule_id' },
      { name: 'passengers', table: 'Audit_Passengers', id_field: 'reservation_id' },
      { name: 'payments', table: 'Audit_Payments', id_field: 'payment_id' }
    ];
    
    for (const tableInfo of tables) {
      if (table_name && table_name !== tableInfo.name) continue;
      
      const sql = `
        SELECT audit_id, ${tableInfo.id_field} as entity_id,
               operation_type, audit_timestamp, user_id, change_reason
        FROM ${tableInfo.table}
        WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
          AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
        ORDER BY audit_timestamp DESC
      `;
      
      const result = await db.executeQuery(sql, [date_from, date_to]);
      results[tableInfo.name] = result.rows;
    }
    
    res.json({
      success: true,
      data: results,
      date_range: { from: date_from, to: date_to },
      provenance_type: 'WHERE - Shows all changes within the specified date range'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit records by date range',
      details: error.message
    });
  }
};

// Get audit summary statistics
const getAuditSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let dateClause = '';
    let binds = [];
    
    if (date_from && date_to) {
      dateClause = `WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds = [date_from, date_to];
    }
    
    const queries = [
      {
        name: 'trains',
        sql: `SELECT operation_type, COUNT(*) as count FROM Audit_Trains ${dateClause} GROUP BY operation_type`
      },
      {
        name: 'schedules',
        sql: `SELECT operation_type, COUNT(*) as count FROM Audit_Schedules ${dateClause} GROUP BY operation_type`
      },
      {
        name: 'passengers',
        sql: `SELECT operation_type, COUNT(*) as count FROM Audit_Passengers ${dateClause} GROUP BY operation_type`
      },
      {
        name: 'payments',
        sql: `SELECT operation_type, COUNT(*) as count FROM Audit_Payments ${dateClause} GROUP BY operation_type`
      }
    ];
    
    let summary = {};
    
    for (const query of queries) {
      const result = await db.executeQuery(query.sql, binds);
      summary[query.name] = result.rows.reduce((acc, row) => {
        acc[row.OPERATION_TYPE] = row.COUNT;
        return acc;
      }, {});
    }
    
    // Get top active users
    const userActivitySql = `
      SELECT user_id, COUNT(*) as total_actions
      FROM (
        SELECT user_id FROM Audit_Trains ${dateClause}
        UNION ALL
        SELECT user_id FROM Audit_Schedules ${dateClause}
        UNION ALL
        SELECT user_id FROM Audit_Passengers ${dateClause}
        UNION ALL
        SELECT user_id FROM Audit_Payments ${dateClause}
      )
      GROUP BY user_id
      ORDER BY total_actions DESC
      FETCH FIRST 10 ROWS ONLY
    `;
    
    const userActivityResult = await db.executeQuery(userActivitySql, binds);
    
    res.json({
      success: true,
      data: {
        summary_by_table: summary,
        top_active_users: userActivityResult.rows,
        date_range: date_from && date_to ? { from: date_from, to: date_to } : 'All time'
      },
      provenance_type: 'SUMMARY - Overview of all audit activity and user actions'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit summary',
      details: error.message
    });
  }
};

module.exports = {
  getTrainAudit,
  getTrainAuditById,
  getScheduleAudit,
  getScheduleAuditById,
  getPassengerAudit,
  getPassengerAuditById,
  getPaymentAudit,
  getPaymentAuditById,
  getAuditByUser,
  getAuditByDateRange,
  getAuditSummary
};
