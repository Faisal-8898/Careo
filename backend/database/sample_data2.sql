-- ====================================================================
-- TRAIN TICKET MANAGEMENT SYSTEM - SIMPLIFIED SAMPLE DATA
-- CSE464 Advanced Database Systems - Minimal Test Data
-- ====================================================================

-- Insert sample stations (3 stations)
INSERT INTO Stations (station_id, station_name, station_code, city) VALUES 
(station_seq.NEXTVAL, 'Dhaka Central Railway Station', 'DHAKA', 'Dhaka');

INSERT INTO Stations (station_id, station_name, station_code, city) VALUES 
(station_seq.NEXTVAL, 'Chittagong Railway Station', 'CTG', 'Chittagong');

INSERT INTO Stations (station_id, station_name, station_code, city) VALUES 
(station_seq.NEXTVAL, 'Sylhet Railway Station', 'SYL', 'Sylhet');

-- Insert sample routes (2 routes)
INSERT INTO Routes (route_id, route_name, route_code) VALUES 
(route_seq.NEXTVAL, 'Dhaka to Chittagong Route', 'DHK-CTG');

INSERT INTO Routes (route_id, route_name, route_code) VALUES 
(route_seq.NEXTVAL, 'Dhaka to Sylhet Route', 'DHK-SYL');

-- Insert route stations for Dhaka-Chittagong route
INSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km) VALUES 
(1, 1, 1, 0);    -- Dhaka (start)

INSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km) VALUES 
(1, 2, 2, 264);  -- Chittagong (end)

-- Insert route stations for Dhaka-Sylhet route
INSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km) VALUES 
(2, 1, 1, 0);    -- Dhaka (start)

INSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km) VALUES 
(2, 3, 2, 247);  -- Sylhet (end)

-- Insert sample trains (3 trains)
INSERT INTO Trains (train_id, train_name, train_type, route_id, total_capacity, status) VALUES 
(train_seq.NEXTVAL, 'Chittagong Express', 'Express', 1, 200, 'ACTIVE');

INSERT INTO Trains (train_id, train_name, train_type, route_id, total_capacity, status) VALUES 
(train_seq.NEXTVAL, 'Sylhet Express', 'Express', 2, 180, 'ACTIVE');

INSERT INTO Trains (train_id, train_name, train_type, route_id, total_capacity, status) VALUES 
(train_seq.NEXTVAL, 'Dhaka Mail', 'Mail', 1, 150, 'ACTIVE');

-- Insert sample schedules (3 schedules)
INSERT INTO Schedules (schedule_id, train_id, departure_station_id, arrival_station_id, 
                      departure_time, arrival_time, base_fare, available_seats, status) VALUES 
(schedule_seq.NEXTVAL, 1, 1, 2, 
 TO_TIMESTAMP('2024-12-15 08:00:00', 'YYYY-MM-DD HH24:MI:SS'),
 TO_TIMESTAMP('2024-12-15 14:30:00', 'YYYY-MM-DD HH24:MI:SS'),
 850.00, 200, 'SCHEDULED');

INSERT INTO Schedules (schedule_id, train_id, departure_station_id, arrival_station_id, 
                      departure_time, arrival_time, base_fare, available_seats, status) VALUES 
(schedule_seq.NEXTVAL, 2, 1, 3, 
 TO_TIMESTAMP('2024-12-15 10:00:00', 'YYYY-MM-DD HH24:MI:SS'),
 TO_TIMESTAMP('2024-12-15 16:00:00', 'YYYY-MM-DD HH24:MI:SS'),
 750.00, 180, 'SCHEDULED');

INSERT INTO Schedules (schedule_id, train_id, departure_station_id, arrival_station_id, 
                      departure_time, arrival_time, base_fare, available_seats, status) VALUES 
(schedule_seq.NEXTVAL, 3, 1, 2, 
 TO_TIMESTAMP('2024-12-15 15:00:00', 'YYYY-MM-DD HH24:MI:SS'),
 TO_TIMESTAMP('2024-12-15 21:30:00', 'YYYY-MM-DD HH24:MI:SS'),
 900.00, 150, 'SCHEDULED');

-- Insert sample passengers (3 passengers)
INSERT INTO Passengers (passenger_id, username, email, password_hash, full_name, phone, 
                       date_of_birth, gender, status) VALUES 
(passenger_seq.NEXTVAL, 'john_doe', 'john.doe@email.com', 
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbRHfQXBGXhWnKm', -- password: password123
 'John Doe', '+8801712345678', TO_DATE('1990-05-15', 'YYYY-MM-DD'), 'MALE', 'ACTIVE');

INSERT INTO Passengers (passenger_id, username, email, password_hash, full_name, phone, 
                       date_of_birth, gender, status) VALUES 
(passenger_seq.NEXTVAL, 'jane_smith', 'jane.smith@email.com', 
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbRHfQXBGXhWnKm', -- password: password123
 'Jane Smith', '+8801798765432', TO_DATE('1992-08-22', 'YYYY-MM-DD'), 'FEMALE', 'ACTIVE');

INSERT INTO Passengers (passenger_id, username, email, password_hash, full_name, phone, 
                       date_of_birth, gender, status) VALUES 
