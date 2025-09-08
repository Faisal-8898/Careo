const db = require("../database/connection");
const crypto = require("crypto");

// Generate booking reference
const generateBookingReference = () => {
  return (
    "TKT" +
    Date.now().toString().slice(-6) +
    crypto.randomBytes(3).toString("hex").toUpperCase()
  );
};

// Get reservations (user's own or all for admin)
const getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const { userId, userType } = req.user;

    let sql = `
      SELECT r.reservation_id, r.passenger_id, r.schedule_id, r.seat_number, r.booking_reference,
             r.passenger_name, r.passenger_age, r.passenger_gender, r.booking_status, 
             r.fare_amount, r.booking_date,
             s.departure_time, s.arrival_time, s.status as schedule_status,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.station_code as departure_code,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code,
             p.username, p.full_name as passenger_full_name
      FROM Reservations r
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      JOIN Passengers p ON r.passenger_id = p.passenger_id
      WHERE 1=1
    `;

    let binds = [];

    // If passenger, only show their reservations
    if (userType === "passenger") {
      sql += ` AND r.passenger_id = :passenger_id`;
      binds.push(userId);
    }

    if (status) {
      sql += ` AND r.booking_status = :status`;
      binds.push(status);
    }

    sql += ` ORDER BY r.booking_date DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.push(offset, parseInt(limit));

    const result = await db.executeQuery(sql, binds);

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
      error: "Failed to fetch reservations",
      details: error.message,
    });
  }
};

// Get reservation by ID
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;

    let sql = `
      SELECT r.reservation_id, r.passenger_id, r.schedule_id, r.seat_number, r.booking_reference,
             r.passenger_name, r.passenger_age, r.passenger_gender, r.booking_status, 
             r.fare_amount, r.booking_date,
             s.departure_time, s.arrival_time, s.base_fare, s.status as schedule_status,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.station_code as departure_code, ds.city as departure_city,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code, as_tbl.city as arrival_city,
             p.username, p.full_name as passenger_full_name, p.email
      FROM Reservations r
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      JOIN Passengers p ON r.passenger_id = p.passenger_id
      WHERE r.reservation_id = :reservation_id
    `;

    let binds = [id];

    // If passenger, only allow access to their own reservations
    if (userType === "passenger") {
      sql += ` AND r.passenger_id = :passenger_id`;
      binds.push(userId);
    }

    const result = await db.executeQuery(sql, binds);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found or access denied",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch reservation",
      details: error.message,
    });
  }
};

// Create new reservation
const createReservation = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      schedule_id,
      passenger_name,
      passenger_age,
      passenger_gender,
      seat_number,
    } = req.body;

    if (
      !schedule_id ||
      !passenger_name ||
      !passenger_age ||
      !passenger_gender
    ) {
      return res.status(400).json({
        success: false,
        error: "Schedule ID, passenger name, age, and gender are required",
      });
    }

    // Check if schedule exists and has available seats
    const scheduleSql = `
      SELECT s.schedule_id, s.available_seats, s.base_fare, s.status,
             t.train_name, ds.station_name as departure_station, 
             as_tbl.station_name as arrival_station
      FROM Schedules s
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE s.schedule_id = :schedule_id
    `;

    const scheduleResult = await db.executeQuery(scheduleSql, [schedule_id]);

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    const schedule = scheduleResult.rows[0];

    if (schedule.STATUS !== "SCHEDULED" && schedule.STATUS !== "DELAYED") {
      return res.status(400).json({
        success: false,
        error: "Schedule is not available for booking",
      });
    }

    if (schedule.AVAILABLE_SEATS <= 0) {
      return res.status(400).json({
        success: false,
        error: "No seats available on this schedule",
      });
    }

    // Generate unique booking reference
    let booking_reference;
    let isUnique = false;

    while (!isUnique) {
      booking_reference = generateBookingReference();
      const checkSql = `SELECT COUNT(*) as count FROM Reservations WHERE booking_reference = :booking_reference`;
      const checkResult = await db.executeQuery(checkSql, [booking_reference]);
      isUnique = checkResult.rows[0].COUNT === 0;
    }

    // Auto-assign seat if not provided
    let assignedSeat = seat_number;
    if (!assignedSeat) {
      const seatSql = `
        SELECT 'S' || (ROWNUM) as seat_num
        FROM (SELECT LEVEL FROM DUAL CONNECT BY LEVEL <= 100)
        WHERE 'S' || (ROWNUM) NOT IN (
          SELECT seat_number FROM Reservations 
          WHERE schedule_id = :schedule_id AND booking_status = 'CONFIRMED'
        )
        AND ROWNUM = 1
      `;
      const seatResult = await db.executeQuery(seatSql, [schedule_id]);
      assignedSeat =
        seatResult.rows.length > 0
          ? seatResult.rows[0].SEAT_NUM
          : "S" + Math.floor(Math.random() * 100 + 1);
    }

    const sql = `
      INSERT INTO Reservations (
        reservation_id, passenger_id, schedule_id, seat_number, booking_reference,
        passenger_name, passenger_age, passenger_gender, fare_amount
      ) VALUES (
        reservation_seq.NEXTVAL, :passenger_id, :schedule_id, :seat_number, :booking_reference,
        :passenger_name, :passenger_age, :passenger_gender, :fare_amount
      ) RETURNING reservation_id INTO :reservation_id
    `;

    const binds = {
      passenger_id: userId,
      schedule_id,
      seat_number: assignedSeat,
      booking_reference,
      passenger_name,
      passenger_age,
      passenger_gender,
      fare_amount: schedule.BASE_FARE,
      reservation_id: { dir: db.BIND_OUT, type: db.NUMBER },
    };

    const result = await db.executeQuery(sql, binds);

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: {
        reservation_id: result.outBinds.reservation_id[0],
        booking_reference,
        passenger_name,
        seat_number: assignedSeat,
        fare_amount: schedule.BASE_FARE,
        train_name: schedule.TRAIN_NAME,
        departure_station: schedule.DEPARTURE_STATION,
        arrival_station: schedule.ARRIVAL_STATION,
        booking_status: "CONFIRMED",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create reservation",
      details: error.message,
    });
  }
};

// Update reservation
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const updateFields = req.body;

    // Check if reservation exists and user has access
    let checkSql = `
      SELECT passenger_id, booking_status FROM Reservations WHERE reservation_id = :reservation_id
    `;
    let checkBinds = [id];

    if (userType === "passenger") {
      checkSql += ` AND passenger_id = :passenger_id`;
      checkBinds.push(userId);
    }

    const checkResult = await db.executeQuery(checkSql, checkBinds);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found or access denied",
      });
    }

    const reservation = checkResult.rows[0];

    // Passengers can only update certain fields and only if booking is confirmed
    let allowedFields;
    if (userType === "passenger") {
      if (reservation.BOOKING_STATUS !== "CONFIRMED") {
        return res.status(400).json({
          success: false,
          error: "Cannot modify cancelled or completed reservations",
        });
      }
      allowedFields = ["passenger_name", "passenger_age", "passenger_gender"];
    } else {
      allowedFields = [
        "passenger_name",
        "passenger_age",
        "passenger_gender",
        "seat_number",
        "booking_status",
      ];
    }

    const fieldsToUpdate = Object.keys(updateFields).filter((field) =>
      allowedFields.includes(field)
    );

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    const setClause = fieldsToUpdate
      .map((field) => `${field} = :${field}`)
      .join(", ");
    const sql = `
      UPDATE Reservations 
      SET ${setClause}
      WHERE reservation_id = :reservation_id
    `;

    const binds = { ...updateFields, reservation_id: id };
    const result = await db.executeQuery(sql, binds);

    res.json({
      success: true,
      message: "Reservation updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update reservation",
      details: error.message,
    });
  }
};

// Cancel reservation
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;

    // Check if reservation exists and user has access
    let checkSql = `
      SELECT passenger_id, booking_status, schedule_id FROM Reservations WHERE reservation_id = :reservation_id
    `;
    let checkBinds = [id];

    if (userType === "passenger") {
      checkSql += ` AND passenger_id = :passenger_id`;
      checkBinds.push(userId);
    }

    const checkResult = await db.executeQuery(checkSql, checkBinds);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found or access denied",
      });
    }

    const reservation = checkResult.rows[0];

    if (reservation.BOOKING_STATUS === "CANCELLED") {
      return res.status(400).json({
        success: false,
        error: "Reservation is already cancelled",
      });
    }

    // Update reservation status to cancelled
    const sql = `
      UPDATE Reservations 
      SET booking_status = 'CANCELLED'
      WHERE reservation_id = :reservation_id
    `;

    await db.executeQuery(sql, [id]);

    res.json({
      success: true,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to cancel reservation",
      details: error.message,
    });
  }
};

// Get reservation by booking reference
const getReservationByBookingRef = async (req, res) => {
  try {
    const { bookingRef } = req.params;

    const sql = `
      SELECT r.reservation_id, r.passenger_id, r.schedule_id, r.seat_number, r.booking_reference,
             r.passenger_name, r.passenger_age, r.passenger_gender, r.booking_status, 
             r.fare_amount, r.booking_date,
             s.departure_time, s.arrival_time, s.status as schedule_status,
             t.train_name, t.train_type,
             ds.station_name as departure_station, ds.station_code as departure_code,
             as_tbl.station_name as arrival_station, as_tbl.station_code as arrival_code
      FROM Reservations r
      JOIN Schedules s ON r.schedule_id = s.schedule_id
      JOIN Trains t ON s.train_id = t.train_id
      JOIN Stations ds ON s.departure_station_id = ds.station_id
      JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
      WHERE r.booking_reference = :booking_reference
    `;

    const result = await db.executeQuery(sql, [bookingRef]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch booking",
      details: error.message,
    });
  }
};

// Get reservations by schedule (admin only)
const getReservationsBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const sql = `
      SELECT r.reservation_id, r.passenger_id, r.seat_number, r.booking_reference,
             r.passenger_name, r.passenger_age, r.passenger_gender, r.booking_status, 
             r.fare_amount, r.booking_date,
             p.username, p.full_name, p.email, p.phone
      FROM Reservations r
      JOIN Passengers p ON r.passenger_id = p.passenger_id
      WHERE r.schedule_id = :schedule_id
      ORDER BY r.seat_number, r.booking_date
    `;

    const result = await db.executeQuery(sql, [scheduleId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch reservations for schedule",
      details: error.message,
    });
  }
};

// Update reservation status (admin only)
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const validStatuses = ["CONFIRMED", "CANCELLED", "WAITLISTED", "COMPLETED"];

    if (!validStatuses.includes(booking_status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid booking status",
        validStatuses,
      });
    }

    const sql = `
      UPDATE Reservations 
      SET booking_status = :booking_status
      WHERE reservation_id = :reservation_id
    `;

    const result = await db.executeQuery(sql, [booking_status, id]);

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found",
      });
    }

    res.json({
      success: true,
      message: "Reservation status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update reservation status",
      details: error.message,
    });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  getReservationByBookingRef,
  getReservationsBySchedule,
  updateReservationStatus,
};
