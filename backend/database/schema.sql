-- ====================================================================
-- TRAIN TICKET MANAGEMENT SYSTEM - SIMPLIFIED DATABASE SCHEMA
-- CSE464 Advanced Database Systems - Provenance-Enabled RDBMS
-- Oracle Database running in Docker (localhost:1521/XEPDB1)
-- ====================================================================

-- Drop existing tables (in correct order to handle foreign keys)
BEGIN
  FOR c IN (SELECT table_name FROM user_tables WHERE table_name IN ('AUDIT_PAYMENTS', 'AUDIT_PASSENGERS', 'AUDIT_TRAINS', 'AUDIT_SCHEDULES', 'PAYMENTS', 'RESERVATIONS', 'SCHEDULES', 'TRAINS', 'ROUTE_STATIONS', 'ROUTES', 'STATIONS', 'ADMINS', 'PASSENGERS')) LOOP
    EXECUTE IMMEDIATE ('DROP TABLE ' || c.table_name || ' CASCADE CONSTRAINTS');
  END LOOP;
END;
/

-- Drop sequences if they exist
BEGIN
  FOR c IN (SELECT sequence_name FROM user_sequences WHERE sequence_name IN ('STATION_SEQ', 'ROUTE_SEQ', 'TRAIN_SEQ', 'SCHEDULE_SEQ', 'PASSENGER_SEQ', 'ADMIN_SEQ', 'RESERVATION_SEQ', 'PAYMENT_SEQ', 'AUDIT_SEQ')) LOOP
    EXECUTE IMMEDIATE ('DROP SEQUENCE ' || c.sequence_name);
  END LOOP;
END;
/

-- ====================================================================
-- CREATE SEQUENCES FOR PRIMARY KEYS
-- ====================================================================

CREATE SEQUENCE station_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE route_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE train_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE schedule_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE passenger_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE admin_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE reservation_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE payment_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE audit_seq START WITH 1 INCREMENT BY 1;

-- ====================================================================
-- CORE TABLES
-- ====================================================================

