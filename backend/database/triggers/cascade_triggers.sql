-- =====================================================
-- Healthcare Database Cascade Triggers
-- Business Logic and Cascading Updates
-- =====================================================

-- Drop existing cascade triggers if they exist
DROP TRIGGER trg_cascade_medication_status;
DROP TRIGGER trg_cascade_doctor_status;
DROP TRIGGER trg_cascade_nurse_status;
DROP TRIGGER trg_cascade_admin_status;
DROP TRIGGER trg_cascade_patient_status;
DROP TRIGGER trg_cascade_appointment_validation;
DROP TRIGGER trg_cascade_medical_record_status;
DROP TRIGGER trg_cascade_prescription_status;
DROP TRIGGER trg_cascade_lab_result_status;

-- =====================================================
-- MEDICATION STATUS CASCADE TRIGGER
-- When medication status changes, update related prescriptions
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_medication_status
AFTER UPDATE OF status ON medications
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_affected_prescriptions NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If medication is discontinued, update all active prescriptions
    IF :NEW.status = 'DISCONTINUED' THEN
        UPDATE prescriptions 
        SET status = 'CANCELLED',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE medication_id = :NEW.medication_id 
        AND status = 'ACTIVE';
        
        v_affected_prescriptions := SQL%ROWCOUNT;
        
        -- Log the cascade effect
        IF v_affected_prescriptions > 0 THEN
            SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
            
            INSERT INTO audit_prescriptions (
                audit_id, prescription_id, operation_type, operation_timestamp,
                user_id, session_id, ip_address, application_name,
                change_reason, change_justification, change_summary,
                old_status, new_status, source_system, data_lineage, transformation_notes
            )
            SELECT 
                v_audit_id, prescription_id, 'UPDATE', SYSTIMESTAMP,
                USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                'Medication discontinued', 'Automatic cancellation due to medication discontinuation',
                'Prescription automatically cancelled due to medication ' || :NEW.generic_name || ' being discontinued',
                'ACTIVE', 'CANCELLED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                'Automatic cascade update via trigger'
            FROM prescriptions 
            WHERE medication_id = :NEW.medication_id 
            AND status = 'CANCELLED'
            AND modified_date = SYSDATE;
        END IF;
        
        -- Log the cascade effect in user actions
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'CASCADE_UPDATE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'MEDICATIONS', 'trg_cascade_medication_status',
            'Medication ' || :NEW.medication_id || ' discontinued, affecting ' || 
            v_affected_prescriptions || ' prescriptions', 'SUCCESS', 'PRESCRIPTIONS', 'UPDATE',
            v_affected_prescriptions, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- DOCTOR STATUS CASCADE TRIGGER
