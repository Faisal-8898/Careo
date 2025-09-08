const db = require('../database/connection');

// Get dashboard statistics
const getDashboard = async (req, res) => {
  try {
    // Get various statistics for the dashboard
    const queries = [
      // Total counts
      {
        name: 'totalPassengers',
        sql: `SELECT COUNT(*) as count FROM Passengers WHERE status = 'ACTIVE'`
      },
      {
        name: 'totalTrains',
        sql: `SELECT COUNT(*) as count FROM Trains WHERE status = 'ACTIVE'`
      },
      {
        name: 'totalReservations',
        sql: `SELECT COUNT(*) as count FROM Reservations WHERE booking_status = 'CONFIRMED'`
      },
      {
        name: 'totalRevenue',
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM Payments WHERE payment_status = 'COMPLETED'`
      },
      
      // Today's statistics
      {
        name: 'todayBookings',
        sql: `SELECT COUNT(*) as count FROM Reservations WHERE TRUNC(booking_date) = TRUNC(CURRENT_DATE)`
      },
      {
        name: 'todayRevenue',
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM Payments WHERE TRUNC(payment_date) = TRUNC(CURRENT_DATE) AND payment_status = 'COMPLETED'`
      },
      
      // Pending items
      {
        name: 'pendingPayments',
        sql: `SELECT COUNT(*) as count FROM Payments WHERE payment_status = 'PENDING'`
      },
      {
        name: 'cancelledBookings',
        sql: `SELECT COUNT(*) as count FROM Reservations WHERE booking_status = 'CANCELLED'`
      }
    ];
    
    let dashboard = {};
    
    for (const query of queries) {
      const result = await db.executeQuery(query.sql);
      dashboard[query.name] = result.rows[0].COUNT || result.rows[0].TOTAL || 0;
    }
    
    // Get recent bookings
    const recentBookingsSql = `
      SELECT r.reservation_id, r.booking_reference, r.passenger_name, r.booking_date,
             t.train_name, ds.station_name as departure_station, as_tbl.station_name as arrival_station
      FROM Reservations r
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE r.booking_status = 'CONFIRMED'
      ORDER BY r.booking_date DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    
    const recentBookingsResult = await db.executeQuery(recentBookingsSql);
    dashboard.recentBookings = recentBookingsResult.rows;
    
    // Get popular routes
    const popularRoutesSql = `
      SELECT ds.station_name as departure_station, as_tbl.station_name as arrival_station,
             COUNT(*) as booking_count
      FROM Reservations r
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE r.booking_status = 'CONFIRMED'
      GROUP BY ds.station_name, as_tbl.station_name
      ORDER BY booking_count DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    
    const popularRoutesResult = await db.executeQuery(popularRoutesSql);
    dashboard.popularRoutes = popularRoutesResult.rows;
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
};

// Get all users (passengers and admins)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, user_type, status } = req.query;
    const offset = (page - 1) * limit;
    
    let users = [];
    
    // Get passengers
    if (!user_type || user_type === 'passenger') {
      let passengerSql = `
        SELECT passenger_id as id, username, email, full_name, phone, status, created_at, 'passenger' as user_type
        FROM Passengers
        WHERE 1=1
      `;
      
      let binds = [];
      if (status) {
        passengerSql += ` AND status = :status`;
        binds.push(status);
      }
      
      passengerSql += ` ORDER BY created_at DESC`;
      
      const passengerResult = await db.executeQuery(passengerSql, binds);
      users = users.concat(passengerResult.rows);
    }
    
    // Get admins
    if (!user_type || user_type === 'admin') {
      let adminSql = `
        SELECT admin_id as id, username, email, full_name, employee_id, role, status, created_at, 'admin' as user_type
        FROM Admins
        WHERE 1=1
      `;
      
      let binds = [];
      if (status) {
        adminSql += ` AND status = :status`;
        binds.push(status);
      }
      
      adminSql += ` ORDER BY created_at DESC`;
      
      const adminResult = await db.executeQuery(adminSql, binds);
      users = users.concat(adminResult.rows);
    }
    
    // Sort by created_at
    users.sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));
    
    // Apply pagination
    const paginatedUsers = users.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_type } = req.query;
    
    let user = null;
    
    if (!user_type || user_type === 'passenger') {
      const passengerSql = `
        SELECT passenger_id as id, username, email, full_name, phone, date_of_birth, gender, 
               status, created_at, 'passenger' as user_type
        FROM Passengers WHERE passenger_id = :id
      `;
      const passengerResult = await db.executeQuery(passengerSql, [id]);
      if (passengerResult.rows.length > 0) {
        user = passengerResult.rows[0];
      }
    }
    
    if (!user && (!user_type || user_type === 'admin')) {
      const adminSql = `
        SELECT admin_id as id, username, email, full_name, employee_id, role, 
               status, created_at, 'admin' as user_type
        FROM Admins WHERE admin_id = :id
      `;
      const adminResult = await db.executeQuery(adminSql, [id]);
      if (adminResult.rows.length > 0) {
        user = adminResult.rows[0];
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get additional statistics for the user
    if (user.USER_TYPE === 'passenger') {
      const statsSql = `
        SELECT 
          COUNT(r.reservation_id) as total_bookings,
          COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN r.booking_status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) as total_spent
        FROM Reservations r
        LEFT JOIN Payments p ON r.reservation_id = p.reservation_id
        WHERE r.passenger_id = :passenger_id
      `;
      const statsResult = await db.executeQuery(statsSql, [id]);
      user.statistics = statsResult.rows[0];
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      details: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_type } = req.body;
    
    if (!status || !user_type) {
      return res.status(400).json({
        success: false,
        error: 'Status and user_type are required'
      });
    }
    
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses
      });
    }
    
    let sql, tableName;
    if (user_type === 'passenger') {
      sql = `UPDATE Passengers SET status = :status WHERE passenger_id = :id`;
      tableName = 'Passengers';
    } else if (user_type === 'admin') {
      sql = `UPDATE Admins SET status = :status WHERE admin_id = :id`;
      tableName = 'Admins';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_type'
      });
    }
    
    const result = await db.executeQuery(sql, [status, id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      details: error.message
    });
  }
};

