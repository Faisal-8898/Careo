-- ====================================================================
-- PROVENANCE TRIGGERS FOR SIMPLIFIED TRAIN TICKET MANAGEMENT SYSTEM
-- CSE464 Advanced Database Systems - Automatic Audit Logging
-- ====================================================================

-- ====================================================================
-- TRIGGERS FOR TRAINS TABLE
-- ====================================================================

-- Trigger for INSERT operations on Trains
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

-- Trigger for UPDATE operations on Trains
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

-- Trigger for DELETE operations on Trains
CREATE OR REPLACE TRIGGER trg_trains_delete
    BEFORE DELETE ON Trains
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Trains (
        audit_id, train_id, operation_type,
        old_train_name, old_train_type, old_route_id, old_total_capacity, old_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :OLD.train_id, 'DELETE',
        :OLD.train_name, :OLD.train_type, :OLD.route_id, :OLD.total_capacity, :OLD.status,
        CURRENT_TIMESTAMP, USER, 'Train removed from system'
    );
END;
/

-- ====================================================================
-- TRIGGERS FOR SCHEDULES TABLE
-- ====================================================================

-- Trigger for INSERT operations on Schedules
CREATE OR REPLACE TRIGGER trg_schedules_insert
    AFTER INSERT ON Schedules
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Schedules (
        audit_id, schedule_id, operation_type,
        new_train_id, new_departure_station_id, new_arrival_station_id,
        new_departure_time, new_arrival_time, new_base_fare, new_available_seats, new_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.schedule_id, 'INSERT',
        :NEW.train_id, :NEW.departure_station_id, :NEW.arrival_station_id,
        :NEW.departure_time, :NEW.arrival_time, :NEW.base_fare, :NEW.available_seats, :NEW.status,
        CURRENT_TIMESTAMP, USER, 'New schedule created'
    );
END;
/

-- Trigger for UPDATE operations on Schedules
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

-- Trigger for DELETE operations on Schedules
CREATE OR REPLACE TRIGGER trg_schedules_delete
    BEFORE DELETE ON Schedules
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Schedules (
        audit_id, schedule_id, operation_type,
        old_train_id, old_departure_station_id, old_arrival_station_id,
        old_departure_time, old_arrival_time, old_base_fare, old_available_seats, old_status,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :OLD.schedule_id, 'DELETE',
        :OLD.train_id, :OLD.departure_station_id, :OLD.arrival_station_id,
        :OLD.departure_time, :OLD.arrival_time, :OLD.base_fare, :OLD.available_seats, :OLD.status,
        CURRENT_TIMESTAMP, USER, 'Schedule removed from system'
    );
END;
/

-- ====================================================================
-- TRIGGERS FOR RESERVATIONS TABLE (Passengers)
-- ====================================================================

-- Trigger for INSERT operations on Reservations
CREATE OR REPLACE TRIGGER trg_reservations_insert
    AFTER INSERT ON Reservations
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Passengers (
        audit_id, reservation_id, operation_type,
        new_passenger_id, new_schedule_id, new_seat_number, new_booking_reference,
        new_passenger_name, new_passenger_age, new_passenger_gender,
        new_booking_status, new_fare_amount,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.reservation_id, 'INSERT',
        :NEW.passenger_id, :NEW.schedule_id, :NEW.seat_number, :NEW.booking_reference,
        :NEW.passenger_name, :NEW.passenger_age, :NEW.passenger_gender,
        :NEW.booking_status, :NEW.fare_amount,
        CURRENT_TIMESTAMP, USER, 'New reservation created'
    );
END;
/

-- Trigger for UPDATE operations on Reservations
CREATE OR REPLACE TRIGGER trg_reservations_update
    AFTER UPDATE ON Reservations
    FOR EACH ROW
DECLARE
    v_change_reason VARCHAR2(500);
BEGIN
    -- Determine the reason for change
    IF :OLD.booking_status != :NEW.booking_status THEN
        v_change_reason := 'Booking status changed from ' || :OLD.booking_status || ' to ' || :NEW.booking_status;
    ELSIF :OLD.seat_number != :NEW.seat_number THEN
        v_change_reason := 'Seat number changed from ' || :OLD.seat_number || ' to ' || :NEW.seat_number;
    ELSE
        v_change_reason := 'Reservation information updated';
    END IF;

    INSERT INTO Audit_Passengers (
        audit_id, reservation_id, operation_type,
        old_passenger_id, old_schedule_id, old_seat_number, old_booking_reference,
        old_passenger_name, old_passenger_age, old_passenger_gender,
        old_booking_status, old_fare_amount,
        new_passenger_id, new_schedule_id, new_seat_number, new_booking_reference,
        new_passenger_name, new_passenger_age, new_passenger_gender,
        new_booking_status, new_fare_amount,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.reservation_id, 'UPDATE',
        :OLD.passenger_id, :OLD.schedule_id, :OLD.seat_number, :OLD.booking_reference,
        :OLD.passenger_name, :OLD.passenger_age, :OLD.passenger_gender,
        :OLD.booking_status, :OLD.fare_amount,
        :NEW.passenger_id, :NEW.schedule_id, :NEW.seat_number, :NEW.booking_reference,
        :NEW.passenger_name, :NEW.passenger_age, :NEW.passenger_gender,
        :NEW.booking_status, :NEW.fare_amount,
        CURRENT_TIMESTAMP, USER, v_change_reason
    );