-- Stations table
CREATE TABLE Stations (
    station_id NUMBER PRIMARY KEY,
    station_name VARCHAR2(100) NOT NULL,
    station_code VARCHAR2(10) UNIQUE NOT NULL,
    city VARCHAR2(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE Routes (
    route_id NUMBER PRIMARY KEY,
    route_name VARCHAR2(100) NOT NULL,
    route_code VARCHAR2(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route-Station mapping
CREATE TABLE Route_Stations (
    route_id NUMBER NOT NULL,
    station_id NUMBER NOT NULL,
    stop_sequence NUMBER NOT NULL,
    distance_km NUMBER DEFAULT 0,
    PRIMARY KEY (route_id, station_id),
    FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES Stations(station_id) ON DELETE CASCADE
);

-- Trains table
CREATE TABLE Trains (
    train_id NUMBER PRIMARY KEY,
    train_name VARCHAR2(100) NOT NULL,
    train_type VARCHAR2(50) NOT NULL,
    route_id NUMBER NOT NULL,
    total_capacity NUMBER DEFAULT 100,
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES Routes(route_id)
);

-- Schedules table
CREATE TABLE Schedules (
    schedule_id NUMBER PRIMARY KEY,
    train_id NUMBER NOT NULL,
    departure_station_id NUMBER NOT NULL,
    arrival_station_id NUMBER NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    base_fare NUMBER(10,2) NOT NULL,
    available_seats NUMBER NOT NULL,
    status VARCHAR2(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES Trains(train_id),
    FOREIGN KEY (departure_station_id) REFERENCES Stations(station_id),
    FOREIGN KEY (arrival_station_id) REFERENCES Stations(station_id)
);

-- Passengers table (user authentication)
CREATE TABLE Passengers (
    passenger_id NUMBER PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    full_name VARCHAR2(100) NOT NULL,
    phone VARCHAR2(20),
    date_of_birth DATE,
    gender VARCHAR2(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table (railway employees)
CREATE TABLE Admins (
    admin_id NUMBER PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    full_name VARCHAR2(100) NOT NULL,
    employee_id VARCHAR2(20) UNIQUE,
    role VARCHAR2(30) DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'SUPER_ADMIN', 'OPERATOR')),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_by NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Admins(admin_id)
);

-- Reservations table (ticket bookings)
CREATE TABLE Reservations (
    reservation_id NUMBER PRIMARY KEY,
    passenger_id NUMBER NOT NULL,
    schedule_id NUMBER NOT NULL,
    seat_number VARCHAR2(10),
    booking_reference VARCHAR2(50) UNIQUE NOT NULL,
    passenger_name VARCHAR2(100) NOT NULL,
    passenger_age NUMBER NOT NULL,
    passenger_gender VARCHAR2(10) CHECK (passenger_gender IN ('MALE', 'FEMALE', 'OTHER')),
    booking_status VARCHAR2(20) DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED', 'CANCELLED', 'WAITLISTED', 'COMPLETED')),
    fare_amount NUMBER(10,2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id),
    FOREIGN KEY (schedule_id) REFERENCES Schedules(schedule_id)
);

-- Payments table
CREATE TABLE Payments (
    payment_id NUMBER PRIMARY KEY,
    reservation_id NUMBER NOT NULL,
    amount NUMBER(10,2) NOT NULL,
    payment_method VARCHAR2(20) CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'NET_BANKING', 'WALLET')),
    payment_status VARCHAR2(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    transaction_id VARCHAR2(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount NUMBER(10,2) DEFAULT 0,
    refund_date TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id)
);

-- ====================================================================
-- AUDIT TABLES FOR PROVENANCE TRACKING
-- ====================================================================

CREATE TABLE Audit_Trains (
    audit_id NUMBER PRIMARY KEY,
    train_id NUMBER NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_train_name VARCHAR2(100),
    old_train_type VARCHAR2(50),
    old_route_id NUMBER,
    old_total_capacity NUMBER,
    old_status VARCHAR2(20),
    new_train_name VARCHAR2(100),
    new_train_type VARCHAR2(50),
    new_route_id NUMBER,
    new_total_capacity NUMBER,
    new_status VARCHAR2(20),
    audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR2(50) DEFAULT USER,
    change_reason VARCHAR2(500)
);

CREATE TABLE Audit_Schedules (
    audit_id NUMBER PRIMARY KEY,
    schedule_id NUMBER NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_train_id NUMBER,
    old_departure_station_id NUMBER,
    old_arrival_station_id NUMBER,
    old_departure_time TIMESTAMP,
    old_arrival_time TIMESTAMP,
    old_base_fare NUMBER(10,2),
    old_available_seats NUMBER,
    old_status VARCHAR2(20),
    new_train_id NUMBER,
    new_departure_station_id NUMBER,
    new_arrival_station_id NUMBER,
    new_departure_time TIMESTAMP,
    new_arrival_time TIMESTAMP,
    new_base_fare NUMBER(10,2),
    new_available_seats NUMBER,
    new_status VARCHAR2(20),
    audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR2(50) DEFAULT USER,
    change_reason VARCHAR2(500)
);

CREATE TABLE Audit_Passengers (
    audit_id NUMBER PRIMARY KEY,
    reservation_id NUMBER NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_passenger_id NUMBER,
    old_schedule_id NUMBER,
    old_seat_number VARCHAR2(10),
    old_booking_reference VARCHAR2(50),
    old_passenger_name VARCHAR2(100),
    old_passenger_age NUMBER,
    old_passenger_gender VARCHAR2(10),
    old_booking_status VARCHAR2(20),
    old_fare_amount NUMBER(10,2),
    new_passenger_id NUMBER,
    new_schedule_id NUMBER,
    new_seat_number VARCHAR2(10),
    new_booking_reference VARCHAR2(50),
    new_passenger_name VARCHAR2(100),
    new_passenger_age NUMBER,
    new_passenger_gender VARCHAR2(10),
    new_booking_status VARCHAR2(20),
    new_fare_amount NUMBER(10,2),
    audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR2(50) DEFAULT USER,
    change_reason VARCHAR2(500)
);

CREATE TABLE Audit_Payments (
    audit_id NUMBER PRIMARY KEY,
    payment_id NUMBER NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_reservation_id NUMBER,
    old_amount NUMBER(10,2),
    old_payment_method VARCHAR2(20),
    old_payment_status VARCHAR2(20),
    old_transaction_id VARCHAR2(100),
    old_refund_amount NUMBER(10,2),
    old_refund_date TIMESTAMP,
    new_reservation_id NUMBER,
    new_amount NUMBER(10,2),
    new_payment_method VARCHAR2(20),
    new_payment_status VARCHAR2(20),
    new_transaction_id VARCHAR2(100),
    new_refund_amount NUMBER(10,2),
    new_refund_date TIMESTAMP,
    audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR2(50) DEFAULT USER,
    change_reason VARCHAR2(500)
);

-- ====================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ====================================================================

-- Indexes on core tables
CREATE INDEX idx_trains_route ON Trains(route_id);
CREATE INDEX idx_schedules_train ON Schedules(train_id);
CREATE INDEX idx_schedules_departure ON Schedules(departure_station_id, departure_time);
CREATE INDEX idx_reservations_passenger ON Reservations(passenger_id);
CREATE INDEX idx_reservations_schedule ON Reservations(schedule_id);
CREATE INDEX idx_reservations_reference ON Reservations(booking_reference);
CREATE INDEX idx_payments_reservation ON Payments(reservation_id);
CREATE INDEX idx_route_stations_route ON Route_Stations(route_id);

-- Indexes on audit tables
CREATE INDEX idx_audit_trains_id ON Audit_Trains(train_id);
CREATE INDEX idx_audit_trains_timestamp ON Audit_Trains(audit_timestamp);
CREATE INDEX idx_audit_schedules_id ON Audit_Schedules(schedule_id);
CREATE INDEX idx_audit_schedules_timestamp ON Audit_Schedules(audit_timestamp);
CREATE INDEX idx_audit_passengers_id ON Audit_Passengers(reservation_id);
CREATE INDEX idx_audit_passengers_timestamp ON Audit_Passengers(audit_timestamp);
CREATE INDEX idx_audit_payments_id ON Audit_Payments(payment_id);
CREATE INDEX idx_audit_payments_timestamp ON Audit_Payments(audit_timestamp);

COMMIT;
