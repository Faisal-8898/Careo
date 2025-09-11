-- -- Admin Dashboard Procedures
-- -- These procedures replace direct queries in adminController.js for better performance and maintainability

-- -- 1. Get Dashboard Statistics
-- CREATE OR REPLACE PROCEDURE GetDashboardStats(
--     p_total_passengers OUT NUMBER,
--     p_total_trains OUT NUMBER,
--     p_total_reservations OUT NUMBER,
--     p_total_revenue OUT NUMBER,
--     p_today_bookings OUT NUMBER,
--     p_today_revenue OUT NUMBER,
--     p_pending_payments OUT NUMBER,
--     p_cancelled_bookings OUT NUMBER
-- )
-- AS
-- BEGIN
--     -- Total passengers
--     SELECT COUNT(*) INTO p_total_passengers 
--     FROM Passengers WHERE status = 'ACTIVE';
    
--     -- Total trains
--     SELECT COUNT(*) INTO p_total_trains 
--     FROM Trains WHERE status = 'ACTIVE';
    
--     -- Total reservations
--     SELECT COUNT(*) INTO p_total_reservations 
--     FROM Reservations WHERE booking_status = 'CONFIRMED';
    
--     -- Total revenue
--     SELECT COALESCE(SUM(amount), 0) INTO p_total_revenue 
--     FROM Payments WHERE payment_status = 'COMPLETED';
    
--     -- Today's bookings
--     SELECT COUNT(*) INTO p_today_bookings 
--     FROM Reservations WHERE TRUNC(booking_date) = TRUNC(CURRENT_DATE);
    
--     -- Today's revenue
--     SELECT COALESCE(SUM(amount), 0) INTO p_today_revenue 
--     FROM Payments WHERE TRUNC(payment_date) = TRUNC(CURRENT_DATE) AND payment_status = 'COMPLETED';
    
--     -- Pending payments
--     SELECT COUNT(*) INTO p_pending_payments 
--     FROM Payments WHERE payment_status = 'PENDING';
    
--     -- Cancelled bookings
--     SELECT COUNT(*) INTO p_cancelled_bookings 
--     FROM Reservations WHERE booking_status = 'CANCELLED';
-- END;
-- /

-- -- 2. Get Recent Bookings
-- CREATE OR REPLACE PROCEDURE GetRecentBookings(
--     p_recent_bookings OUT SYS_REFCURSOR
-- )
-- AS
-- BEGIN
--     OPEN p_recent_bookings FOR
--         SELECT r.reservation_id, r.booking_reference, r.passenger_name, r.booking_date,
--                t.train_name, ds.station_name as departure_station, as_tbl.station_name as arrival_station
--         FROM Reservations r
--         JOIN Schedules s ON r.schedule_id = s.schedule_id
--         JOIN Trains t ON s.train_id = t.train_id
--         JOIN Stations ds ON s.departure_station_id = ds.station_id
--         JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
--         WHERE r.booking_status = 'CONFIRMED'
--         ORDER BY r.booking_date DESC
--         FETCH FIRST 5 ROWS ONLY;
-- END;
-- /

-- -- 3. Get Popular Routes
-- CREATE OR REPLACE PROCEDURE GetPopularRoutes(
--     p_popular_routes OUT SYS_REFCURSOR
-- )
-- AS
-- BEGIN
--     OPEN p_popular_routes FOR
--         SELECT ds.station_name as departure_station, as_tbl.station_name as arrival_station,
--                COUNT(*) as booking_count
--         FROM Reservations r
--         JOIN Schedules s ON r.schedule_id = s.schedule_id
--         JOIN Stations ds ON s.departure_station_id = ds.station_id
--         JOIN Stations as_tbl ON s.arrival_station_id = as_tbl.station_id
--         WHERE r.booking_status = 'CONFIRMED'
--         GROUP BY ds.station_name, as_tbl.station_name
--         ORDER BY booking_count DESC
--         FETCH FIRST 5 ROWS ONLY;
-- END;
-- /

-- -- 4. Get All Passengers
-- CREATE OR REPLACE PROCEDURE GetAllPassengers(
--     p_status IN VARCHAR2 DEFAULT NULL,
--     p_passengers OUT SYS_REFCURSOR
-- )
-- AS
--     v_sql VARCHAR2(4000);
-- BEGIN
--     v_sql := 'SELECT passenger_id as id, username, email, full_name, phone, status, created_at, ''passenger'' as user_type
--               FROM Passengers
--               WHERE 1=1';
    
--     IF p_status IS NOT NULL THEN
--         v_sql := v_sql || ' AND status = :status';
--     END IF;
    
--     v_sql := v_sql || ' ORDER BY created_at DESC';
    
--     IF p_status IS NOT NULL THEN
--         OPEN p_passengers FOR v_sql USING p_status;
--     ELSE
--         OPEN p_passengers FOR v_sql;
--     END IF;
-- END;
-- /

-- -- 5. Get All Admins
-- CREATE OR REPLACE PROCEDURE GetAllAdmins(
--     p_status IN VARCHAR2 DEFAULT NULL,
--     p_admins OUT SYS_REFCURSOR
-- )
-- AS
--     v_sql VARCHAR2(4000);
-- BEGIN
--     v_sql := 'SELECT admin_id as id, username, email, full_name, employee_id, role, status, created_at, ''admin'' as user_type
--               FROM Admins
--               WHERE 1=1';
    
--     IF p_status IS NOT NULL THEN
--         v_sql := v_sql || ' AND status = :status';
--     END IF;
    
--     v_sql := v_sql || ' ORDER BY created_at DESC';
    
--     IF p_status IS NOT NULL THEN
--         OPEN p_admins FOR v_sql USING p_status;
--     ELSE
--         OPEN p_admins FOR v_sql;
--     END IF;
-- END;
-- /

-- -- 6. Get Passenger Statistics
-- CREATE OR REPLACE PROCEDURE GetPassengerStats(
--     p_passenger_id IN NUMBER,
--     p_total_bookings OUT NUMBER,
--     p_confirmed_bookings OUT NUMBER,
--     p_cancelled_bookings OUT NUMBER,
--     p_total_spent OUT NUMBER
-- )
-- AS
-- BEGIN
--     SELECT 
--         COUNT(r.reservation_id),
--         COUNT(CASE WHEN r.booking_status = 'CONFIRMED' THEN 1 END),
--         COUNT(CASE WHEN r.booking_status = 'CANCELLED' THEN 1 END),
--         COALESCE(SUM(CASE WHEN p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END), 0)
--     INTO p_total_bookings, p_confirmed_bookings, p_cancelled_bookings, p_total_spent
--     FROM Reservations r
--     LEFT JOIN Payments p ON r.reservation_id = p.reservation_id
--     WHERE r.passenger_id = p_passenger_id;
-- END;
-- /
