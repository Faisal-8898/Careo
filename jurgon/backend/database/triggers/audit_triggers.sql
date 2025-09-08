-- =====================================================
-- Healthcare Patient Record Management System
-- Audit Triggers for Automatic Provenance Tracking
-- =====================================================
-- This file contains triggers that automatically populate audit tables
-- whenever data changes occur in the core healthcare tables
-- =====================================================

-- SQL*Plus settings for proper execution
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;
SET ECHO OFF;
SET VERIFY OFF;
SET SERVEROUTPUT ON;

-- =====================================================
-- 1. USERS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get current user session info with fallbacks
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    -- Insert audit record
    INSERT INTO audit_users (
        audit_id,
        user_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_email,
        old_password_hash,
        old_user_type,
        old_created_date,
        new_email,
        new_password_hash,
        new_user_type,
        new_created_date,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.user_id, :OLD.user_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.email,
        :OLD.password_hash,
        :OLD.user_type,
        :OLD.created_date,
        :NEW.email,
        :NEW.password_hash,
        :NEW.user_type,
        :NEW.created_date,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New user registration'
            WHEN v_operation_type = 'UPDATE' THEN 'User information updated'
            WHEN v_operation_type = 'DELETE' THEN 'User account deleted'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        -- This ensures audit failures don't prevent core operations
        DBMS_OUTPUT.PUT_LINE('Audit trigger error for users table: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 2. PATIENTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_patients (
        audit_id,
        patient_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_user_id,
        old_first_name,
        old_last_name,
        old_date_of_birth,
        old_gender,
        old_blood_type,
        old_contact_phone,
        old_address_line1,
        old_address_line2,
        old_city,
        old_state,
        old_postal_code,
        old_country,
        old_emergency_contact_name,
        old_emergency_contact_phone,
        old_emergency_contact_relationship,
        old_medical_history_summary,
        old_allergies,
        new_user_id,
        new_first_name,
        new_last_name,
        new_date_of_birth,
        new_gender,
        new_blood_type,
        new_contact_phone,
        new_address_line1,
        new_address_line2,
        new_city,
        new_state,
        new_postal_code,
        new_country,
        new_emergency_contact_name,
        new_emergency_contact_phone,
        new_emergency_contact_relationship,
        new_medical_history_summary,
        new_allergies,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.patient_id, :OLD.patient_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.user_id, :OLD.first_name, :OLD.last_name, :OLD.date_of_birth,
        :OLD.gender, :OLD.blood_type, :OLD.contact_phone, :OLD.address_line1,
        :OLD.address_line2, :OLD.city, :OLD.state, :OLD.postal_code,
        :OLD.country, :OLD.emergency_contact_name, :OLD.emergency_contact_phone,
        :OLD.emergency_contact_relationship, :OLD.medical_history_summary, :OLD.allergies,
        :NEW.user_id, :NEW.first_name, :NEW.last_name, :NEW.date_of_birth,
        :NEW.gender, :NEW.blood_type, :NEW.contact_phone, :NEW.address_line1,
        :NEW.address_line2, :NEW.city, :NEW.state, :NEW.postal_code,
        :NEW.country, :NEW.emergency_contact_name, :NEW.emergency_contact_phone,
        :NEW.emergency_contact_relationship, :NEW.medical_history_summary, :NEW.allergies,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New patient registration'
            WHEN v_operation_type = 'UPDATE' THEN 'Patient profile updated'
            WHEN v_operation_type = 'DELETE' THEN 'Patient record deleted'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error for patients table: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 3. DOCTORS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_doctors
AFTER INSERT OR UPDATE OR DELETE ON doctors
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_doctors (
        audit_id,
        doctor_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_user_id,
        old_first_name,
        old_last_name,
        old_specialization_id,
        old_department_id,
        old_medical_degree,
        old_university,
        old_experience_years,
        old_contact_phone,
        new_user_id,
        new_first_name,
        new_last_name,
        new_specialization_id,
        new_department_id,
        new_medical_degree,
        new_university,
        new_experience_years,
        new_contact_phone,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.doctor_id, :OLD.doctor_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.user_id, :OLD.first_name, :OLD.last_name, :OLD.specialization_id,
        :OLD.department_id, :OLD.medical_degree, :OLD.university, 
        :OLD.experience_years, :OLD.contact_phone,
        :NEW.user_id, :NEW.first_name, :NEW.last_name, :NEW.specialization_id,
        :NEW.department_id, :NEW.medical_degree, :NEW.university, 
        :NEW.experience_years, :NEW.contact_phone,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New doctor added to system'
            WHEN v_operation_type = 'UPDATE' THEN 'Doctor information updated'
            WHEN v_operation_type = 'DELETE' THEN 'Doctor removed from system'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error for doctors table: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 4. NURSES TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_nurses
AFTER INSERT OR UPDATE OR DELETE ON nurses
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_nurses (
        audit_id,
        nurse_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_user_id,
        old_first_name,
        old_last_name,
        old_department_id,
        old_nursing_degree,
        old_experience_years,
        old_contact_phone,
        new_user_id,
        new_first_name,
        new_last_name,
        new_department_id,
        new_nursing_degree,
        new_experience_years,
        new_contact_phone,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.nurse_id, :OLD.nurse_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.user_id, :OLD.first_name, :OLD.last_name, :OLD.department_id,
        :OLD.nursing_degree, :OLD.experience_years, :OLD.contact_phone,
        :NEW.user_id, :NEW.first_name, :NEW.last_name, :NEW.department_id,
        :NEW.nursing_degree, :NEW.experience_years, :NEW.contact_phone,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New nurse added to system'
            WHEN v_operation_type = 'UPDATE' THEN 'Nurse information updated'
            WHEN v_operation_type = 'DELETE' THEN 'Nurse removed from system'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 5. APPOINTMENTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_appointments (
        audit_id,
        appointment_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_patient_id,
        old_doctor_id,
        old_appointment_date,
        old_appointment_time,
        old_appointment_type,
        old_reason,
        old_notes,
        old_appointment_status,
        new_patient_id,
        new_doctor_id,
        new_appointment_date,
        new_appointment_time,
        new_appointment_type,
        new_reason,
        new_notes,
        new_appointment_status,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.appointment_id, :OLD.appointment_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.patient_id, :OLD.doctor_id, :OLD.appointment_date, :OLD.appointment_time,
        :OLD.appointment_type, :OLD.reason, :OLD.notes, :OLD.appointment_status,
        :NEW.patient_id, :NEW.doctor_id, :NEW.appointment_date, :NEW.appointment_time,
        :NEW.appointment_type, :NEW.reason, :NEW.notes, :NEW.appointment_status,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New appointment scheduled'
            WHEN v_operation_type = 'UPDATE' AND :OLD.appointment_status != :NEW.appointment_status 
                THEN 'Appointment status changed from ' || :OLD.appointment_status || ' to ' || :NEW.appointment_status
            WHEN v_operation_type = 'UPDATE' THEN 'Appointment details updated'
            WHEN v_operation_type = 'DELETE' THEN 'Appointment cancelled/deleted'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 6. MEDICAL RECORDS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_medical_records
AFTER INSERT OR UPDATE OR DELETE ON medical_records
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_medical_records (
        audit_id,
        record_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_patient_id,
        old_doctor_id,
        old_nurse_id,
        old_nurse_task,
        old_appointment_id,
        old_record_type,
        old_chief_complaint,
        old_symptoms,
        old_physical_examination,
        old_diagnosis,
        old_treatment_plan,
        old_recommendations,
        old_critical_status,
        old_critical_notes,
        old_follow_up_date,
        old_follow_up_notes,
        new_patient_id,
        new_doctor_id,
        new_nurse_id,
        new_nurse_task,
        new_appointment_id,
        new_record_type,
        new_chief_complaint,
        new_symptoms,
        new_physical_examination,
        new_diagnosis,
        new_treatment_plan,
        new_recommendations,
        new_critical_status,
        new_critical_notes,
        new_follow_up_date,
        new_follow_up_notes,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.record_id, :OLD.record_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.patient_id, :OLD.doctor_id, :OLD.nurse_id, :OLD.nurse_task,
        :OLD.appointment_id, :OLD.record_type, :OLD.chief_complaint,
        :OLD.symptoms, :OLD.physical_examination, :OLD.diagnosis,
        :OLD.treatment_plan, :OLD.recommendations, :OLD.critical_status,
        :OLD.critical_notes, :OLD.follow_up_date, :OLD.follow_up_notes,
        :NEW.patient_id, :NEW.doctor_id, :NEW.nurse_id, :NEW.nurse_task,
        :NEW.appointment_id, :NEW.record_type, :NEW.chief_complaint,
        :NEW.symptoms, :NEW.physical_examination, :NEW.diagnosis,
        :NEW.treatment_plan, :NEW.recommendations, :NEW.critical_status,
        :NEW.critical_notes, :NEW.follow_up_date, :NEW.follow_up_notes,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New medical record created'
            WHEN v_operation_type = 'UPDATE' AND :OLD.critical_status != :NEW.critical_status 
                THEN 'Critical status changed from ' || :OLD.critical_status || ' to ' || :NEW.critical_status
            WHEN v_operation_type = 'UPDATE' THEN 'Medical record updated'
            WHEN v_operation_type = 'DELETE' THEN 'Medical record deleted'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 7. PRESCRIPTIONS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_prescriptions
AFTER INSERT OR UPDATE OR DELETE ON prescriptions
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_prescriptions (
        audit_id,
        prescription_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_record_id,
        old_prescription_date,
        old_general_instructions,
        new_record_id,
        new_prescription_date,
        new_general_instructions,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.prescription_id, :OLD.prescription_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.record_id, :OLD.prescription_date, :OLD.general_instructions,
        :NEW.record_id, :NEW.prescription_date, :NEW.general_instructions,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New prescription created'
            WHEN v_operation_type = 'UPDATE' THEN 'Prescription updated'
            WHEN v_operation_type = 'DELETE' THEN 'Prescription deleted'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 8. PRESCRIPTION MEDICINES TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_prescription_medicines
AFTER INSERT OR UPDATE OR DELETE ON prescription_medicines
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_prescription_medicines (
        audit_id,
        medicine_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_prescription_id,
        old_medicine_name,
        old_dosage,
        old_frequency,
        old_duration,
        old_instructions,
        new_prescription_id,
        new_medicine_name,
        new_dosage,
        new_frequency,
        new_duration,
        new_instructions,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.medicine_id, :OLD.medicine_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.prescription_id, :OLD.medicine_name, :OLD.dosage,
        :OLD.frequency, :OLD.duration, :OLD.instructions,
        :NEW.prescription_id, :NEW.medicine_name, :NEW.dosage,
        :NEW.frequency, :NEW.duration, :NEW.instructions,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'Medicine added to prescription'
            WHEN v_operation_type = 'UPDATE' THEN 'Medicine details updated'
            WHEN v_operation_type = 'DELETE' THEN 'Medicine removed from prescription'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- 9. REFERENCE TABLES AUDIT TRIGGERS
-- =====================================================

-- Specializations audit trigger
CREATE OR REPLACE TRIGGER trg_audit_specializations
AFTER INSERT OR UPDATE OR DELETE ON specializations
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_specializations (
        audit_id,
        specialization_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_specialization_name,
        old_description,
        new_specialization_name,
        new_description,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.specialization_id, :OLD.specialization_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.specialization_name, :OLD.description,
        :NEW.specialization_name, :NEW.description,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New specialization added'
            WHEN v_operation_type = 'UPDATE' THEN 'Specialization updated'
            WHEN v_operation_type = 'DELETE' THEN 'Specialization removed'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- Departments audit trigger
CREATE OR REPLACE TRIGGER trg_audit_departments
AFTER INSERT OR UPDATE OR DELETE ON departments
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_departments (
        audit_id,
        department_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_department_name,
        old_location,
        new_department_name,
        new_location,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.department_id, :OLD.department_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.department_name, :OLD.location,
        :NEW.department_name, :NEW.location,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New department added'
            WHEN v_operation_type = 'UPDATE' THEN 'Department updated'
            WHEN v_operation_type = 'DELETE' THEN 'Department removed'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- Admins audit trigger
CREATE OR REPLACE TRIGGER trg_audit_admins
AFTER INSERT OR UPDATE OR DELETE ON admins
FOR EACH ROW
DECLARE
    v_operation_type VARCHAR2(10);
    v_operator_user_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
BEGIN
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSE
        v_operation_type := 'DELETE';
    END IF;
    
    v_operator_user_id := COALESCE(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER, 'SYSTEM');
    v_ip_address := COALESCE(v_ip_address, 'LOCALHOST');
    
    INSERT INTO audit_admins (
        audit_id,
        admin_id,
        operation_type,
        operation_timestamp,
        operator_user_id,
        ip_address,
        old_user_id,
        old_first_name,
        old_last_name,
        old_department_id,
        old_employee_id,
        old_contact_phone,
        old_access_level,
        new_user_id,
        new_first_name,
        new_last_name,
        new_department_id,
        new_employee_id,
        new_contact_phone,
        new_access_level,
        change_reason
    ) VALUES (
        seq_audit_id.NEXTVAL,
        COALESCE(:NEW.admin_id, :OLD.admin_id),
        v_operation_type,
        SYSTIMESTAMP,
        v_operator_user_id,
        v_ip_address,
        :OLD.user_id, :OLD.first_name, :OLD.last_name, :OLD.department_id,
        :OLD.employee_id, :OLD.contact_phone, :OLD.access_level,
        :NEW.user_id, :NEW.first_name, :NEW.last_name, :NEW.department_id,
        :NEW.employee_id, :NEW.contact_phone, :NEW.access_level,
        CASE 
            WHEN v_operation_type = 'INSERT' THEN 'New admin added to system'
            WHEN v_operation_type = 'UPDATE' THEN 'Admin information updated'
            WHEN v_operation_type = 'DELETE' THEN 'Admin removed from system'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail main transaction
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
        NULL;
END;
/

-- =====================================================
-- TRIGGER SUMMARY
-- =====================================================

PROMPT =====================================================
PROMPT Healthcare Audit Triggers Created Successfully!
PROMPT =====================================================
PROMPT Total Triggers: 11
PROMPT - Users audit trigger
PROMPT - Patients audit trigger
PROMPT - Doctors audit trigger
PROMPT - Nurses audit trigger
PROMPT - Admins audit trigger
PROMPT - Appointments audit trigger
PROMPT - Medical Records audit trigger
PROMPT - Prescriptions audit trigger
PROMPT - Prescription Medicines audit trigger
PROMPT - Specializations audit trigger
PROMPT - Departments audit trigger
PROMPT =====================================================
PROMPT All data changes will now be automatically audited
PROMPT =====================================================

EXIT;
