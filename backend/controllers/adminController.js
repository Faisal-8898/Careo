const db = require('../database/connection');

// Get dashboard statistics
const getDashboard = async (req, res) => {
  try {
    // Get dashboard statistics using stored procedure
    const statsResult = await db.executeGetDashboardStats();
    const stats = statsResult.outBinds;

    const dashboard = {
      totalPassengers: stats.p_total_passengers || 0,
      totalTrains: stats.p_total_trains || 0,
      totalReservations: stats.p_total_reservations || 0,
      totalRevenue: stats.p_total_revenue || 0,
      todayBookings: stats.p_today_bookings || 0,
      todayRevenue: stats.p_today_revenue || 0,
      pendingPayments: stats.p_pending_payments || 0,
      cancelledBookings: stats.p_cancelled_bookings || 0
    };

    // Get recent bookings using stored procedure
    const recentBookingsResult = await db.executeGetRecentBookings();
    dashboard.recentBookings = recentBookingsResult.rows;

    // Get popular routes using stored procedure
    const popularRoutesResult = await db.executeGetPopularRoutes();
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

    // Get passengers using stored procedure
    if (!user_type || user_type === 'passenger') {
      const passengerResult = await db.executeGetAllPassengers(status);
      users = users.concat(passengerResult.rows);
    }

    // Get admins using stored procedure
    if (!user_type || user_type === 'admin') {
      const adminResult = await db.executeGetAllAdmins(status);
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

    // Get additional statistics for the user using stored procedure
    if (user.USER_TYPE === 'passenger') {
      const statsResult = await db.executeGetPassengerStats(id);
      const stats = statsResult.outBinds;
      user.statistics = {
        TOTAL_BOOKINGS: stats.p_total_bookings || 0,
        CONFIRMED_BOOKINGS: stats.p_confirmed_bookings || 0,
        CANCELLED_BOOKINGS: stats.p_cancelled_bookings || 0,
        TOTAL_SPENT: stats.p_total_spent || 0
      };
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

// WHAT Provenance: Revenue Source Lineage
const getRevenueSourceLineage = async (req, res) => {
  try {
    const { date_from, date_to, route_id } = req.query;

    let dateClause = '';
    let routeClause = '';
    let binds = [];

    if (date_from && date_to) {
      dateClause = `AND p.payment_date >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND p.payment_date <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_from, date_to);
    }

    if (route_id) {
      routeClause = `AND r.route_id = :route_id`;
      binds.push(route_id);
    }

    const sql = `
      SELECT p.payment_id, p.amount, p.payment_status, p.payment_date,
             res.reservation_id, res.booking_reference, res.passenger_name,
             s.schedule_id, s.departure_time, s.arrival_time,
             t.train_name, t.train_type,
             r.route_name, r.route_code,
             ds.station_name as departure_station,
             as_tbl.station_name as arrival_station
      FROM Payments p
      JOIN Reservations res ON p.reservation_id = res.reservation_id
      JOIN Schedules s ON res.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Routes r ON t.route_id = r.route_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE p.payment_status = 'COMPLETED'
        ${dateClause}
        ${routeClause}
      ORDER BY p.payment_date DESC
    `;

    const result = await db.executeQuery(sql, binds);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'WHAT - Shows source data that contributed to revenue calculations'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue source lineage',
      details: error.message
    });
  }
};

// WHAT Provenance: Train Utilization Source
const getTrainUtilizationSource = async (req, res) => {
  try {
    const { train_id, date_from, date_to } = req.query;

    if (!train_id) {
      return res.status(400).json({
        success: false,
        error: 'Train ID is required'
      });
    }

    let dateClause = '';
    let binds = [train_id];

    if (date_from && date_to) {
      dateClause = `AND s.departure_time >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND s.departure_time <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_from, date_to);
    }

    const sql = `
      SELECT s.schedule_id, s.departure_time, s.arrival_time, s.available_seats,
             COUNT(res.reservation_id) as bookings_count,
             COUNT(CASE WHEN res.booking_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
             ROUND(
               (COUNT(CASE WHEN res.booking_status = 'CONFIRMED' THEN 1 END) * 100.0) / 
               GREATEST(s.available_seats, 1), 2
             ) as utilization_percentage,
             ds.station_name as departure_station,
             as_tbl.station_name as arrival_station
      FROM Schedules s
      JOIN Trains t ON s.train_id = t.train_id
      LEFT JOIN Reservations res ON s.schedule_id = res.schedule_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE t.train_id = :train_id
        ${dateClause}
      GROUP BY s.schedule_id, s.departure_time, s.arrival_time, s.available_seats,
               ds.station_name, as_tbl.station_name
      ORDER BY s.departure_time
    `;

    const result = await db.executeQuery(sql, binds);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'WHAT - Shows source schedules and bookings that contributed to train utilization'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch train utilization source',
      details: error.message
    });
  }
};

// WHAT Provenance: Popular Route Derivation
const getPopularRouteDerivation = async (req, res) => {
  try {
    const { date_from, date_to, limit = 10 } = req.query;

    let dateClause = '';
    let binds = [];

    if (date_from && date_to) {
      dateClause = `AND res.booking_date >= TO_DATE(:date_from, 'YYYY-MM-DD')
                      AND res.booking_date <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1`;
      binds.push(date_from, date_to);
    }

    const sql = `
      SELECT r.route_id, r.route_name, r.route_code,
             COUNT(res.reservation_id) as total_bookings,
             COUNT(CASE WHEN res.booking_status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
             COUNT(DISTINCT res.passenger_id) as unique_passengers,
             SUM(CASE WHEN res.booking_status = 'CONFIRMED' THEN res.fare_amount ELSE 0 END) as total_revenue,
             ds.station_name as departure_station,
             as_tbl.station_name as arrival_station
      FROM Routes r
      JOIN Trains t ON r.route_id = t.route_id
      JOIN Schedules s ON t.train_id = s.train_id
      LEFT JOIN Reservations res ON s.schedule_id = res.schedule_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE 1=1
        ${dateClause}
      GROUP BY r.route_id, r.route_name, r.route_code, ds.station_name, as_tbl.station_name
      ORDER BY confirmed_bookings DESC, total_revenue DESC
      FETCH FIRST ${parseInt(limit)} ROWS ONLY
    `;

    const result = await db.executeQuery(sql, binds);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      provenance_type: 'WHAT - Shows source bookings and data that made routes popular'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular route derivation',
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
  getTrainReports,
  getRevenueSourceLineage,
  getTrainUtilizationSource,
  getPopularRouteDerivation
};
