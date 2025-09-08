-- =====================================================
-- Healthcare Patient Record Management System
-- Stored Procedures for Healthcare Workflows
-- =====================================================
-- This file contains stored procedures that implement
-- core healthcare business logic and workflows
-- =====================================================

-- SQL*Plus settings for proper execution
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;
SET ECHO OFF;
SET VERIFY OFF;
SET SERVEROUTPUT ON;

-- =====================================================
-- 1. PATIENT REGISTRATION PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_register_patient (
    p_email IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_first_name IN VARCHAR2,
    p_last_name IN VARCHAR2,
    p_date_of_birth IN DATE,
    p_gender IN VARCHAR2,
    p_blood_type IN VARCHAR2,
    p_contact_phone IN VARCHAR2,
    p_address_line1 IN VARCHAR2,
    p_city IN VARCHAR2,
    p_state IN VARCHAR2,
    p_postal_code IN VARCHAR2,
    p_country IN VARCHAR2,
    p_emergency_contact_name IN VARCHAR2,
    p_emergency_contact_phone IN VARCHAR2,
    p_emergency_contact_relationship IN VARCHAR2,
    p_patient_id OUT NUMBER
) AS
    v_user_id NUMBER;
BEGIN
    -- Create user account first
    INSERT INTO users (user_id, email, password_hash, user_type)
    VALUES (seq_user_id.NEXTVAL, p_email, p_password_hash, 'PATIENT')
    RETURNING user_id INTO v_user_id;
    
    -- Create patient profile
    INSERT INTO patients (
        patient_id, user_id, first_name, last_name, date_of_birth,
        gender, blood_type, contact_phone, address_line1, city,
        state, postal_code, country, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship
    ) VALUES (
        seq_patient_id.NEXTVAL, v_user_id, p_first_name, p_last_name, p_date_of_birth,
        p_gender, p_blood_type, p_contact_phone, p_address_line1, p_city,
        p_state, p_postal_code, p_country, p_emergency_contact_name,
        p_emergency_contact_phone, p_emergency_contact_relationship
    ) RETURNING patient_id INTO p_patient_id;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Patient registered successfully with ID: ' || p_patient_id);
    
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Email already exists: ' || p_email);
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'Error registering patient: ' || SQLERRM);
END;
/

-- =====================================================
-- 2. BOOK APPOINTMENT PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_book_appointment (
    p_patient_id IN NUMBER,
    p_doctor_id IN NUMBER,
    p_appointment_date IN DATE,
    p_appointment_time IN TIMESTAMP,
    p_appointment_type IN VARCHAR2,
    p_reason IN VARCHAR2,
    p_appointment_id OUT NUMBER
) AS
    v_doctor_count NUMBER;
    v_patient_count NUMBER;
    v_conflict_count NUMBER;
BEGIN
    -- Validate doctor exists
    SELECT COUNT(*) INTO v_doctor_count FROM doctors WHERE doctor_id = p_doctor_id;
    IF v_doctor_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Invalid doctor ID: ' || p_doctor_id);
    END IF;
    
    -- Validate patient exists
    SELECT COUNT(*) INTO v_patient_count FROM patients WHERE patient_id = p_patient_id;
    IF v_patient_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Invalid patient ID: ' || p_patient_id);
    END IF;
    
    -- Check for scheduling conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
    AND appointment_time = p_appointment_time
    AND appointment_status NOT IN ('CANCELLED', 'NO_SHOW');
    
    IF v_conflict_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Doctor is not available at this time');
    END IF;
    
    -- Create appointment
    INSERT INTO appointments (
        appointment_id, patient_id, doctor_id, appointment_date,
        appointment_time, appointment_type, reason, appointment_status
    ) VALUES (
        seq_appointment_id.NEXTVAL, p_patient_id, p_doctor_id, p_appointment_date,
        p_appointment_time, p_appointment_type, p_reason, 'SCHEDULED'
    ) RETURNING appointment_id INTO p_appointment_id;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Appointment booked successfully with ID: ' || p_appointment_id);
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20006, 'Error booking appointment: ' || SQLERRM);
END;
/