(passenger_seq.NEXTVAL, 'alex_wilson', 'alex.wilson@email.com', 
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbRHfQXBGXhWnKm', -- password: password123
 'Alex Wilson', '+8801556677889', TO_DATE('1988-12-03', 'YYYY-MM-DD'), 'OTHER', 'ACTIVE');

-- Insert sample admins (3 admins)
INSERT INTO Admins (admin_id, username, email, password_hash, full_name, employee_id, role, status) VALUES 
(admin_seq.NEXTVAL, 'admin', 'admin@railway.gov.bd', 
 '$2a$12$MnLhJWsU5SJqXx472Z/TVe5W45sTb6w4qmHiA.3zTmuRdRC1GPet2', -- password: admin123
 'System Administrator', 'EMP001', 'SUPER_ADMIN', 'ACTIVE');

INSERT INTO Admins (admin_id, username, email, password_hash, full_name, employee_id, role, status, created_by) VALUES 
(admin_seq.NEXTVAL, 'operator1', 'operator1@railway.gov.bd', 
 '$2a$12$MnLhJWsU5SJqXx472Z/TVe5W45sTb6w4qmHiA.3zTmuRdRC1GPet2', -- password: operator123
 'Railway Operator 1', 'EMP002', 'OPERATOR', 'ACTIVE', 1);

INSERT INTO Admins (admin_id, username, email, password_hash, full_name, employee_id, role, status, created_by) VALUES 
(admin_seq.NEXTVAL, 'station_master', 'stationmaster@railway.gov.bd', 
 '$2a$12$MnLhJWsU5SJqXx472Z/TVe5W45sTb6w4qmHiA.3zTmuRdRC1GPet2', -- password: station123
 'Station Master', 'EMP003', 'ADMIN', 'ACTIVE', 1);

-- Insert sample reservations (3 reservations)
INSERT INTO Reservations (reservation_id, passenger_id, schedule_id, seat_number, booking_reference,
                         passenger_name, passenger_age, passenger_gender, booking_status, fare_amount) VALUES 
(reservation_seq.NEXTVAL, 1, 1, 'A1', 'TKT001ABC123', 'John Doe', 34, 'MALE', 'CONFIRMED', 850.00);

INSERT INTO Reservations (reservation_id, passenger_id, schedule_id, seat_number, booking_reference,
                         passenger_name, passenger_age, passenger_gender, booking_status, fare_amount) VALUES 
(reservation_seq.NEXTVAL, 2, 2, 'B5', 'TKT002DEF456', 'Jane Smith', 32, 'FEMALE', 'CONFIRMED', 750.00);

INSERT INTO Reservations (reservation_id, passenger_id, schedule_id, seat_number, booking_reference,
                         passenger_name, passenger_age, passenger_gender, booking_status, fare_amount) VALUES 
(reservation_seq.NEXTVAL, 3, 3, 'C10', 'TKT003GHI789', 'Alex Wilson', 36, 'OTHER', 'CONFIRMED', 900.00);

-- Insert sample payments (3 payments)
INSERT INTO Payments (payment_id, reservation_id, amount, payment_method, payment_status, transaction_id) VALUES 
(payment_seq.NEXTVAL, 1, 850.00, 'CARD', 'COMPLETED', 'TXN001ABC123456');

INSERT INTO Payments (payment_id, reservation_id, amount, payment_method, payment_status, transaction_id) VALUES 
(payment_seq.NEXTVAL, 2, 750.00, 'UPI', 'COMPLETED', 'TXN002DEF789012');

INSERT INTO Payments (payment_id, reservation_id, amount, payment_method, payment_status, transaction_id) VALUES 
(payment_seq.NEXTVAL, 3, 900.00, 'NET_BANKING', 'COMPLETED', 'TXN003GHI345678');

COMMIT;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Check data insertion
SELECT 'Stations' as table_name, COUNT(*) as count FROM Stations
UNION ALL
SELECT 'Routes', COUNT(*) FROM Routes
UNION ALL
SELECT 'Route_Stations', COUNT(*) FROM Route_Stations
UNION ALL
SELECT 'Trains', COUNT(*) FROM Trains
UNION ALL
SELECT 'Schedules', COUNT(*) FROM Schedules
UNION ALL
SELECT 'Passengers', COUNT(*) FROM Passengers
UNION ALL
SELECT 'Admins', COUNT(*) FROM Admins
UNION ALL
SELECT 'Reservations', COUNT(*) FROM Reservations
UNION ALL
SELECT 'Payments', COUNT(*) FROM Payments;

-- ====================================================================
-- SAMPLE PROVENANCE DEMONSTRATION UPDATES
-- These updates will generate audit records for demonstration
-- ====================================================================

-- Update train status (will trigger audit)
UPDATE Trains SET status = 'MAINTENANCE' WHERE train_id = 3;

-- Update schedule status (will trigger audit)
UPDATE Schedules SET status = 'DELAYED' WHERE schedule_id = 1;

-- Update reservation status (will trigger audit)
UPDATE Reservations SET booking_status = 'CANCELLED' WHERE reservation_id = 3;

-- Process a refund (will trigger audit)
UPDATE Payments SET payment_status = 'REFUNDED', refund_amount = 900.00, refund_date = CURRENT_TIMESTAMP 
WHERE payment_id = 3;

COMMIT;