-- When doctor status changes, update related appointments and records
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_doctor_status
AFTER UPDATE OF status ON doctors
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_affected_appointments NUMBER := 0;
    v_affected_records NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If doctor is suspended or inactive, update appointments
    IF :NEW.status IN ('SUSPENDED', 'INACTIVE') THEN
        -- Cancel future appointments
        UPDATE appointments 
        SET status = 'CANCELLED',
            notes = COALESCE(notes, '') || ' - Automatically cancelled due to doctor status change',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE doctor_id = :NEW.doctor_id 
        AND appointment_date > SYSDATE
        AND status IN ('SCHEDULED', 'CONFIRMED');
        
        v_affected_appointments := SQL%ROWCOUNT;
        
        -- Update medical records status
        UPDATE medical_records 
        SET record_status = 'ARCHIVED',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE doctor_id = :NEW.doctor_id 
        AND record_status = 'ACTIVE';
        
        v_affected_records := SQL%ROWCOUNT;
        
        -- Log cascade effects
        IF v_affected_appointments > 0 OR v_affected_records > 0 THEN
            -- Log appointment changes
            IF v_affected_appointments > 0 THEN
                INSERT INTO audit_appointments (
                    audit_id, appointment_id, operation_type, operation_timestamp,
                    user_id, session_id, ip_address, application_name,
                    change_reason, change_justification, change_summary,
                    old_status, new_status, source_system, data_lineage, transformation_notes
                )
                SELECT 
                    seq_audit_id.NEXTVAL, appointment_id, 'UPDATE', SYSTIMESTAMP,
                    USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                    SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                    'Doctor status change', 'Automatic cancellation due to doctor status change',
                    'Appointment automatically cancelled due to doctor ' || :NEW.first_name || ' ' || :NEW.last_name || ' status change',
                    'SCHEDULED', 'CANCELLED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                    'Automatic cascade update via trigger'
                FROM appointments 
                WHERE doctor_id = :NEW.doctor_id 
                AND status = 'CANCELLED'
                AND modified_date = SYSDATE;
            END IF;
            
            -- Log medical record changes
            IF v_affected_records > 0 THEN
                INSERT INTO audit_medical_records (
                    audit_id, record_id, operation_type, operation_timestamp,
                    user_id, session_id, ip_address, application_name,
                    change_reason, change_justification, change_summary,
                    old_record_status, new_record_status, source_system, data_lineage, transformation_notes
                )
                SELECT 
                    seq_audit_id.NEXTVAL, record_id, 'UPDATE', SYSTIMESTAMP,
                    USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                    SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                    'Doctor status change', 'Automatic archival due to doctor status change',
                    'Medical record automatically archived due to doctor ' || :NEW.first_name || ' ' || :NEW.last_name || ' status change',
                    'ACTIVE', 'ARCHIVED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                    'Automatic cascade update via trigger'
                FROM medical_records 
                WHERE doctor_id = :NEW.doctor_id 
                AND record_status = 'ARCHIVED'
                AND modified_date = SYSDATE;
            END IF;
        END IF;
        
        -- Log the cascade effect in user actions
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'CASCADE_UPDATE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'DOCTORS', 'trg_cascade_doctor_status',
            'Doctor ' || :NEW.doctor_id || ' status changed to ' || :NEW.status || 
            ', affecting ' || v_affected_appointments || ' appointments and ' || 
            v_affected_records || ' medical records', 'SUCCESS', 'MULTIPLE', 'UPDATE',
            v_affected_appointments + v_affected_records, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- NURSE STATUS CASCADE TRIGGER
-- When nurse status changes, update related records
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_nurse_status
AFTER UPDATE OF status ON nurses
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_affected_records NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If nurse is suspended or inactive, update related records
    IF :NEW.status IN ('SUSPENDED', 'INACTIVE') THEN
        -- Update medical records where nurse was involved
        UPDATE medical_records 
        SET record_status = 'ARCHIVED',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE record_id IN (
            SELECT DISTINCT mr.record_id 
            FROM medical_records mr
            JOIN audit_medical_records amr ON mr.record_id = amr.record_id
            WHERE amr.user_id = :NEW.nurse_id
            AND mr.record_status = 'ACTIVE'
        );
        
        v_affected_records := SQL%ROWCOUNT;
        
        -- Log the cascade effect in user actions
        IF v_affected_records > 0 THEN
            INSERT INTO audit_user_actions (
                audit_id, user_id, session_id, action_type, action_timestamp,
                ip_address, application_name, module_name, function_name,
                action_description, action_result, table_name, operation_type,
                rows_affected, source_system, data_lineage
            ) VALUES (
                seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
                'CASCADE_UPDATE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
                'CASCADE_TRIGGER', 'NURSES', 'trg_cascade_nurse_status',
                'Nurse ' || :NEW.nurse_id || ' status changed to ' || :NEW.status || 
                ', affecting ' || v_affected_records || ' medical records', 'SUCCESS', 'MEDICAL_RECORDS', 'UPDATE',
                v_affected_records, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
            );
        END IF;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- ADMINS STATUS CASCADE TRIGGER