-- =====================================================
-- 3. CREATE MEDICAL RECORD PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_create_medical_record (
    p_appointment_id IN NUMBER,
    p_record_type IN VARCHAR2,
    p_chief_complaint IN VARCHAR2,
    p_symptoms IN CLOB,
    p_physical_examination IN CLOB,
    p_diagnosis IN CLOB,
    p_treatment_plan IN CLOB,
    p_recommendations IN CLOB,
    p_critical_status IN VARCHAR2 DEFAULT 'NORMAL',
    p_critical_notes IN VARCHAR2 DEFAULT NULL,
    p_follow_up_date IN DATE DEFAULT NULL,
    p_follow_up_notes IN VARCHAR2 DEFAULT NULL,
    p_nurse_id IN NUMBER DEFAULT NULL,
    p_nurse_task IN VARCHAR2 DEFAULT NULL,
    p_record_id OUT NUMBER
) AS
    v_patient_id NUMBER;
    v_doctor_id NUMBER;
    v_appointment_status VARCHAR2(20);
BEGIN
    -- Get appointment details and validate
    SELECT patient_id, doctor_id, appointment_status
    INTO v_patient_id, v_doctor_id, v_appointment_status
    FROM appointments
    WHERE appointment_id = p_appointment_id;
    
    IF v_appointment_status != 'IN_PROGRESS' THEN
        RAISE_APPLICATION_ERROR(-20007, 'Can only create medical records for appointments in progress');
    END IF;
    
    -- Create medical record
    INSERT INTO medical_records (
        record_id, patient_id, doctor_id, nurse_id, nurse_task,
        appointment_id, record_type, chief_complaint, symptoms,
        physical_examination, diagnosis, treatment_plan, recommendations,
        critical_status, critical_notes, follow_up_date, follow_up_notes
    ) VALUES (
        seq_record_id.NEXTVAL, v_patient_id, v_doctor_id, p_nurse_id, p_nurse_task,
        p_appointment_id, p_record_type, p_chief_complaint, p_symptoms,
        p_physical_examination, p_diagnosis, p_treatment_plan, p_recommendations,
        p_critical_status, p_critical_notes, p_follow_up_date, p_follow_up_notes
    ) RETURNING record_id INTO p_record_id;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Medical record created successfully with ID: ' || p_record_id);
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20008, 'Invalid appointment ID: ' || p_appointment_id);
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20009, 'Error creating medical record: ' || SQLERRM);
END;
/

-- =====================================================
-- 4. CREATE PRESCRIPTION WITH MEDICINES PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_create_prescription (
    p_record_id IN NUMBER,
    p_general_instructions IN VARCHAR2,
    p_medicines IN VARCHAR2, -- JSON-like string: "medicine1:dosage1:frequency1:duration1:instructions1|medicine2:..."
    p_prescription_id OUT NUMBER
) AS
    v_medicine_data VARCHAR2(4000);
    v_medicine_name VARCHAR2(100);
    v_dosage VARCHAR2(50);
    v_frequency VARCHAR2(100);
    v_duration VARCHAR2(100);
    v_instructions VARCHAR2(500);
    v_pos NUMBER;
    v_end_pos NUMBER;
    v_medicine_count NUMBER := 0;
