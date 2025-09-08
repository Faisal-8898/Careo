const db = require('../database/connection');
const crypto = require('crypto');

// Generate transaction ID
const generateTransactionId = () => {
  return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Get payments (user's own or all for admin)
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const { userId, userType } = req.user;
    
    let sql = `
      SELECT py.payment_id, py.reservation_id, py.amount, py.payment_method,
             py.payment_status, py.transaction_id, py.payment_date,
             py.refund_amount, py.refund_date,
             r.booking_reference, r.passenger_name, r.seat_number,
             t.train_name, 
             ds.station_name as departure_station,
             as_tbl.station_name as arrival_station,
             s.departure_time
      FROM Payments py
      JOIN Reservations r ON py.reservation_id = r.reservation_id
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE 1=1
    `;
    
    let binds = [];
    
    // If passenger, only show their payments
    if (userType === 'passenger') {
      sql += ` AND r.passenger_id = :passenger_id`;
      binds.push(userId);
    }
    
    if (status) {
      sql += ` AND py.payment_status = :status`;
      binds.push(status);
    }
    
    sql += ` ORDER BY py.payment_date DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
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
      error: 'Failed to fetch payments',
      details: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    
    let sql = `
      SELECT py.payment_id, py.reservation_id, py.amount, py.payment_method,
             py.payment_status, py.transaction_id, py.payment_date,
             py.refund_amount, py.refund_date,
             r.booking_reference, r.passenger_name, r.passenger_age, r.passenger_gender,
             r.seat_number, r.booking_status, r.fare_amount,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.city as departure_city,
             as_tbl.station_name as arrival_station, as_tbl.city as arrival_city,
             s.departure_time, s.arrival_time,
             p.username, p.full_name, p.email
      FROM Payments py
      JOIN Reservations r ON py.reservation_id = r.reservation_id
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      JOIN Passengers p ON r.passenger_id = p.passenger_id
      WHERE py.payment_id = :payment_id
    `;
    
    let binds = [id];
    
    // If passenger, only allow access to their own payments
    if (userType === 'passenger') {
      sql += ` AND r.passenger_id = :passenger_id`;
      binds.push(userId);
    }
    
    const result = await db.executeQuery(sql, binds);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or access denied'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      details: error.message
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      reservation_id,
      payment_method,
      amount
    } = req.body;
    
    if (!reservation_id || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Reservation ID and payment method are required'
      });
    }
    
    // Verify reservation belongs to user and get details
    const reservationSql = `
      SELECT r.reservation_id, r.passenger_id, r.fare_amount, r.booking_status,
             r.booking_reference, r.passenger_name
      FROM Reservations r
      WHERE r.reservation_id = :reservation_id AND r.passenger_id = :passenger_id
    `;
    
    const reservationResult = await db.executeQuery(reservationSql, [reservation_id, userId]);
    
    if (reservationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found or access denied'
      });
    }
    
    const reservation = reservationResult.rows[0];
    
    if (reservation.BOOKING_STATUS !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pay for cancelled or completed reservations'
      });
    }
    
    // Check if payment already exists for this reservation
    const existingPaymentSql = `
      SELECT COUNT(*) as count FROM Payments 
      WHERE reservation_id = :reservation_id AND payment_status IN ('PENDING', 'COMPLETED')
    `;
    const existingPaymentResult = await db.executeQuery(existingPaymentSql, [reservation_id]);
    
    if (existingPaymentResult.rows[0].COUNT > 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this reservation'
      });
    }
    
    const paymentAmount = amount || reservation.FARE_AMOUNT;
    
    // Generate unique transaction ID
    let transaction_id;
    let isUnique = false;
    
    while (!isUnique) {
      transaction_id = generateTransactionId();
      const checkSql = `SELECT COUNT(*) as count FROM Payments WHERE transaction_id = :transaction_id`;
      const checkResult = await db.executeQuery(checkSql, [transaction_id]);
      isUnique = checkResult.rows[0].COUNT === 0;
    }
    
    const sql = `
      INSERT INTO Payments (
        payment_id, reservation_id, amount, payment_method, transaction_id, payment_status
      ) VALUES (
        payment_seq.NEXTVAL, :reservation_id, :amount, :payment_method, :transaction_id, 'PENDING'
      ) RETURNING payment_id INTO :payment_id
    `;
    
    const binds = {
      reservation_id,
      amount: paymentAmount,
      payment_method,
      transaction_id,
      payment_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };
    
    const result = await db.executeQuery(sql, binds);
    
    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        payment_id: result.outBinds.payment_id[0],
        reservation_id,
        amount: paymentAmount,
        payment_method,
        transaction_id,
        payment_status: 'PENDING',
        booking_reference: reservation.BOOKING_REFERENCE
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      details: error.message
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const updateFields = req.body;
    
    // Check if payment exists and user has access
    let checkSql = `
      SELECT py.payment_id, py.payment_status, r.passenger_id
      FROM Payments py
      JOIN Reservations r ON py.reservation_id = r.reservation_id
      WHERE py.payment_id = :payment_id
    `;
    let checkBinds = [id];
    
    if (userType === 'passenger') {
      checkSql += ` AND r.passenger_id = :passenger_id`;
      checkBinds.push(userId);
    }
    
    const checkResult = await db.executeQuery(checkSql, checkBinds);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or access denied'
      });
    }
    
    // Define allowed fields based on user type
    let allowedFields;
    if (userType === 'passenger') {
      allowedFields = ['payment_method']; // Passengers can only update payment method if payment is pending
      if (checkResult.rows[0].PAYMENT_STATUS !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Cannot modify completed or failed payments'
        });
      }
    } else {
      allowedFields = ['payment_status', 'transaction_id', 'refund_amount', 'refund_date'];
    }
    
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
    let binds = { payment_id: id };
    
    fieldsToUpdate.forEach(field => {
      if (field === 'refund_date') {
        setClause.push(`${field} = TO_TIMESTAMP(:${field}, 'YYYY-MM-DD HH24:MI:SS')`);
      } else {
        setClause.push(`${field} = :${field}`);
      }
      binds[field] = updateFields[field];
    });
    
    const sql = `
      UPDATE Payments 
      SET ${setClause.join(', ')}
      WHERE payment_id = :payment_id
    `;
    
    await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update payment',
      details: error.message
    });
  }
};

// Update payment status (admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;
    
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    
    if (!validStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status',
        validStatuses
      });
    }
    
    const sql = `
      UPDATE Payments 
      SET payment_status = :payment_status
      WHERE payment_id = :payment_id
    `;
    
    const result = await db.executeQuery(sql, [payment_status, id]);
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status',
      details: error.message
    });
  }
};

// Process refund (admin only)
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount } = req.body;
    
    if (!refund_amount || refund_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid refund amount is required'
      });
    }
    
    // Get current payment details
    const getPaymentSql = `
      SELECT amount, payment_status, refund_amount as current_refund
      FROM Payments 
      WHERE payment_id = :payment_id
    `;
    
    const paymentResult = await db.executeQuery(getPaymentSql, [id]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    const payment = paymentResult.rows[0];
    
    if (payment.PAYMENT_STATUS !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Can only refund completed payments'
      });
    }
    
    const currentRefund = payment.CURRENT_REFUND || 0;
    const totalRefundAfter = currentRefund + refund_amount;
    
    if (totalRefundAfter > payment.AMOUNT) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount exceeds payment amount'
      });
    }
    
    // Process refund
    const refundSql = `
      UPDATE Payments 
      SET refund_amount = :total_refund_amount,
          refund_date = CURRENT_TIMESTAMP,
          payment_status = CASE 
            WHEN :total_refund_amount >= amount THEN 'REFUNDED'
            ELSE payment_status
          END
      WHERE payment_id = :payment_id
    `;
    
    await db.executeQuery(refundSql, [totalRefundAfter, totalRefundAfter, id]);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment_id: id,
        refund_amount,
        total_refund_amount: totalRefundAfter,
        original_amount: payment.AMOUNT
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      details: error.message
    });
  }
};

// Get payments by reservation
const getPaymentsByReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId, userType } = req.user;
    
    let sql = `
      SELECT py.payment_id, py.amount, py.payment_method, py.payment_status,
             py.transaction_id, py.payment_date, py.refund_amount, py.refund_date,
             r.booking_reference, r.passenger_name
      FROM Payments py
      JOIN Reservations r ON py.reservation_id = r.reservation_id
      WHERE py.reservation_id = :reservation_id
    `;
    
    let binds = [reservationId];
    
    // If passenger, only show their payments
    if (userType === 'passenger') {
      sql += ` AND r.passenger_id = :passenger_id`;
      binds.push(userId);
    }
    
    sql += ` ORDER BY py.payment_date DESC`;
    
    const result = await db.executeQuery(sql, binds);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments for reservation',
      details: error.message
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  processRefund,
  getPaymentsByReservation
};