-- When admin status changes, update related records
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_admin_status
AFTER UPDATE OF status ON admins
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_affected_actions NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If admin is suspended or inactive, log the change
    IF :NEW.status IN ('SUSPENDED', 'INACTIVE') THEN
        -- Log the status change in user actions
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'STATUS_CHANGE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'ADMINS', 'trg_cascade_admin_status',
            'Admin ' || :NEW.admin_id || ' status changed to ' || :NEW.status || 
            ' - Access level: ' || :NEW.access_level, 'SUCCESS', 'ADMINS', 'UPDATE',
            1, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
        );
        
        -- If admin had elevated access, log security implications
        IF :OLD.access_level IN ('ADMINISTRATOR', 'SUPER_ADMIN') THEN
            INSERT INTO audit_user_actions (
                audit_id, user_id, session_id, action_type, action_timestamp,
                ip_address, application_name, module_name, function_name,
                action_description, action_result, table_name, operation_type,
                rows_affected, source_system, data_lineage
            ) VALUES (
                seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
                'SECURITY_ALERT', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
                'CASCADE_TRIGGER', 'ADMINS', 'trg_cascade_admin_status',
                'SECURITY ALERT: High-privilege admin ' || :NEW.admin_id || ' status changed to ' || :NEW.status, 
                'SUCCESS', 'ADMINS', 'UPDATE',
                1, 'HEALTHCARE_SYSTEM', 'SECURITY_MONITORING'
            );
        END IF;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- PATIENT STATUS CASCADE TRIGGER
-- When patient status changes, update related records
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_patient_status
AFTER UPDATE OF status ON patients
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_affected_appointments NUMBER := 0;
    v_affected_records NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If patient is deceased, update related records
    IF :NEW.status = 'DECEASED' THEN
        -- Cancel future appointments
        UPDATE appointments 
        SET status = 'CANCELLED',
            notes = COALESCE(notes, '') || ' - Automatically cancelled due to patient status change',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE patient_id = :NEW.patient_id 
        AND appointment_date > SYSDATE
        AND status IN ('SCHEDULED', 'CONFIRMED');
        
        v_affected_appointments := SQL%ROWCOUNT;
        
        -- Archive medical records
        UPDATE medical_records 
        SET record_status = 'ARCHIVED',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE patient_id = :NEW.patient_id 
        AND record_status = 'ACTIVE';
        
        v_affected_records := SQL%ROWCOUNT;
        
        -- Log cascade effects
        IF v_affected_appointments > 0 OR v_affected_records > 0 THEN
            -- Log appointment changes
            IF v_affected_appointments > 0 THEN
                INSERT INTO audit_appointments (
                    audit_id, appointment_id, operation_type, operation_timestamp,
                    user_id, session_id, ip_address, application_name,
                    change_reason, change_justification, change_summary,
                    old_status, new_status, source_system, data_lineage, transformation_notes
                )
                SELECT 
                    seq_audit_id.NEXTVAL, appointment_id, 'UPDATE', SYSTIMESTAMP,
                    USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                    SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                    'Patient status change', 'Automatic cancellation due to patient status change',
                    'Appointment automatically cancelled due to patient ' || :NEW.first_name || ' ' || :NEW.last_name || ' status change',
                    'SCHEDULED', 'CANCELLED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                    'Automatic cascade update via trigger'
                FROM appointments 
                WHERE patient_id = :NEW.patient_id 
                AND status = 'CANCELLED'
                AND modified_date = SYSDATE;
            END IF;
            
            -- Log medical record changes
            IF v_affected_records > 0 THEN
                INSERT INTO audit_medical_records (
                    audit_id, record_id, operation_type, operation_timestamp,
                    user_id, session_id, ip_address, application_name,
                    change_reason, change_justification, change_summary,
                    old_record_status, new_record_status, source_system, data_lineage, transformation_notes
                )
                SELECT 
                    seq_audit_id.NEXTVAL, record_id, 'UPDATE', SYSTIMESTAMP,
                    USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                    SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                    'Patient status change', 'Automatic archival due to patient status change',
                    'Medical record automatically archived due to patient ' || :NEW.first_name || ' ' || :NEW.last_name || ' status change',
                    'ACTIVE', 'ARCHIVED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                    'Automatic cascade update via trigger'
                FROM medical_records 
                WHERE patient_id = :NEW.patient_id 
                AND record_status = 'ARCHIVED'
                AND modified_date = SYSDATE;
            END IF;
        END IF;
        
        -- Log the cascade effect in user actions
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'CASCADE_UPDATE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'PATIENTS', 'trg_cascade_patient_status',
            'Patient ' || :NEW.patient_id || ' status changed to ' || :NEW.status || 
            ', affecting ' || v_affected_appointments || ' appointments and ' || 
            v_affected_records || ' medical records', 'SUCCESS', 'MULTIPLE', 'UPDATE',
            v_affected_appointments + v_affected_records, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- APPOINTMENT VALIDATION TRIGGER