BEGIN
    -- Validate medical record exists
    SELECT COUNT(*) INTO v_medicine_count FROM medical_records WHERE record_id = p_record_id;
    IF v_medicine_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20010, 'Invalid medical record ID: ' || p_record_id);
    END IF;
    
    -- Create prescription header
    INSERT INTO prescriptions (
        prescription_id, record_id, general_instructions
    ) VALUES (
        seq_prescription_id.NEXTVAL, p_record_id, p_general_instructions
    ) RETURNING prescription_id INTO p_prescription_id;
    
    -- Parse and insert medicines
    v_medicine_data := p_medicines;
    v_pos := 1;
    
    WHILE v_pos <= LENGTH(v_medicine_data) LOOP
        v_end_pos := INSTR(v_medicine_data, '|', v_pos);
        IF v_end_pos = 0 THEN
            v_end_pos := LENGTH(v_medicine_data) + 1;
        END IF;
        
        DECLARE
            v_medicine_entry VARCHAR2(1000);
            v_field_pos NUMBER := 1;
            v_field_end NUMBER;
        BEGIN
            v_medicine_entry := SUBSTR(v_medicine_data, v_pos, v_end_pos - v_pos);
            
            -- Parse medicine details (medicine:dosage:frequency:duration:instructions)
            -- Medicine name
            v_field_end := INSTR(v_medicine_entry, ':', v_field_pos);
            v_medicine_name := SUBSTR(v_medicine_entry, v_field_pos, v_field_end - v_field_pos);
            v_field_pos := v_field_end + 1;
            
            -- Dosage
            v_field_end := INSTR(v_medicine_entry, ':', v_field_pos);
            v_dosage := SUBSTR(v_medicine_entry, v_field_pos, v_field_end - v_field_pos);
            v_field_pos := v_field_end + 1;
            
            -- Frequency
            v_field_end := INSTR(v_medicine_entry, ':', v_field_pos);
            v_frequency := SUBSTR(v_medicine_entry, v_field_pos, v_field_end - v_field_pos);
            v_field_pos := v_field_end + 1;
            
            -- Duration
            v_field_end := INSTR(v_medicine_entry, ':', v_field_pos);
            v_duration := SUBSTR(v_medicine_entry, v_field_pos, v_field_end - v_field_pos);
            v_field_pos := v_field_end + 1;
            
            -- Instructions
            v_instructions := SUBSTR(v_medicine_entry, v_field_pos);
            
            -- Insert medicine
            INSERT INTO prescription_medicines (
                medicine_id, prescription_id, medicine_name, dosage,
                frequency, duration, instructions
            ) VALUES (
                seq_prescription_medicine_id.NEXTVAL, p_prescription_id, v_medicine_name,
                v_dosage, v_frequency, v_duration, v_instructions
            );
            
            v_medicine_count := v_medicine_count + 1;
        END;
        
        v_pos := v_end_pos + 1;
    END LOOP;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Prescription created successfully with ID: ' || p_prescription_id || 
                        ' containing ' || v_medicine_count || ' medicines');
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20011, 'Error creating prescription: ' || SQLERRM);
END;
/

-- =====================================================
-- 5. UPDATE CRITICAL STATUS PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_update_critical_status (
    p_record_id IN NUMBER,
    p_critical_status IN VARCHAR2,
    p_critical_notes IN VARCHAR2,
    p_nurse_id IN NUMBER
) AS
    v_record_count NUMBER;
    v_patient_id NUMBER;
    v_doctor_id NUMBER;
BEGIN
    -- Validate medical record exists and get details
    SELECT COUNT(*), MAX(patient_id), MAX(doctor_id)
    INTO v_record_count, v_patient_id, v_doctor_id
    FROM medical_records
    WHERE record_id = p_record_id
    GROUP BY record_id;
    
    IF v_record_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20012, 'Invalid medical record ID: ' || p_record_id);
    END IF;
    
    -- Update critical status
    UPDATE medical_records
    SET critical_status = p_critical_status,
        critical_notes = p_critical_notes,
        nurse_id = p_nurse_id
    WHERE record_id = p_record_id;
    
    -- Log action for doctor notification if critical
    IF p_critical_status IN ('ATTENTION', 'CRITICAL') THEN
        INSERT INTO audit_user_actions (
            audit_id, user_id, action_type, action_timestamp,
            action_description, action_parameters, table_name, record_id
        ) VALUES (
            seq_audit_id.NEXTVAL, p_nurse_id, 'CRITICAL_STATUS_UPDATE', SYSTIMESTAMP,
            'Nurse updated patient critical status to ' || p_critical_status,
            'patient_id=' || v_patient_id || ',doctor_id=' || v_doctor_id,
            'MEDICAL_RECORDS', p_record_id
        );
    END IF;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Critical status updated successfully for record ID: ' || p_record_id);
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20013, 'Error updating critical status: ' || SQLERRM);
END;
/

