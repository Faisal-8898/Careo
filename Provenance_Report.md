# Train Ticket Management System - Provenance Report

## 1. Introduction

### Overview of the Scenario

The Train Ticket Management System is a comprehensive railway booking platform designed for CSE464 Advanced Database Systems course. The system manages train operations, passenger reservations, payment processing, and administrative functions while maintaining complete data provenance for audit and compliance purposes.

### Purpose of Provenance

The provenance implementation serves multiple critical purposes:

- **Regulatory Compliance**: Railway systems require detailed audit trails for safety and financial compliance
- **Data Integrity**: Track all changes to ensure data accuracy and detect unauthorized modifications
- **Business Intelligence**: Understand data evolution patterns for operational optimization
- **Forensic Analysis**: Investigate issues by tracing data lineage and change history
- **Accountability**: Track user actions and system changes for responsibility assignment

The system implements comprehensive provenance tracking across four core entities: Trains, Schedules, Reservations (Passengers), and Payments, with automatic audit logging through database triggers and advanced querying capabilities.

---

## 2. Database Design (Core Tables and Attributes)

### Core Business Tables

#### Stations Table

```sql
CREATE TABLE Stations (
    station_id NUMBER PRIMARY KEY,
    station_name VARCHAR2(100) NOT NULL,
    station_code VARCHAR2(10) UNIQUE NOT NULL,
    city VARCHAR2(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Routes Table

```sql
CREATE TABLE Routes (
    route_id NUMBER PRIMARY KEY,
    route_name VARCHAR2(100) NOT NULL,
    route_code VARCHAR2(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Route_Stations Table (Junction Table)

```sql
CREATE TABLE Route_Stations (
    route_id NUMBER NOT NULL,
    station_id NUMBER NOT NULL,
    stop_sequence NUMBER NOT NULL,
    distance_km NUMBER DEFAULT 0,
    PRIMARY KEY (route_id, station_id),
    FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES Stations(station_id) ON DELETE CASCADE
);
```

#### Trains Table

```sql
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
```

#### Schedules Table

```sql
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
```

#### Passengers Table

```sql
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
```

#### Admins Table

```sql
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
```

#### Reservations Table

```sql
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
```

#### Payments Table

```sql
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
```

---

## 3. Audit Table Design

### Description of Audit Tables

The system implements four comprehensive audit tables that mirror the core business entities, capturing complete change history with before/after values, operation types, timestamps, and user context.

### Audit_Trains Table

```sql
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
```

### Audit_Schedules Table

```sql
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
```

### Audit_Passengers Table

```sql
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
```

### Audit_Payments Table

```sql
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
```

### Key Features of Audit Tables:

- **Complete Change Capture**: Both old and new values for all attributes
- **Operation Classification**: INSERT, UPDATE, DELETE operations clearly identified
- **Temporal Tracking**: Precise timestamps for all changes
- **User Attribution**: Automatic user identification for accountability
- **Contextual Information**: Change reasons and business context
- **Performance Optimization**: Indexed on entity IDs and timestamps

---

## 4. Trigger/Procedure Implementation

### Automatic Audit Triggers

#### Train Audit Triggers

```sql
-- INSERT Trigger for Trains
CREATE OR REPLACE TRIGGER trg_trains_insert
    AFTER INSERT ON Trains
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Trains (
        audit_id, train_id, operation_type,
        new_train_name, new_train_type, new_route_id, new_total_capacity, new_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.train_id, 'INSERT',
        :NEW.train_name, :NEW.train_type, :NEW.route_id, :NEW.total_capacity, :NEW.status,
        CURRENT_TIMESTAMP, USER, 'New train added to system'
    );
END;
/

-- UPDATE Trigger for Trains
CREATE OR REPLACE TRIGGER trg_trains_update
    AFTER UPDATE ON Trains
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Trains (
        audit_id, train_id, operation_type,
        old_train_name, old_train_type, old_route_id, old_total_capacity, old_status,
        new_train_name, new_train_type, new_route_id, new_total_capacity, new_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.train_id, 'UPDATE',
        :OLD.train_name, :OLD.train_type, :OLD.route_id, :OLD.total_capacity, :OLD.status,
        :NEW.train_name, :NEW.train_type, :NEW.route_id, :NEW.total_capacity, :NEW.status,
        CURRENT_TIMESTAMP, USER, 'Train information updated'
    );
END;
/
```

#### Schedule Audit Triggers with Intelligent Change Detection

```sql
-- UPDATE Trigger for Schedules with Smart Change Reasoning
CREATE OR REPLACE TRIGGER trg_schedules_update
    AFTER UPDATE ON Schedules
    FOR EACH ROW
DECLARE
    v_change_reason VARCHAR2(500);
BEGIN
    -- Determine the reason for change
    IF :OLD.status != :NEW.status THEN
        v_change_reason := 'Schedule status changed from ' || :OLD.status || ' to ' || :NEW.status;
    ELSIF :OLD.available_seats != :NEW.available_seats THEN
        v_change_reason := 'Available seats updated from ' || :OLD.available_seats || ' to ' || :NEW.available_seats;
    ELSE
        v_change_reason := 'Schedule information updated';
    END IF;

    INSERT INTO Audit_Schedules (
        audit_id, schedule_id, operation_type,
        old_train_id, old_departure_station_id, old_arrival_station_id,
        old_departure_time, old_arrival_time, old_base_fare, old_available_seats, old_status,
        new_train_id, new_departure_station_id, new_arrival_station_id,
        new_departure_time, new_arrival_time, new_base_fare, new_available_seats, new_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.schedule_id, 'UPDATE',
        :OLD.train_id, :OLD.departure_station_id, :OLD.arrival_station_id,
        :OLD.departure_time, :OLD.arrival_time, :OLD.base_fare, :OLD.available_seats, :OLD.status,
        :NEW.train_id, :NEW.departure_station_id, :NEW.arrival_station_id,
        :NEW.departure_time, :NEW.arrival_time, :NEW.base_fare, :NEW.available_seats, :NEW.status,
        CURRENT_TIMESTAMP, USER, v_change_reason
    );
END;
/
```

#### Cascading Business Logic Trigger

```sql
-- Seat Availability Update Trigger
CREATE OR REPLACE TRIGGER trg_update_seat_availability
    AFTER INSERT OR UPDATE OR DELETE ON Reservations
    FOR EACH ROW
DECLARE
    v_schedule_id NUMBER;
    v_seat_change NUMBER := 0;
BEGIN
    -- Determine which schedule is affected and the seat change
    IF INSERTING THEN
        v_schedule_id := :NEW.schedule_id;
        IF :NEW.booking_status = 'CONFIRMED' THEN
            v_seat_change := -1; -- Decrease available seats
        END IF;
    ELSIF UPDATING THEN
        v_schedule_id := :NEW.schedule_id;
        -- Check if booking status changed
        IF :OLD.booking_status = 'CONFIRMED' AND :NEW.booking_status != 'CONFIRMED' THEN
            v_seat_change := 1; -- Increase available seats (cancellation)
        ELSIF :OLD.booking_status != 'CONFIRMED' AND :NEW.booking_status = 'CONFIRMED' THEN
            v_seat_change := -1; -- Decrease available seats (confirmation)
        END IF;
    ELSIF DELETING THEN
        v_schedule_id := :OLD.schedule_id;
        IF :OLD.booking_status = 'CONFIRMED' THEN
            v_seat_change := 1; -- Increase available seats
        END IF;
    END IF;

    -- Update the schedule if there's a seat change
    IF v_seat_change != 0 THEN
        UPDATE Schedules
        SET available_seats = available_seats + v_seat_change
        WHERE schedule_id = v_schedule_id;
    END IF;
END;
/
```

### Stored Procedures for Business Logic

```sql
-- Dashboard Statistics Procedure
CREATE OR REPLACE PROCEDURE GetDashboardStats(
    p_total_passengers OUT NUMBER,
    p_total_trains OUT NUMBER,
    p_total_reservations OUT NUMBER,
    p_total_revenue OUT NUMBER,
    p_today_bookings OUT NUMBER,
    p_today_revenue OUT NUMBER,
    p_pending_payments OUT NUMBER,
    p_cancelled_bookings OUT NUMBER
)
AS
BEGIN
    -- Total passengers
    SELECT COUNT(*) INTO p_total_passengers
    FROM Passengers WHERE status = 'ACTIVE';

    -- Total trains
    SELECT COUNT(*) INTO p_total_trains
    FROM Trains WHERE status = 'ACTIVE';

    -- Total reservations
    SELECT COUNT(*) INTO p_total_reservations
    FROM Reservations WHERE booking_status = 'CONFIRMED';

    -- Total revenue
    SELECT COALESCE(SUM(amount), 0) INTO p_total_revenue
    FROM Payments WHERE payment_status = 'COMPLETED';

    -- Today's bookings
    SELECT COUNT(*) INTO p_today_bookings
    FROM Reservations WHERE TRUNC(booking_date) = TRUNC(CURRENT_DATE);

    -- Today's revenue
    SELECT COALESCE(SUM(amount), 0) INTO p_today_revenue
    FROM Payments WHERE TRUNC(payment_date) = TRUNC(CURRENT_DATE) AND payment_status = 'COMPLETED';

    -- Pending payments
    SELECT COUNT(*) INTO p_pending_payments
    FROM Payments WHERE payment_status = 'PENDING';

    -- Cancelled bookings
    SELECT COUNT(*) INTO p_cancelled_bookings
    FROM Reservations WHERE booking_status = 'CANCELLED';
END;
/
```

### Key Features of Implementation:

- **Automatic Audit Logging**: All DML operations automatically captured
- **Intelligent Change Detection**: Smart reasoning for change causes
- **Business Logic Integration**: Cascading updates maintain data consistency
- **Performance Optimization**: Efficient triggers with minimal overhead
- **Comprehensive Coverage**: All critical entities have complete audit trails

---

## 5. Provenance Queries

### HOW Provenance Queries (Data Evolution)

#### 1. Train Evolution History

**SQL Code:**

```sql
SELECT audit_id, train_id, operation_type,
       old_train_name, old_train_type, old_route_id, old_total_capacity, old_status,
       new_train_name, new_train_type, new_route_id, new_total_capacity, new_status,
       audit_timestamp, user_id, change_reason
FROM Audit_Trains
WHERE train_id = :train_id
ORDER BY audit_timestamp DESC
```

**Type:** HOW - Shows evolution/transformation history of train records

**Sample Result:**

```json
{
  "audit_id": 123,
  "train_id": 5,
  "operation_type": "UPDATE",
  "old_train_name": "Express 101",
  "old_train_type": "EXPRESS",
  "old_total_capacity": 100,
  "old_status": "ACTIVE",
  "new_train_name": "Express 101",
  "new_train_type": "EXPRESS",
  "new_total_capacity": 120,
  "new_status": "ACTIVE",
  "audit_timestamp": "2024-01-15T10:30:00Z",
  "user_id": "ADMIN_USER",
  "change_reason": "Train information updated"
}
```

**Interpretation:** This record shows that Train 5 (Express 101) had its capacity increased from 100 to 120 seats on January 15, 2024, by ADMIN_USER. The change was a capacity upgrade to accommodate more passengers.

#### 2. Schedule Status Transitions

**SQL Code:**

```sql
SELECT audit_id, schedule_id, operation_type,
       old_status, new_status, old_available_seats, new_available_seats,
       audit_timestamp, user_id, change_reason
FROM Audit_Schedules
WHERE schedule_id = :schedule_id
ORDER BY audit_timestamp DESC
```

**Type:** HOW - Shows schedule status transitions and modifications

**Sample Result:**

```json
{
  "audit_id": 456,
  "schedule_id": 12,
  "operation_type": "UPDATE",
  "old_status": "SCHEDULED",
  "new_status": "DELAYED",
  "old_available_seats": 45,
  "new_available_seats": 45,
  "audit_timestamp": "2024-01-15T14:20:00Z",
  "user_id": "OPERATOR_1",
  "change_reason": "Schedule status changed from SCHEDULED to DELAYED"
}
```

**Interpretation:** Schedule 12 was delayed by OPERATOR_1 on January 15, 2024. The available seats remained unchanged (45), indicating this was a timing delay rather than a capacity issue.

### WHY Provenance Queries (Causality and Justifications)

#### 3. Payment Status Changes and Refunds

**SQL Code:**

```sql
SELECT audit_id, payment_id, operation_type,
       old_payment_status, new_payment_status, old_amount, new_amount,
       old_refund_amount, new_refund_amount, audit_timestamp, user_id, change_reason
FROM Audit_Payments
WHERE payment_id = :payment_id
ORDER BY audit_timestamp DESC
```

**Type:** WHY - Shows payment status changes and refund justifications

**Sample Result:**

```json
{
  "audit_id": 789,
  "payment_id": 25,
  "operation_type": "UPDATE",
  "old_payment_status": "COMPLETED",
  "new_payment_status": "REFUNDED",
  "old_amount": 150.0,
  "new_amount": 150.0,
  "old_refund_amount": 0.0,
  "new_refund_amount": 150.0,
  "audit_timestamp": "2024-01-15T16:45:00Z",
  "user_id": "ADMIN_USER",
  "change_reason": "Payment status changed from COMPLETED to REFUNDED"
}
```

**Interpretation:** Payment 25 was fully refunded ($150.00) by ADMIN_USER on January 15, 2024. This likely occurred due to a passenger cancellation or service disruption, with the full amount being returned to the customer.

### WHERE Provenance Queries (Location Context)

#### 4. User Activity Tracking

**SQL Code:**

```sql
SELECT audit_id, entity_id, operation_type, audit_timestamp, change_reason, table_name
FROM (
    SELECT audit_id, train_id as entity_id, operation_type, audit_timestamp, change_reason, 'trains' as table_name
    FROM Audit_Trains WHERE user_id = :user_id
    UNION ALL
    SELECT audit_id, schedule_id as entity_id, operation_type, audit_timestamp, change_reason, 'schedules' as table_name
    FROM Audit_Schedules WHERE user_id = :user_id
    UNION ALL
    SELECT audit_id, reservation_id as entity_id, operation_type, audit_timestamp, change_reason, 'passengers' as table_name
    FROM Audit_Passengers WHERE user_id = :user_id
    UNION ALL
    SELECT audit_id, payment_id as entity_id, operation_type, audit_timestamp, change_reason, 'payments' as table_name
    FROM Audit_Payments WHERE user_id = :user_id
)
ORDER BY audit_timestamp DESC
```

**Type:** WHERE - Shows all actions taken by the specified user across all tables

**Sample Result:**

```json
{
  "audit_id": 101,
  "entity_id": 8,
  "operation_type": "INSERT",
  "audit_timestamp": "2024-01-15T09:15:00Z",
  "change_reason": "New schedule created",
  "table_name": "schedules"
}
```

**Interpretation:** This shows that OPERATOR_1 created a new schedule (ID: 8) on January 15, 2024, at 9:15 AM. This provides accountability and helps track which user made specific changes to the system.

### WHAT Provenance Queries (Source Data Lineage)

#### 5. Revenue Source Lineage

**SQL Code:**

```sql
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
  AND p.payment_date >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND p.payment_date <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
ORDER BY p.payment_date DESC
```

**Type:** WHAT - Shows source data that contributed to revenue calculations

**Sample Result:**

```json
{
  "payment_id": 42,
  "amount": 85.5,
  "payment_status": "COMPLETED",
  "payment_date": "2024-01-15T11:30:00Z",
  "reservation_id": 156,
  "booking_reference": "REF-2024-00156",
  "passenger_name": "John Smith",
  "schedule_id": 23,
  "departure_time": "2024-01-16T08:00:00Z",
  "arrival_time": "2024-01-16T12:30:00Z",
  "train_name": "Express 102",
  "train_type": "EXPRESS",
  "route_name": "Metro Express",
  "route_code": "MEX-001",
  "departure_station": "Central Station",
  "arrival_station": "Downtown Terminal"
}
```

**Interpretation:** This shows that $85.50 in revenue came from John Smith's booking (REF-2024-00156) for the Express 102 train from Central Station to Downtown Terminal on January 16, 2024. This provides complete traceability from revenue back to the specific passenger and journey.

#### 6. Train Utilization Source

**SQL Code:**

```sql
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
  AND s.departure_time >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND s.departure_time <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
GROUP BY s.schedule_id, s.departure_time, s.arrival_time, s.available_seats,
         ds.station_name, as_tbl.station_name
ORDER BY s.departure_time
```

**Type:** WHAT - Shows source schedules and bookings that contributed to train utilization

**Sample Result:**

```json
{
  "schedule_id": 45,
  "departure_time": "2024-01-16T14:00:00Z",
  "arrival_time": "2024-01-16T18:30:00Z",
  "available_seats": 100,
  "bookings_count": 78,
  "confirmed_bookings": 75,
  "utilization_percentage": 75.0,
  "departure_station": "North Terminal",
  "arrival_station": "South Station"
}
```

**Interpretation:** This shows that Schedule 45 (North Terminal to South Station on January 16, 2024) contributed to 75% train utilization with 75 confirmed bookings out of 100 available seats. This provides detailed insight into which specific journeys drove the train's performance metrics.

### Summary Provenance Queries

#### 7. Comprehensive Audit Summary

**SQL Code:**

```sql
SELECT operation_type, COUNT(*) as count, 'trains' as table_name
FROM Audit_Trains
WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
GROUP BY operation_type
UNION ALL
SELECT operation_type, COUNT(*) as count, 'schedules' as table_name
FROM Audit_Schedules
WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
GROUP BY operation_type
UNION ALL
SELECT operation_type, COUNT(*) as count, 'passengers' as table_name
FROM Audit_Passengers
WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
GROUP BY operation_type
UNION ALL
SELECT operation_type, COUNT(*) as count, 'payments' as table_name
FROM Audit_Payments
WHERE audit_timestamp >= TO_DATE(:date_from, 'YYYY-MM-DD')
  AND audit_timestamp <= TO_DATE(:date_to, 'YYYY-MM-DD') + 1
GROUP BY operation_type
```

**Type:** SUMMARY - Overview of all audit activity and user actions

**Sample Result:**

```json
{
  "summary_by_table": {
    "trains": {
      "INSERT": 2,
      "UPDATE": 5,
      "DELETE": 0
    },
    "schedules": {
      "INSERT": 12,
      "UPDATE": 8,
      "DELETE": 1
    },
    "passengers": {
      "INSERT": 45,
      "UPDATE": 12,
      "DELETE": 3
    },
    "payments": {
      "INSERT": 45,
      "UPDATE": 7,
      "DELETE": 0
    }
  },
  "top_active_users": [
    {
      "user_id": "ADMIN_USER",
      "total_actions": 15
    },
    {
      "user_id": "OPERATOR_1",
      "total_actions": 12
    }
  ]
}
```

**Interpretation:** This summary shows that on January 15, 2024, there were 2 new trains added, 5 train updates, 12 new schedules created, 45 new passenger reservations, and 45 new payments processed. ADMIN_USER was the most active user with 15 actions, followed by OPERATOR_1 with 12 actions.

---

## Conclusion

The Train Ticket Management System implements a comprehensive provenance framework that addresses all major types of data lineage questions:

- **HOW Provenance**: Tracks data evolution and transformation through complete audit trails
- **WHY Provenance**: Captures business justifications and causal relationships
- **WHERE Provenance**: Provides user and temporal context for all changes
- **WHAT Provenance**: Enables source data lineage tracing for business intelligence

The system's provenance implementation ensures regulatory compliance, data integrity, and provides valuable insights for operational optimization while maintaining high performance through efficient indexing and trigger design.