END;
/

-- Trigger for DELETE operations on Reservations
CREATE OR REPLACE TRIGGER trg_reservations_delete
    BEFORE DELETE ON Reservations
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Passengers (
        audit_id, reservation_id, operation_type,
        old_passenger_id, old_schedule_id, old_seat_number, old_booking_reference,
        old_passenger_name, old_passenger_age, old_passenger_gender,
        old_booking_status, old_fare_amount,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :OLD.reservation_id, 'DELETE',
        :OLD.passenger_id, :OLD.schedule_id, :OLD.seat_number, :OLD.booking_reference,
        :OLD.passenger_name, :OLD.passenger_age, :OLD.passenger_gender,
        :OLD.booking_status, :OLD.fare_amount,
        CURRENT_TIMESTAMP, USER, 'Reservation cancelled/removed'
    );
END;
/

-- ====================================================================
-- TRIGGERS FOR PAYMENTS TABLE
-- ====================================================================

-- Trigger for INSERT operations on Payments
CREATE OR REPLACE TRIGGER trg_payments_insert
    AFTER INSERT ON Payments
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Payments (
        audit_id, payment_id, operation_type,
        new_reservation_id, new_amount, new_payment_method, new_payment_status,
        new_transaction_id, new_refund_amount, new_refund_date,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.payment_id, 'INSERT',
        :NEW.reservation_id, :NEW.amount, :NEW.payment_method, :NEW.payment_status,
        :NEW.transaction_id, :NEW.refund_amount, :NEW.refund_date,
        CURRENT_TIMESTAMP, USER, 'New payment record created'
    );
END;
/

-- Trigger for UPDATE operations on Payments
CREATE OR REPLACE TRIGGER trg_payments_update
    AFTER UPDATE ON Payments
    FOR EACH ROW
DECLARE
    v_change_reason VARCHAR2(500);
BEGIN
    -- Determine the reason for change
    IF :OLD.payment_status != :NEW.payment_status THEN
        v_change_reason := 'Payment status changed from ' || :OLD.payment_status || ' to ' || :NEW.payment_status;
    ELSIF :OLD.refund_amount != :NEW.refund_amount THEN
        v_change_reason := 'Refund amount updated from ' || :OLD.refund_amount || ' to ' || :NEW.refund_amount;
    ELSE
        v_change_reason := 'Payment information updated';
    END IF;

    INSERT INTO Audit_Payments (
        audit_id, payment_id, operation_type,
        old_reservation_id, old_amount, old_payment_method, old_payment_status,
        old_transaction_id, old_refund_amount, old_refund_date,
        new_reservation_id, new_amount, new_payment_method, new_payment_status,
        new_transaction_id, new_refund_amount, new_refund_date,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :NEW.payment_id, 'UPDATE',
        :OLD.reservation_id, :OLD.amount, :OLD.payment_method, :OLD.payment_status,
        :OLD.transaction_id, :OLD.refund_amount, :OLD.refund_date,
        :NEW.reservation_id, :NEW.amount, :NEW.payment_method, :NEW.payment_status,
        :NEW.transaction_id, :NEW.refund_amount, :NEW.refund_date,
        CURRENT_TIMESTAMP, USER, v_change_reason
    );
END;
/

-- Trigger for DELETE operations on Payments
CREATE OR REPLACE TRIGGER trg_payments_delete
    BEFORE DELETE ON Payments
    FOR EACH ROW
BEGIN
    INSERT INTO Audit_Payments (
        audit_id, payment_id, operation_type,
        old_reservation_id, old_amount, old_payment_method, old_payment_status,
        old_transaction_id, old_refund_amount, old_refund_date,
        audit_timestamp, user_id, change_reason
    ) VALUES (
        audit_seq.NEXTVAL, :OLD.payment_id, 'DELETE',
        :OLD.reservation_id, :OLD.amount, :OLD.payment_method, :OLD.payment_status,
        :OLD.transaction_id, :OLD.refund_amount, :OLD.refund_date,
        CURRENT_TIMESTAMP, USER, 'Payment record removed'
    );
END;
/

-- ====================================================================
-- CASCADING TRIGGER FOR SEAT AVAILABILITY UPDATES
-- ====================================================================

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

COMMIT;