-- =====================================================
-- 6. GET PATIENT TIMELINE PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_get_patient_timeline (
    p_patient_id IN NUMBER,
    p_start_date IN DATE DEFAULT NULL,
    p_end_date IN DATE DEFAULT NULL,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
    SELECT 
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.appointment_status,
        a.reason as appointment_reason,
        d.first_name || ' ' || d.last_name as doctor_name,
        s.specialization_name,
        dp.department_name,
        mr.record_id,
        mr.diagnosis,
        mr.critical_status,
        n.first_name || ' ' || n.last_name as nurse_name,
        mr.nurse_task,
        COUNT(pm.medicine_id) as medicine_count,
        a.appointment_id,
        a.created_date as timeline_date
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN specializations s ON d.specialization_id = s.specialization_id
    LEFT JOIN departments dp ON d.department_id = dp.department_id
    LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id
    LEFT JOIN nurses n ON mr.nurse_id = n.nurse_id
    LEFT JOIN prescriptions p ON mr.record_id = p.record_id
    LEFT JOIN prescription_medicines pm ON p.prescription_id = pm.prescription_id
    WHERE a.patient_id = p_patient_id
    AND (p_start_date IS NULL OR a.appointment_date >= p_start_date)
    AND (p_end_date IS NULL OR a.appointment_date <= p_end_date)
    GROUP BY 
        a.appointment_date, a.appointment_time, a.appointment_type, a.appointment_status,
        a.reason, d.first_name, d.last_name, s.specialization_name, dp.department_name,
        mr.record_id, mr.diagnosis, mr.critical_status, n.first_name, n.last_name,
        mr.nurse_task, a.appointment_id, a.created_date
    ORDER BY a.appointment_date DESC, a.appointment_time DESC;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20014, 'Error retrieving patient timeline: ' || SQLERRM);
END;
/

-- =====================================================
-- 7. GET DOCTOR DASHBOARD DATA PROCEDURE
-- =====================================================

CREATE OR REPLACE PROCEDURE sp_get_doctor_dashboard (
    p_doctor_id IN NUMBER,
    p_date IN DATE DEFAULT SYSDATE,
    p_appointments_cursor OUT SYS_REFCURSOR,
    p_patient_count OUT NUMBER,
    p_recent_records_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    -- Get today's appointments
    OPEN p_appointments_cursor FOR
    SELECT 
        a.appointment_id,
        a.appointment_time,
        a.appointment_type,
        a.appointment_status,
        a.reason,
        pt.first_name || ' ' || pt.last_name as patient_name,
        pt.blood_type,
        pt.contact_phone
    FROM appointments a
    JOIN patients pt ON a.patient_id = pt.patient_id
    WHERE a.doctor_id = p_doctor_id
    AND TRUNC(a.appointment_date) = TRUNC(p_date)
    ORDER BY a.appointment_time;
    
    -- Get today's patient count
    SELECT COUNT(DISTINCT a.patient_id)
    INTO p_patient_count
    FROM appointments a
    WHERE a.doctor_id = p_doctor_id
    AND TRUNC(a.appointment_date) = TRUNC(p_date);
    
    -- Get recent medical records
    OPEN p_recent_records_cursor FOR
    SELECT 
        mr.record_id,
        mr.created_date,
        pt.first_name || ' ' || pt.last_name as patient_name,
        mr.diagnosis,
        mr.critical_status,
        a.appointment_type
    FROM medical_records mr
    JOIN patients pt ON mr.patient_id = pt.patient_id
    JOIN appointments a ON mr.appointment_id = a.appointment_id
    WHERE mr.doctor_id = p_doctor_id
    AND mr.created_date >= TRUNC(SYSDATE) - 7
    ORDER BY mr.created_date DESC
    FETCH FIRST 10 ROWS ONLY;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE_APPLICATION_ERROR(-20015, 'Error retrieving doctor dashboard: ' || SQLERRM);
END;
/

-- =====================================================
-- PROCEDURE SUMMARY
-- =====================================================

PROMPT =====================================================
PROMPT Healthcare Procedures Created Successfully!
PROMPT =====================================================
PROMPT Total Procedures: 7
PROMPT - sp_register_patient: Patient registration workflow
PROMPT - sp_book_appointment: Appointment booking with validation
PROMPT - sp_create_medical_record: Medical record creation
PROMPT - sp_create_prescription: Multi-medicine prescription creation
PROMPT - sp_update_critical_status: Nurse critical status updates
PROMPT - sp_get_patient_timeline: Patient medical history timeline
PROMPT - sp_get_doctor_dashboard: Doctor dashboard data retrieval
PROMPT =====================================================
PROMPT Healthcare workflows are now available via procedures
PROMPT =====================================================

EXIT;
