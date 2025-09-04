-- =====================================================
-- Healthcare Database Audit Triggers
-- Automatic Provenance Tracking for All Core Tables
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER trg_audit_patients;
DROP TRIGGER trg_audit_doctors;
DROP TRIGGER trg_audit_nurses;
DROP TRIGGER trg_audit_admins;
DROP TRIGGER trg_audit_medications;
DROP TRIGGER trg_audit_medical_records;
DROP TRIGGER trg_audit_prescriptions;
DROP TRIGGER trg_audit_lab_results;
DROP TRIGGER trg_audit_appointments;
DROP TRIGGER trg_audit_specializations;
DROP TRIGGER trg_audit_departments;

-- =====================================================
-- PATIENTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context (in real application, get from application context)
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.first_name != :OLD.first_name THEN
            v_affected_fields := v_affected_fields || 'first_name,';
        END IF;
        IF :NEW.last_name != :OLD.last_name THEN
            v_affected_fields := v_affected_fields || 'last_name,';
        END IF;
        IF :NEW.date_of_birth != :OLD.date_of_birth THEN
            v_affected_fields := v_affected_fields || 'date_of_birth,';
        END IF;
        IF :NEW.gender != :OLD.gender THEN
            v_affected_fields := v_affected_fields || 'gender,';
        END IF;
        IF :NEW.blood_type != :OLD.blood_type THEN
            v_affected_fields := v_affected_fields || 'blood_type,';
        END IF;
        IF :NEW.contact_phone != :OLD.contact_phone THEN
            v_affected_fields := v_affected_fields || 'contact_phone,';
        END IF;
        -- contact_email field removed, now using email for login
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        IF :NEW.email != :OLD.email THEN
            v_affected_fields := v_affected_fields || 'email,';
        END IF;
        IF :NEW.last_login_date != :OLD.last_login_date THEN
            v_affected_fields := v_affected_fields || 'last_login_date,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Patient ' || COALESCE(:NEW.patient_id, :OLD.patient_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New patient ' || :NEW.patient_id || ' created: ' || 
                           :NEW.first_name || ' ' || :NEW.last_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Patient ' || :OLD.patient_id || ' deleted: ' || 
                           :OLD.first_name || ' ' || :OLD.last_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_patients (
        audit_id, patient_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values (for UPDATE/DELETE)
        old_first_name, old_last_name, old_date_of_birth, old_gender, old_blood_type,
        old_contact_phone, old_email, old_password_hash, old_last_login_date,
        old_address_line1, old_address_line2, old_city, old_state, old_postal_code, old_country, 
        old_emergency_contact_name, old_emergency_contact_phone, old_emergency_contact_relationship,
        old_medical_history_summary, old_allergies, old_status,
        -- New values (for INSERT/UPDATE)
        new_first_name, new_last_name, new_date_of_birth, new_gender, new_blood_type,
        new_contact_phone, new_email, new_password_hash, new_last_login_date,
        new_address_line1, new_address_line2, new_city, new_state, new_postal_code, new_country, 
        new_emergency_contact_name, new_emergency_contact_phone, new_emergency_contact_relationship,
        new_medical_history_summary, new_allergies, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.patient_id, :OLD.patient_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.first_name, :OLD.last_name, :OLD.date_of_birth, :OLD.gender, :OLD.blood_type,
        :OLD.contact_phone, :OLD.email, :OLD.password_hash, :OLD.last_login_date,
        :OLD.address_line1, :OLD.address_line2, :OLD.city, :OLD.state, :OLD.postal_code, :OLD.country, 
        :OLD.emergency_contact_name, :OLD.emergency_contact_phone, :OLD.emergency_contact_relationship,
        :OLD.medical_history_summary, :OLD.allergies, :OLD.status,
        -- New values
        :NEW.first_name, :NEW.last_name, :NEW.date_of_birth, :NEW.gender, :NEW.blood_type,
        :NEW.contact_phone, :NEW.email, :NEW.password_hash, :NEW.last_login_date,
        :NEW.address_line1, :NEW.address_line2, :NEW.city, :NEW.state, :NEW.postal_code, :NEW.country, 
        :NEW.emergency_contact_name, :NEW.emergency_contact_phone, :NEW.emergency_contact_relationship,
        :NEW.medical_history_summary, :NEW.allergies, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- DOCTORS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_doctors
AFTER INSERT OR UPDATE OR DELETE ON doctors
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.first_name != :OLD.first_name THEN
            v_affected_fields := v_affected_fields || 'first_name,';
        END IF;
        IF :NEW.last_name != :OLD.last_name THEN
            v_affected_fields := v_affected_fields || 'last_name,';
        END IF;
        IF :NEW.specialization_id != :OLD.specialization_id THEN
            v_affected_fields := v_affected_fields || 'specialization_id,';
        END IF;
        IF :NEW.license_number != :OLD.license_number THEN
            v_affected_fields := v_affected_fields || 'license_number,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Doctor ' || COALESCE(:NEW.doctor_id, :OLD.doctor_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New doctor ' || :NEW.doctor_id || ' created: ' || 
                           :NEW.first_name || ' ' || :NEW.last_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Doctor ' || :OLD.doctor_id || ' deleted: ' || 
                           :OLD.first_name || ' ' || :OLD.last_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_doctors (
        audit_id, doctor_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_first_name, old_last_name, old_specialization_id, old_department_id,
        old_license_number, old_medical_degree, old_university, old_graduation_year,
        old_experience_years, old_contact_phone, old_email, old_password_hash, old_last_login_date,
        old_availability_schedule, old_status,
        -- New values
        new_first_name, new_last_name, new_specialization_id, new_department_id,
        new_license_number, new_medical_degree, new_university, new_graduation_year,
        new_experience_years, new_contact_phone, new_email, new_password_hash, new_last_login_date,
        new_availability_schedule, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.doctor_id, :OLD.doctor_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.first_name, :OLD.last_name, :OLD.specialization_id, :OLD.department_id,
        :OLD.license_number, :OLD.medical_degree, :OLD.university, :OLD.graduation_year,
        :OLD.experience_years, :OLD.contact_phone, :OLD.email, :OLD.password_hash, :OLD.last_login_date,
        :OLD.availability_schedule, :OLD.status,
        -- New values
        :NEW.first_name, :NEW.last_name, :NEW.specialization_id, :NEW.department_id,
        :NEW.license_number, :NEW.medical_degree, :NEW.university, :NEW.graduation_year,
        :NEW.experience_years, :NEW.contact_phone, :NEW.email, :NEW.password_hash, :NEW.last_login_date,
        :NEW.availability_schedule, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- MEDICATIONS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_medications
AFTER INSERT OR UPDATE OR DELETE ON medications
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.generic_name != :OLD.generic_name THEN
            v_affected_fields := v_affected_fields || 'generic_name,';
        END IF;
        IF :NEW.brand_name != :OLD.brand_name THEN
            v_affected_fields := v_affected_fields || 'brand_name,';
        END IF;
        IF :NEW.strength != :OLD.strength THEN
            v_affected_fields := v_affected_fields || 'strength,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Medication ' || COALESCE(:NEW.medication_id, :OLD.medication_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New medication ' || :NEW.medication_id || ' created: ' || 
                           :NEW.generic_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Medication ' || :OLD.medication_id || ' deleted: ' || 
                           :OLD.generic_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_medications (
        audit_id, medication_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_generic_name, old_brand_name, old_dosage_form, old_strength, old_unit,
        old_manufacturer, old_description, old_contraindications, old_side_effects,
        old_storage_instructions, old_prescription_required, old_controlled_substance, old_status,
        -- New values
        new_generic_name, new_brand_name, new_dosage_form, new_strength, new_unit,
        new_manufacturer, new_description, new_contraindications, new_side_effects,
        new_storage_instructions, new_prescription_required, new_controlled_substance, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.medication_id, :OLD.medication_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.generic_name, :OLD.brand_name, :OLD.dosage_form, :OLD.strength, :OLD.unit,
        :OLD.manufacturer, :OLD.description, :OLD.contraindications, :OLD.side_effects,
        :OLD.storage_instructions, :OLD.prescription_required, :OLD.controlled_substance, :OLD.status,
        -- New values
        :NEW.generic_name, :NEW.brand_name, :NEW.dosage_form, :NEW.strength, :NEW.unit,
        :NEW.manufacturer, :NEW.description, :NEW.contraindications, :NEW.side_effects,
        :NEW.storage_instructions, :NEW.prescription_required, :NEW.controlled_substance, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- END OF AUDIT TRIGGERS
-- =====================================================

-- =====================================================
-- NURSES TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_nurses
AFTER INSERT OR UPDATE OR DELETE ON nurses
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.first_name != :OLD.first_name THEN
            v_affected_fields := v_affected_fields || 'first_name,';
        END IF;
        IF :NEW.last_name != :OLD.last_name THEN
            v_affected_fields := v_affected_fields || 'last_name,';
        END IF;
        IF :NEW.department_id != :OLD.department_id THEN
            v_affected_fields := v_affected_fields || 'department_id,';
        END IF;
        IF :NEW.license_number != :OLD.license_number THEN
            v_affected_fields := v_affected_fields || 'license_number,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Nurse ' || COALESCE(:NEW.nurse_id, :OLD.nurse_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New nurse ' || :NEW.nurse_id || ' created: ' || 
                           :NEW.first_name || ' ' || :NEW.last_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Nurse ' || :OLD.nurse_id || ' deleted: ' || 
                           :OLD.first_name || ' ' || :OLD.last_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_nurses (
        audit_id, nurse_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_first_name, old_last_name, old_department_id, old_license_number,
        old_nursing_degree, old_university, old_graduation_year, old_experience_years,
        old_contact_phone, old_email, old_password_hash, old_last_login_date, old_shift_preference, old_availability_schedule, old_status,
        -- New values
        new_first_name, new_last_name, new_department_id, new_license_number,
        new_nursing_degree, new_university, new_graduation_year, new_experience_years,
        new_contact_phone, new_email, new_password_hash, new_last_login_date, new_shift_preference, new_availability_schedule, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.nurse_id, :OLD.nurse_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.first_name, :OLD.last_name, :OLD.department_id, :OLD.license_number,
        :OLD.nursing_degree, :OLD.university, :OLD.graduation_year, :OLD.experience_years,
        :OLD.contact_phone, :OLD.email, :OLD.password_hash, :OLD.last_login_date, :OLD.shift_preference, :OLD.availability_schedule, :OLD.status,
        -- New values
        :NEW.first_name, :NEW.last_name, :NEW.department_id, :NEW.license_number,
        :NEW.nursing_degree, :NEW.university, :NEW.graduation_year, :NEW.experience_years,
        :NEW.contact_phone, :NEW.email, :NEW.password_hash, :NEW.last_login_date, :NEW.shift_preference, :NEW.availability_schedule, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- ADMINS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_admins
AFTER INSERT OR UPDATE OR DELETE ON admins
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.first_name != :OLD.first_name THEN
            v_affected_fields := v_affected_fields || 'first_name,';
        END IF;
        IF :NEW.last_name != :OLD.last_name THEN
            v_affected_fields := v_affected_fields || 'last_name,';
        END IF;
        IF :NEW.department_id != :OLD.department_id THEN
            v_affected_fields := v_affected_fields || 'department_id,';
        END IF;
        IF :NEW.employee_id != :OLD.employee_id THEN
            v_affected_fields := v_affected_fields || 'employee_id,';
        END IF;
        IF :NEW.access_level != :OLD.access_level THEN
            v_affected_fields := v_affected_fields || 'access_level,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Admin ' || COALESCE(:NEW.admin_id, :OLD.admin_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New admin ' || :NEW.admin_id || ' created: ' || 
                           :NEW.first_name || ' ' || :NEW.last_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Admin ' || :OLD.admin_id || ' deleted: ' || 
                           :OLD.first_name || ' ' || :OLD.last_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_admins (
        audit_id, admin_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_first_name, old_last_name, old_department_id, old_employee_id,
        old_contact_phone, old_email, old_password_hash, old_last_login_date, old_access_level, old_status,
        -- New values
        new_first_name, new_last_name, new_department_id, new_employee_id,
        new_contact_phone, new_email, new_password_hash, new_last_login_date, new_access_level, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.admin_id, :OLD.admin_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.first_name, :OLD.last_name, :OLD.department_id, :OLD.employee_id,
        :OLD.contact_phone, :OLD.email, :OLD.password_hash, :OLD.last_login_date, :OLD.access_level, :OLD.status,
        -- New values
        :NEW.first_name, :NEW.last_name, :NEW.department_id, :NEW.employee_id,
        :NEW.contact_phone, :NEW.email, :NEW.password_hash, :NEW.last_login_date, :NEW.access_level, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- MEDICAL RECORDS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_medical_records
AFTER INSERT OR UPDATE OR DELETE ON medical_records
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.record_type != :OLD.record_type THEN
            v_affected_fields := v_affected_fields || 'record_type,';
        END IF;
        IF :NEW.chief_complaint != :OLD.chief_complaint THEN
            v_affected_fields := v_affected_fields || 'chief_complaint,';
        END IF;
        IF :NEW.record_status != :OLD.record_status THEN
            v_affected_fields := v_affected_fields || 'record_status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Medical record ' || COALESCE(:NEW.record_id, :OLD.record_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New medical record ' || :NEW.record_id || ' created for patient ' || :NEW.patient_id;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Medical record ' || :OLD.record_id || ' deleted for patient ' || :OLD.patient_id;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_medical_records (
        audit_id, record_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_patient_id, old_doctor_id, old_visit_date, old_record_type,
        old_chief_complaint, old_symptoms, old_physical_examination, old_diagnosis,
        old_treatment_plan, old_recommendations, old_follow_up_date, old_follow_up_notes, old_record_status,
        -- New values
        new_patient_id, new_doctor_id, new_visit_date, new_record_type,
        new_chief_complaint, new_symptoms, new_physical_examination, new_diagnosis,
        new_treatment_plan, new_recommendations, new_follow_up_date, new_follow_up_notes, new_record_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.record_id, :OLD.record_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.patient_id, :OLD.doctor_id, :OLD.visit_date, :OLD.record_type,
        :OLD.chief_complaint, :OLD.symptoms, :OLD.physical_examination, :OLD.diagnosis,
        :OLD.treatment_plan, :OLD.recommendations, :OLD.follow_up_date, :OLD.follow_up_notes, :OLD.record_status,
        -- New values
        :NEW.patient_id, :NEW.doctor_id, :NEW.visit_date, :NEW.record_type,
        :NEW.chief_complaint, :NEW.symptoms, :NEW.physical_examination, :NEW.diagnosis,
        :NEW.treatment_plan, :NEW.recommendations, :NEW.follow_up_date, :NEW.follow_up_notes, :NEW.record_status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- PRESCRIPTIONS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_prescriptions
AFTER INSERT OR UPDATE OR DELETE ON prescriptions
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.dosage != :OLD.dosage THEN
            v_affected_fields := v_affected_fields || 'dosage,';
        END IF;
        IF :NEW.frequency != :OLD.frequency THEN
            v_affected_fields := v_affected_fields || 'frequency,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Prescription ' || COALESCE(:NEW.prescription_id, :OLD.prescription_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New prescription ' || :NEW.prescription_id || ' created for record ' || :NEW.record_id;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Prescription ' || :OLD.prescription_id || ' deleted for record ' || :OLD.record_id;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_prescriptions (
        audit_id, prescription_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_record_id, old_medication_id, old_dosage, old_frequency, old_duration,
        old_instructions, old_quantity_prescribed, old_refills_allowed, old_refills_remaining,
        old_prescription_date, old_expiry_date, old_status,
        -- New values
        new_record_id, new_medication_id, new_dosage, new_frequency, new_duration,
        new_instructions, new_quantity_prescribed, new_refills_allowed, new_refills_remaining,
        new_prescription_date, new_expiry_date, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.prescription_id, :OLD.prescription_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.record_id, :OLD.medication_id, :OLD.dosage, :OLD.frequency, :OLD.duration,
        :OLD.instructions, :OLD.quantity_prescribed, :OLD.refills_allowed, :OLD.refills_remaining,
        :OLD.prescription_date, :OLD.expiry_date, :OLD.status,
        -- New values
        :NEW.record_id, :NEW.medication_id, :NEW.dosage, :NEW.frequency, :NEW.duration,
        :NEW.instructions, :NEW.quantity_prescribed, :NEW.refills_allowed, :NEW.refills_remaining,
        :NEW.prescription_date, :NEW.expiry_date, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- LAB RESULTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_lab_results
AFTER INSERT OR UPDATE OR DELETE ON lab_results
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.test_type != :OLD.test_type THEN
            v_affected_fields := v_affected_fields || 'test_type,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Lab result ' || COALESCE(:NEW.lab_id, :OLD.lab_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New lab result ' || :NEW.lab_id || ' created for patient ' || :NEW.patient_id;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Lab result ' || :OLD.lab_id || ' deleted for patient ' || :OLD.patient_id;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_lab_results (
        audit_id, lab_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_patient_id, old_doctor_id, old_test_type, old_test_date, old_results,
        old_normal_range, old_units, old_interpretation, old_lab_technician, old_lab_facility, old_status,
        -- New values
        new_patient_id, new_doctor_id, new_test_type, new_test_date, new_results,
        new_normal_range, new_units, new_interpretation, new_lab_technician, new_lab_facility, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.lab_id, :OLD.lab_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.patient_id, :OLD.doctor_id, :OLD.test_type, :OLD.test_date, :OLD.results,
        :OLD.normal_range, :OLD.units, :OLD.interpretation, :OLD.lab_technician, :OLD.lab_facility, :OLD.status,
        -- New values
        :NEW.patient_id, :NEW.doctor_id, :NEW.test_type, :NEW.test_date, :NEW.results,
        :NEW.normal_range, :NEW.units, :NEW.interpretation, :NEW.lab_technician, :NEW.lab_facility, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- APPOINTMENTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.appointment_date != :OLD.appointment_date THEN
            v_affected_fields := v_affected_fields || 'appointment_date,';
        END IF;
        IF :NEW.appointment_type != :OLD.appointment_type THEN
            v_affected_fields := v_affected_fields || 'appointment_type,';
        END IF;
        IF :NEW.status != :OLD.status THEN
            v_affected_fields := v_affected_fields || 'status,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Appointment ' || COALESCE(:NEW.appointment_id, :OLD.appointment_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New appointment ' || :NEW.appointment_id || ' created for patient ' || :NEW.patient_id;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Appointment ' || :OLD.appointment_id || ' deleted for patient ' || :OLD.patient_id;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_appointments (
        audit_id, appointment_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_patient_id, old_doctor_id, old_appointment_date, old_appointment_time,
        old_appointment_type, old_reason, old_notes, old_status,
        -- New values
        new_patient_id, new_doctor_id, new_appointment_date, new_appointment_time,
        new_appointment_type, new_reason, new_notes, new_status,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.appointment_id, :OLD.appointment_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.patient_id, :OLD.doctor_id, :OLD.appointment_date, :OLD.appointment_time,
        :OLD.appointment_type, :OLD.reason, :OLD.notes, :OLD.status,
        -- New values
        :NEW.patient_id, :NEW.doctor_id, :NEW.appointment_date, :NEW.appointment_time,
        :NEW.appointment_type, :NEW.reason, :NEW.notes, :NEW.status,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- SPECIALIZATIONS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_specializations
AFTER INSERT OR UPDATE OR DELETE ON specializations
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.specialization_name != :OLD.specialization_name THEN
            v_affected_fields := v_affected_fields || 'specialization_name,';
        END IF;
        IF :NEW.description != :OLD.description THEN
            v_affected_fields := v_affected_fields || 'description,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Specialization ' || COALESCE(:NEW.specialization_id, :OLD.specialization_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New specialization ' || :NEW.specialization_id || ' created: ' || :NEW.specialization_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Specialization ' || :OLD.specialization_id || ' deleted: ' || :OLD.specialization_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_specializations (
        audit_id, specialization_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_specialization_name, old_description,
        -- New values
        new_specialization_name, new_description,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.specialization_id, :OLD.specialization_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.specialization_name, :OLD.description,
        -- New values
        :NEW.specialization_name, :NEW.description,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- DEPARTMENTS TABLE AUDIT TRIGGER
-- =====================================================

CREATE OR REPLACE TRIGGER trg_audit_departments
AFTER INSERT OR UPDATE OR DELETE ON departments
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
    v_operation_type VARCHAR2(10);
    v_user_id VARCHAR2(50);
    v_session_id VARCHAR2(50);
    v_ip_address VARCHAR2(45);
    v_application_name VARCHAR2(100);
    v_affected_fields CLOB;
    v_change_summary VARCHAR2(1000);
BEGIN
    -- Get audit ID
    SELECT seq_audit_id.NEXTVAL INTO v_audit_id FROM dual;
    
    -- Determine operation type
    IF INSERTING THEN
        v_operation_type := 'INSERT';
    ELSIF UPDATING THEN
        v_operation_type := 'UPDATE';
    ELSIF DELETING THEN
        v_operation_type := 'DELETE';
    END IF;
    
    -- Get user context
    v_user_id := COALESCE(:NEW.created_by, :OLD.created_by, USER);
    v_session_id := SYS_CONTEXT('USERENV', 'SESSIONID');
    v_ip_address := SYS_CONTEXT('USERENV', 'IP_ADDRESS');
    v_application_name := SYS_CONTEXT('USERENV', 'MODULE');
    
    -- Build affected fields list for UPDATE operations
    IF v_operation_type = 'UPDATE' THEN
        v_affected_fields := '';
        IF :NEW.department_name != :OLD.department_name THEN
            v_affected_fields := v_affected_fields || 'department_name,';
        END IF;
        IF :NEW.location != :OLD.location THEN
            v_affected_fields := v_affected_fields || 'location,';
        END IF;
        IF :NEW.head_doctor_id != :OLD.head_doctor_id THEN
            v_affected_fields := v_affected_fields || 'head_doctor_id,';
        END IF;
        
        -- Remove trailing comma
        IF LENGTH(v_affected_fields) > 0 THEN
            v_affected_fields := RTRIM(v_affected_fields, ',');
        END IF;
        
        -- Build change summary
        v_change_summary := 'Department ' || COALESCE(:NEW.department_id, :OLD.department_id) || 
                           ' updated. Fields changed: ' || v_affected_fields;
    ELSIF v_operation_type = 'INSERT' THEN
        v_change_summary := 'New department ' || :NEW.department_id || ' created: ' || :NEW.department_name;
    ELSIF v_operation_type = 'DELETE' THEN
        v_change_summary := 'Department ' || :OLD.department_id || ' deleted: ' || :OLD.department_name;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_departments (
        audit_id, department_id, operation_type, operation_timestamp, user_id,
        session_id, ip_address, application_name, affected_fields, change_summary,
        -- Old values
        old_department_name, old_location, old_head_doctor_id,
        -- New values
        new_department_name, new_location, new_head_doctor_id,
        source_system, data_lineage, transformation_notes
    ) VALUES (
        v_audit_id, COALESCE(:NEW.department_id, :OLD.department_id), v_operation_type,
        SYSTIMESTAMP, v_user_id, v_session_id, v_ip_address, v_application_name,
        v_affected_fields, v_change_summary,
        -- Old values
        :OLD.department_name, :OLD.location, :OLD.head_doctor_id,
        -- New values
        :NEW.department_name, :NEW.location, :NEW.head_doctor_id,
        'HEALTHCARE_SYSTEM', 'DIRECT_USER_INPUT', 'Automatic audit logging via trigger'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Audit trigger error: ' || SQLERRM);
END;
/

-- =====================================================
-- END OF ALL AUDIT TRIGGERS
-- =====================================================