// Get booking reports
const getBookingReports = async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    let dateClause = '';
    let binds = [];
    
    if (date_from && date_to) {
      dateClause = `WHERE r.booking_date >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND r.booking_date <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds = [date_from, date_to];
    }
    
    let groupClause;
    if (group_by === 'month') {
      groupClause = `TO_CHAR(r.booking_date, 'YYYY-MM')`;
    } else {
      groupClause = `TO_CHAR(r.booking_date, 'YYYY-MM-DD')`;
    }
    
    const sql = `
      SELECT ${groupClause} as period,
             COUNT(*) as total_bookings,
             COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
             COUNT(CASE WHEN r.booking_status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
             COALESCE(SUM(r.fare_amount), 0) as total_fare
      FROM Reservations r
      ${dateClause}
      GROUP BY ${groupClause}
      ORDER BY period DESC
    `;
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      parameters: {
        date_from: date_from || 'all',
        date_to: date_to || 'all',
        group_by
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking reports',
      details: error.message
    });
  }
};

// Get revenue reports
const getRevenueReports = async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    let dateClause = '';
    let binds = [];
    
    if (date_from && date_to) {
      dateClause = `WHERE p.payment_date >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND p.payment_date <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds = [date_from, date_to];
    }
    
    let groupClause;
    if (group_by === 'month') {
      groupClause = `TO_CHAR(p.payment_date, 'YYYY-MM')`;
    } else {
      groupClause = `TO_CHAR(p.payment_date, 'YYYY-MM-DD')`;
    }
    
    const sql = `
      SELECT ${groupClause} as period,
             COUNT(*) as total_payments,
             COALESCE(SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) as completed_revenue,
             COALESCE(SUM(CASE WHEN p.payment_status = 'REFUNDED' THEN p.refund_amount ELSE 0 END), 0) as refunded_amount,
             COALESCE(SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END) - SUM(CASE WHEN p.payment_status = 'REFUNDED' THEN p.refund_amount ELSE 0 END), 0) as net_revenue
      FROM Payments p
      ${dateClause}
      GROUP BY ${groupClause}
      ORDER BY period DESC
    `;
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      parameters: {
        date_from: date_from || 'all',
        date_to: date_to || 'all',
        group_by
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue reports',
      details: error.message
    });
  }
};

// Get train utilization reports
const getTrainReports = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let dateClause = '';
    let binds = [];
    
    if (date_from && date_to) {
      dateClause = `AND s.departure_time >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND s.departure_time <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds = [date_from, date_to];
    }
    
    const sql = `
      SELECT t.train_id, t.train_name, t.train_type, t.total_capacity,
             COUNT(s.schedule_id) as total_schedules,
             COUNT(r.reservation_id) as total_bookings,
             COALESCE(SUM(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) as confirmed_bookings,
             ROUND(
               CASE 
                 WHEN COUNT(s.schedule_id) > 0 THEN 
                   (COALESCE(SUM(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) * 100.0) / 
                   (COUNT(s.schedule_id) * t.total_capacity)
                 ELSE 0 
               END, 2
             ) as utilization_percentage,
             COALESCE(SUM(py.amount), 0) as total_revenue
      FROM Trains t
      LEFT JOIN Schedules s ON t.train_id = s.train_id ${dateClause}
      LEFT JOIN Reservations r ON s.schedule_id = r.schedule_id
      LEFT JOIN Payments py ON r.reservation_id = py.reservation_id AND py.payment_status = 'COMPLETED'
      WHERE t.status = 'ACTIVE'
      GROUP BY t.train_id, t.train_name, t.train_type, t.total_capacity
      ORDER BY utilization_percentage DESC
    `;
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      parameters: {
        date_from: date_from || 'all',
        date_to: date_to || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train reports',
      details: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getBookingReports,
  getRevenueReports,
  getTrainReports
};