-- Business rule validation for appointments
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_appointment_validation
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
DECLARE
    v_doctor_status VARCHAR2(20);
    v_patient_status VARCHAR2(20);
    v_doctor_exists NUMBER;
    v_patient_exists NUMBER;
BEGIN
    -- Check if doctor exists and is active
    SELECT COUNT(*), status INTO v_doctor_exists, v_doctor_status
    FROM doctors 
    WHERE doctor_id = :NEW.doctor_id;
    
    IF v_doctor_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Doctor ID ' || :NEW.doctor_id || ' does not exist');
    ELSIF v_doctor_status != 'ACTIVE' THEN
        RAISE_APPLICATION_ERROR(-20002, 'Doctor ID ' || :NEW.doctor_id || ' is not active (Status: ' || v_doctor_status || ')');
    END IF;
    
    -- Check if patient exists and is active
    SELECT COUNT(*), status INTO v_patient_exists, v_patient_status
    FROM patients 
    WHERE patient_id = :NEW.patient_id;
    
    IF v_patient_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Patient ID ' || :NEW.patient_id || ' does not exist');
    ELSIF v_patient_status != 'ACTIVE' THEN
        RAISE_APPLICATION_ERROR(-20004, 'Patient ID ' || :NEW.patient_id || ' is not active (Status: ' || v_patient_status || ')');
    END IF;
    
    -- Check appointment time is in the future
    IF :NEW.appointment_date <= SYSDATE THEN
        RAISE_APPLICATION_ERROR(-20005, 'Appointment date must be in the future');
    END IF;
    
    -- Check for double-booking (same doctor, same time)
    IF UPDATING THEN
        IF EXISTS (
            SELECT 1 FROM appointments 
            WHERE doctor_id = :NEW.doctor_id 
            AND appointment_id != :NEW.appointment_id
            AND appointment_date = :NEW.appointment_date
            AND status IN ('SCHEDULED', 'CONFIRMED')
        ) THEN
            RAISE_APPLICATION_ERROR(-20006, 'Doctor is already booked at this time');
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1 FROM appointments 
            WHERE doctor_id = :NEW.doctor_id 
            AND appointment_date = :NEW.appointment_date
            AND status IN ('SCHEDULED', 'CONFIRMED')
        ) THEN
            RAISE_APPLICATION_ERROR(-20006, 'Doctor is already booked at this time');
        END IF;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
/

-- =====================================================
-- END OF CASCADE TRIGGERS
-- =====================================================

-- =====================================================
-- MEDICAL RECORD STATUS CASCADE TRIGGER
-- When medical record status changes, update related prescriptions
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_medical_record_status
AFTER UPDATE OF record_status ON medical_records
FOR EACH ROW
WHEN (OLD.record_status != NEW.record_status)
DECLARE
    v_affected_prescriptions NUMBER := 0;
    v_audit_id NUMBER;
