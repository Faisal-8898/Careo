-- =====================================================
-- Healthcare Patient Record Management System
-- Cascade Triggers for Business Logic Enforcement
-- =====================================================
-- This file contains triggers that enforce business rules
-- and cascade operations specific to healthcare workflows
-- =====================================================

-- SQL*Plus settings for proper execution
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;
SET ECHO OFF;
SET VERIFY OFF;
SET SERVEROUTPUT ON;

-- =====================================================
-- 1. APPOINTMENT STATUS CHANGE TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_appointment_status_change
BEFORE UPDATE ON appointments
FOR EACH ROW
WHEN (OLD.appointment_status != NEW.appointment_status)
BEGIN
    -- Log appointment status changes in audit_user_actions
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'APPOINTMENT_STATUS_CHANGE',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'Appointment status changed from ' || :OLD.appointment_status || ' to ' || :NEW.appointment_status,
        'APPOINTMENTS',
        :NEW.appointment_id,
        'UPDATE'
    );
    
    -- Set updated timestamp
    :NEW.created_date := SYSDATE;
END;
/

-- =====================================================
-- 2. CRITICAL STATUS NOTIFICATION TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_critical_status_notification
AFTER UPDATE ON medical_records
FOR EACH ROW
WHEN (OLD.critical_status != NEW.critical_status AND NEW.critical_status IN ('ATTENTION', 'CRITICAL'))
BEGIN
    -- Log critical status change for doctor notification
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        action_parameters,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'CRITICAL_STATUS_ALERT',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'Patient critical status changed to ' || :NEW.critical_status || ' - Doctor notification required',
        'patient_id=' || :NEW.patient_id || ',doctor_id=' || :NEW.doctor_id || ',nurse_id=' || :NEW.nurse_id,
        'MEDICAL_RECORDS',
        :NEW.record_id,
        'UPDATE'
    );
    
    -- Log data access for compliance
    INSERT INTO audit_data_access (
        audit_id,
        user_id,
        access_timestamp,
        ip_address,
        table_name,
        record_id,
        access_type,
        access_purpose,
        business_justification
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'MEDICAL_RECORDS',
        :NEW.record_id,
        'UPDATE',
        'Critical status monitoring',
        'Nurse updated patient critical status requiring doctor notification'
    );
END;
/

-- =====================================================
-- 3. PRESCRIPTION MEDICINE VALIDATION TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_prescription_medicine_validation
BEFORE INSERT OR UPDATE ON prescription_medicines
FOR EACH ROW
DECLARE
    v_prescription_exists NUMBER;
    v_record_id NUMBER;
    v_doctor_id NUMBER;
BEGIN
    -- Verify prescription exists
    SELECT COUNT(*), pr.record_id
    INTO v_prescription_exists, v_record_id
    FROM prescriptions pr
    WHERE pr.prescription_id = :NEW.prescription_id
    GROUP BY pr.record_id;
    
    IF v_prescription_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Invalid prescription ID: ' || :NEW.prescription_id);
    END IF;
    
    -- Get doctor for audit trail
    SELECT mr.doctor_id
    INTO v_doctor_id
    FROM medical_records mr
    WHERE mr.record_id = v_record_id;
    
    -- Log medicine prescription action
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        action_parameters,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'MEDICINE_PRESCRIBED',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'Medicine ' || :NEW.medicine_name || ' prescribed with dosage ' || :NEW.dosage,
        'prescription_id=' || :NEW.prescription_id || ',doctor_id=' || v_doctor_id,
        'PRESCRIPTION_MEDICINES',
        :NEW.medicine_id,
        CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END
    );
END;
/

-- =====================================================
-- 4. PATIENT DATA ACCESS LOGGING TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_patient_data_access
AFTER SELECT ON patients
FOR EACH ROW
BEGIN
    -- Log patient data access for compliance
    INSERT INTO audit_data_access (
        audit_id,
        user_id,
        access_timestamp,
        ip_address,
        table_name,
        record_id,
        access_type,
        access_purpose,
        business_justification,
        patient_consent_verified
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'PATIENTS',
        :NEW.patient_id,
        'SELECT',
        'Patient profile access',
        'Healthcare provider accessing patient information for medical care',
        'Y'
    );
END;
/

-- =====================================================
-- 5. MEDICAL RECORD COMPLETION TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_medical_record_completion
AFTER INSERT ON medical_records
FOR EACH ROW
BEGIN
    -- Automatically update appointment status to COMPLETED when medical record is created
    UPDATE appointments
    SET appointment_status = 'COMPLETED'
    WHERE appointment_id = :NEW.appointment_id
    AND appointment_status = 'IN_PROGRESS';
    
    -- Log medical record completion
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        action_parameters,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'MEDICAL_RECORD_COMPLETED',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'Medical record created and appointment marked as completed',
        'appointment_id=' || :NEW.appointment_id || ',patient_id=' || :NEW.patient_id,
        'MEDICAL_RECORDS',
        :NEW.record_id,
        'INSERT'
    );
END;
/

-- =====================================================
-- 6. USER ROLE VALIDATION TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_user_role_validation
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
BEGIN
    -- Ensure email is in proper format (basic validation)
    IF NOT REGEXP_LIKE(:NEW.email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        RAISE_APPLICATION_ERROR(-20002, 'Invalid email format: ' || :NEW.email);
    END IF;
    
    -- Log user account changes
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'USER_ACCOUNT_CHANGE',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        CASE 
            WHEN INSERTING THEN 'New user account created for ' || :NEW.user_type
            ELSE 'User account updated for ' || :NEW.user_type
        END,
        'USERS',
        :NEW.user_id,
        CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END
    );
END;
/

-- =====================================================
-- 7. NURSE TASK ASSIGNMENT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_nurse_task_assignment
AFTER UPDATE ON medical_records
FOR EACH ROW
WHEN (OLD.nurse_id IS NULL AND NEW.nurse_id IS NOT NULL)
BEGIN
    -- Log nurse assignment to patient care
    INSERT INTO audit_user_actions (
        audit_id,
        user_id,
        action_type,
        action_timestamp,
        ip_address,
        action_description,
        action_parameters,
        table_name,
        record_id,
        operation_type
    ) VALUES (
        seq_audit_id.NEXTVAL,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        'NURSE_TASK_ASSIGNED',
        SYSTIMESTAMP,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
        'Nurse assigned to patient care with task: ' || NVL(:NEW.nurse_task, 'General care'),
        'nurse_id=' || :NEW.nurse_id || ',patient_id=' || :NEW.patient_id || ',doctor_id=' || :NEW.doctor_id,
        'MEDICAL_RECORDS',
        :NEW.record_id,
        'UPDATE'
    );
END;
/

-- =====================================================
-- TRIGGER SUMMARY
-- =====================================================

PROMPT =====================================================
PROMPT Healthcare Cascade Triggers Created Successfully!
PROMPT =====================================================
PROMPT Total Cascade Triggers: 7
PROMPT - Appointment status change tracking
PROMPT - Critical status notification system
PROMPT - Prescription medicine validation
PROMPT - Patient data access logging
PROMPT - Medical record completion automation
PROMPT - User role validation
PROMPT - Nurse task assignment tracking
PROMPT =====================================================
PROMPT Business rules and workflows are now automated
PROMPT =====================================================

EXIT;