BEGIN
    -- If medical record is archived or deleted, update related prescriptions
    IF :NEW.record_status IN ('ARCHIVED', 'DELETED') THEN
        UPDATE prescriptions 
        SET status = 'CANCELLED',
            modified_date = SYSDATE,
            modified_by = USER
        WHERE record_id = :NEW.record_id 
        AND status = 'ACTIVE';
        
        v_affected_prescriptions := SQL%ROWCOUNT;
        
        -- Log the cascade effect
        IF v_affected_prescriptions > 0 THEN
            SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
            
            INSERT INTO audit_prescriptions (
                audit_id, prescription_id, operation_type, operation_timestamp,
                user_id, session_id, ip_address, application_name,
                change_reason, change_justification, change_summary,
                old_status, new_status, source_system, data_lineage, transformation_notes
            )
            SELECT 
                v_audit_id, prescription_id, 'UPDATE', SYSTIMESTAMP,
                USER, SYS_CONTEXT('USERENV', 'SESSIONID'), 
                SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 'CASCADE_TRIGGER',
                'Medical record status change', 'Automatic cancellation due to medical record status change',
                'Prescription automatically cancelled due to medical record ' || :NEW.record_id || ' status change to ' || :NEW.record_status,
                'ACTIVE', 'CANCELLED', 'HEALTHCARE_SYSTEM', 'CASCADE_UPDATE', 
                'Automatic cascade update via trigger'
            FROM prescriptions 
            WHERE record_id = :NEW.record_id 
            AND status = 'CANCELLED'
            AND modified_date = SYSDATE;
        END IF;
        
        -- Log the cascade effect in user actions
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'CASCADE_UPDATE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'MEDICAL_RECORDS', 'trg_cascade_medical_record_status',
            'Medical record ' || :NEW.record_id || ' status changed to ' || :NEW.record_status || 
            ', affecting ' || v_affected_prescriptions || ' prescriptions', 'SUCCESS', 'PRESCRIPTIONS', 'UPDATE',
            v_affected_prescriptions, 'HEALTHCARE_SYSTEM', 'AUTOMATIC_CASCADE'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- PRESCRIPTION STATUS CASCADE TRIGGER
-- When prescription status changes, log the change for tracking
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_prescription_status
AFTER UPDATE OF status ON prescriptions
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_audit_id NUMBER;
BEGIN
    -- Log prescription status changes for compliance tracking
    IF :NEW.status IN ('FILLED', 'EXPIRED', 'CANCELLED') THEN
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'PRESCRIPTION_STATUS_CHANGE', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'PRESCRIPTIONS', 'trg_cascade_prescription_status',
            'Prescription ' || :NEW.prescription_id || ' status changed from ' || :OLD.status || ' to ' || :NEW.status, 
            'SUCCESS', 'PRESCRIPTIONS', 'UPDATE',
            1, 'HEALTHCARE_SYSTEM', 'COMPLIANCE_TRACKING'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- LAB RESULT STATUS CASCADE TRIGGER
-- When lab result status changes, log critical results
-- =====================================================

CREATE OR REPLACE TRIGGER trg_cascade_lab_result_status
AFTER UPDATE OF status ON lab_results
FOR EACH ROW
WHEN (OLD.status != NEW.status)
DECLARE
    v_audit_id NUMBER;
BEGIN
    -- Log critical lab results for immediate attention
    IF :NEW.status IN ('ABNORMAL', 'CRITICAL') THEN
        INSERT INTO audit_user_actions (
            audit_id, user_id, session_id, action_type, action_timestamp,
            ip_address, application_name, module_name, function_name,
            action_description, action_result, table_name, operation_type,
            rows_affected, source_system, data_lineage
        ) VALUES (
            seq_audit_id.NEXTVAL, USER, SYS_CONTEXT('USERENV', 'SESSIONID'),
            'LAB_RESULT_ALERT', SYSTIMESTAMP, SYS_CONTEXT('USERENV', 'IP_ADDRESS'),
            'CASCADE_TRIGGER', 'LAB_RESULTS', 'trg_cascade_lab_result_status',
            'CRITICAL ALERT: Lab result ' || :NEW.lab_id || ' status changed to ' || :NEW.status || 
            ' for patient ' || :NEW.patient_id, 'SUCCESS', 'LAB_RESULTS', 'UPDATE',
            1, 'HEALTHCARE_SYSTEM', 'CRITICAL_ALERT'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Cascade trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- END OF ALL CASCADE TRIGGERS
-- =====================================================
