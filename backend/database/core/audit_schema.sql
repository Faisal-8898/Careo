-- =====================================================
-- Healthcare Patient Record Management System
-- Audit Schema Definition for Provenance Tracking
-- =====================================================
-- This file contains audit tables that capture the complete history
-- of data changes for compliance, debugging, and provenance analysis
-- =====================================================

-- Drop existing audit tables if they exist
DROP TABLE audit_patients CASCADE CONSTRAINTS;
DROP TABLE audit_doctors CASCADE CONSTRAINTS;
DROP TABLE audit_nurses CASCADE CONSTRAINTS;
DROP TABLE audit_admins CASCADE CONSTRAINTS;
DROP TABLE audit_medications CASCADE CONSTRAINTS;
DROP TABLE audit_medical_records CASCADE CONSTRAINTS;
DROP TABLE audit_prescriptions CASCADE CONSTRAINTS;
DROP TABLE audit_lab_results CASCADE CONSTRAINTS;
DROP TABLE audit_appointments CASCADE CONSTRAINTS;
DROP TABLE audit_specializations CASCADE CONSTRAINTS;
DROP TABLE audit_departments CASCADE CONSTRAINTS;
DROP TABLE audit_user_actions CASCADE CONSTRAINTS;
DROP TABLE audit_data_access CASCADE CONSTRAINTS;

-- =====================================================
-- 1. CORE AUDIT TABLES FOR EACH ENTITY
-- =====================================================

-- Audit table for Patients - tracks all changes to patient data
CREATE TABLE audit_patients (
    audit_id NUMBER(20) PRIMARY KEY,
    patient_id NUMBER(10) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change (for UPDATE/DELETE operations)
    old_first_name VARCHAR2(50),
    old_last_name VARCHAR2(50),
    old_date_of_birth DATE,
    old_gender VARCHAR2(10),
    old_blood_type VARCHAR2(5),
    old_contact_phone VARCHAR2(20),
    -- Login credentials (old values)
    old_email VARCHAR2(100),
    old_password_hash VARCHAR2(255),
    old_last_login_date DATE,
    old_address_line1 VARCHAR2(200),
    old_address_line2 VARCHAR2(200),
    old_city VARCHAR2(100),
    old_state VARCHAR2(100),
    old_postal_code VARCHAR2(20),
    old_country VARCHAR2(100),
    old_emergency_contact_name VARCHAR2(100),
    old_emergency_contact_phone VARCHAR2(20),
    old_emergency_contact_relationship VARCHAR2(50),
    old_medical_history_summary CLOB,
    old_allergies CLOB,
    old_status VARCHAR2(20),
    
    -- Data after change (for INSERT/UPDATE operations)
    new_first_name VARCHAR2(50),
    new_last_name VARCHAR2(50),
    new_date_of_birth DATE,
    new_gender VARCHAR2(10),
    new_blood_type VARCHAR2(5),
    new_contact_phone VARCHAR2(20),
    -- Login credentials (new values)
    new_email VARCHAR2(100),
    new_password_hash VARCHAR2(255),
    new_last_login_date DATE,
    new_address_line1 VARCHAR2(200),
    new_address_line2 VARCHAR2(200),
    new_city VARCHAR2(100),
    new_state VARCHAR2(100),
    new_postal_code VARCHAR2(20),
    new_country VARCHAR2(100),
    new_emergency_contact_name VARCHAR2(100),
    new_emergency_contact_phone VARCHAR2(20),
    new_emergency_contact_relationship VARCHAR2(50),
    new_medical_history_summary CLOB,
    new_allergies CLOB,
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Doctors - tracks all changes to doctor data
CREATE TABLE audit_doctors (
    audit_id NUMBER(20) PRIMARY KEY,
    doctor_id NUMBER(10) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_first_name VARCHAR2(50),
    old_last_name VARCHAR2(50),
    old_specialization_id NUMBER(5),
    old_department_id NUMBER(5),
    old_license_number VARCHAR2(50),
    old_medical_degree VARCHAR2(100),
    old_university VARCHAR2(100),
    old_graduation_year NUMBER(4),
    old_experience_years NUMBER(3),
    old_contact_phone VARCHAR2(20),
    -- Login credentials (old values)
    old_email VARCHAR2(100),
    old_password_hash VARCHAR2(255),
    old_last_login_date DATE,
    old_availability_schedule VARCHAR2(500),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_first_name VARCHAR2(50),
    new_last_name VARCHAR2(50),
    new_specialization_id NUMBER(5),
    new_department_id NUMBER(5),
    new_license_number VARCHAR2(50),
    new_medical_degree VARCHAR2(100),
    new_university VARCHAR2(100),
    new_graduation_year NUMBER(4),
    new_experience_years NUMBER(3),
    new_contact_phone VARCHAR2(20),
    -- Login credentials (new values)
    new_email VARCHAR2(100),
    new_password_hash VARCHAR2(255),
    new_last_login_date DATE,
    new_availability_schedule VARCHAR2(500),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Medications - tracks all changes to medication data
CREATE TABLE audit_medications (
    audit_id NUMBER(20) PRIMARY KEY,
    medication_id NUMBER(10) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_generic_name VARCHAR2(100),
    old_brand_name VARCHAR2(100),
    old_dosage_form VARCHAR2(50),
    old_strength VARCHAR2(50),
    old_unit VARCHAR2(20),
    old_manufacturer VARCHAR2(100),
    old_description CLOB,
    old_contraindications CLOB,
    old_side_effects CLOB,
    old_storage_instructions VARCHAR2(500),
    old_prescription_required CHAR(1),
    old_controlled_substance CHAR(1),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_generic_name VARCHAR2(100),
    new_brand_name VARCHAR2(100),
    new_dosage_form VARCHAR2(50),
    new_strength VARCHAR2(50),
    new_unit VARCHAR2(20),
    new_manufacturer VARCHAR2(100),
    new_description CLOB,
    new_contraindications CLOB,
    new_side_effects CLOB,
    new_storage_instructions VARCHAR2(500),
    new_prescription_required CHAR(1),
    new_controlled_substance CHAR(1),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- NURSES TABLE AUDIT TABLE
-- =====================================================

-- Audit table for Nurses - tracks all changes to nurse data
CREATE TABLE audit_nurses (
    audit_id NUMBER(20) PRIMARY KEY,
    nurse_id NUMBER(10) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_first_name VARCHAR2(50),
    old_last_name VARCHAR2(50),
    old_department_id NUMBER(5),
    old_license_number VARCHAR2(50),
    old_nursing_degree VARCHAR2(100),
    old_university VARCHAR2(100),
    old_graduation_year NUMBER(4),
    old_experience_years NUMBER(3),
    old_contact_phone VARCHAR2(20),
    -- Login credentials (old values)
    old_email VARCHAR2(100),
    old_password_hash VARCHAR2(255),
    old_last_login_date DATE,
    old_shift_preference VARCHAR2(50),
    old_availability_schedule VARCHAR2(500),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_first_name VARCHAR2(50),
    new_last_name VARCHAR2(50),
    new_department_id NUMBER(5),
    new_license_number VARCHAR2(50),
    new_nursing_degree VARCHAR2(100),
    new_university VARCHAR2(100),
    new_graduation_year NUMBER(4),
    new_experience_years NUMBER(3),
    new_contact_phone VARCHAR2(20),
    -- Login credentials (new values)
    new_email VARCHAR2(100),
    new_password_hash VARCHAR2(255),
    new_last_login_date DATE,
    new_shift_preference VARCHAR2(50),
    new_availability_schedule VARCHAR2(500),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- ADMINS TABLE AUDIT TABLE
-- =====================================================

-- Audit table for Admins - tracks all changes to admin data
CREATE TABLE audit_admins (
    audit_id NUMBER(20) PRIMARY KEY,
    admin_id NUMBER(10) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_first_name VARCHAR2(50),
    old_last_name VARCHAR2(50),
    old_department_id NUMBER(5),
    old_employee_id VARCHAR2(50),
    old_contact_phone VARCHAR2(20),
    -- Login credentials (old values)
    old_email VARCHAR2(100),
    old_password_hash VARCHAR2(255),
    old_last_login_date DATE,
    old_access_level VARCHAR2(50),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_first_name VARCHAR2(50),
    new_last_name VARCHAR2(50),
    new_department_id NUMBER(5),
    new_employee_id VARCHAR2(50),
    new_contact_phone VARCHAR2(20),
    -- Login credentials (new values)
    new_email VARCHAR2(100),
    new_password_hash VARCHAR2(255),
    new_last_login_date DATE,
    new_access_level VARCHAR2(50),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Medical Records - tracks all changes to medical records
CREATE TABLE audit_medical_records (
    audit_id NUMBER(20) PRIMARY KEY,
    record_id NUMBER(15) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_patient_id NUMBER(10),
    old_doctor_id NUMBER(10),
    old_visit_date DATE,
    old_record_type VARCHAR2(50),
    old_chief_complaint VARCHAR2(500),
    old_symptoms CLOB,
    old_physical_examination CLOB,
    old_diagnosis CLOB,
    old_treatment_plan CLOB,
    old_recommendations CLOB,
    old_follow_up_date DATE,
    old_follow_up_notes VARCHAR2(500),
    old_record_status VARCHAR2(20),
    
    -- Data after change
    new_patient_id NUMBER(10),
    new_doctor_id NUMBER(10),
    new_visit_date DATE,
    new_record_type VARCHAR2(50),
    new_chief_complaint VARCHAR2(500),
    new_symptoms CLOB,
    new_physical_examination CLOB,
    new_diagnosis CLOB,
    new_treatment_plan CLOB,
    new_recommendations CLOB,
    new_follow_up_date DATE,
    new_follow_up_notes VARCHAR2(500),
    new_record_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'HIGH',
    retention_period_years NUMBER(3) DEFAULT 10,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Prescriptions - tracks all changes to prescriptions
CREATE TABLE audit_prescriptions (
    audit_id NUMBER(20) PRIMARY KEY,
    prescription_id NUMBER(15) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_record_id NUMBER(15),
    old_medication_id NUMBER(10),
    old_dosage VARCHAR2(50),
    old_frequency VARCHAR2(100),
    old_duration VARCHAR2(100),
    old_instructions VARCHAR2(500),
    old_quantity_prescribed NUMBER(5),
    old_refills_allowed NUMBER(2),
    old_refills_remaining NUMBER(2),
    old_prescription_date DATE,
    old_expiry_date DATE,
    old_status VARCHAR2(20),
    
    -- Data after change
    new_record_id NUMBER(15),
    new_medication_id NUMBER(10),
    new_dosage VARCHAR2(50),
    new_frequency VARCHAR2(100),
    new_duration VARCHAR2(100),
    new_instructions VARCHAR2(500),
    new_quantity_prescribed NUMBER(5),
    new_refills_allowed NUMBER(2),
    new_refills_remaining NUMBER(2),
    new_prescription_date DATE,
    new_expiry_date DATE,
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'HIGH',
    retention_period_years NUMBER(3) DEFAULT 10,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Lab Results - tracks all changes to lab results
CREATE TABLE audit_lab_results (
    audit_id NUMBER(20) PRIMARY KEY,
    lab_id NUMBER(15) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_patient_id NUMBER(10),
    old_doctor_id NUMBER(10),
    old_test_type VARCHAR2(100),
    old_test_date DATE,
    old_results CLOB,
    old_normal_range VARCHAR2(200),
    old_units VARCHAR2(50),
    old_interpretation VARCHAR2(500),
    old_lab_technician VARCHAR2(100),
    old_lab_facility VARCHAR2(100),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_patient_id NUMBER(10),
    new_doctor_id NUMBER(10),
    new_test_type VARCHAR2(100),
    new_test_date DATE,
    new_results CLOB,
    new_normal_range VARCHAR2(200),
    new_units VARCHAR2(50),
    new_interpretation VARCHAR2(500),
    new_lab_technician VARCHAR2(100),
    new_lab_facility VARCHAR2(100),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'HIGH',
    retention_period_years NUMBER(3) DEFAULT 10,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Appointments - tracks all changes to appointments
CREATE TABLE audit_appointments (
    audit_id NUMBER(20) PRIMARY KEY,
    appointment_id NUMBER(15) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_patient_id NUMBER(10),
    old_doctor_id NUMBER(10),
    old_appointment_date DATE,
    old_appointment_time TIMESTAMP,
    old_appointment_type VARCHAR2(50),
    old_reason VARCHAR2(500),
    old_notes VARCHAR2(500),
    old_status VARCHAR2(20),
    
    -- Data after change
    new_patient_id NUMBER(10),
    new_doctor_id NUMBER(10),
    new_appointment_date DATE,
    new_appointment_time TIMESTAMP,
    new_appointment_type VARCHAR2(50),
    new_reason VARCHAR2(500),
    new_notes VARCHAR2(500),
    new_status VARCHAR2(20),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- 2. REFERENCE TABLE AUDIT TABLES
-- =====================================================

-- Audit table for Specializations
CREATE TABLE audit_specializations (
    audit_id NUMBER(20) PRIMARY KEY,
    specialization_id NUMBER(5) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_specialization_name VARCHAR2(100),
    old_description VARCHAR2(500),
    
    -- Data after change
    new_specialization_name VARCHAR2(100),
    new_description VARCHAR2(500),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Departments
CREATE TABLE audit_departments (
    audit_id NUMBER(20) PRIMARY KEY,
    department_id NUMBER(5) NOT NULL,
    operation_type VARCHAR2(10) NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    operation_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Data before change
    old_department_name VARCHAR2(100),
    old_location VARCHAR2(100),
    old_head_doctor_id NUMBER(10),
    
    -- Data after change
    new_department_name VARCHAR2(100),
    new_location VARCHAR2(100),
    new_head_doctor_id NUMBER(10),
    
    -- Change metadata
    change_reason VARCHAR2(500),
    change_justification VARCHAR2(1000),
    affected_fields CLOB,
    change_summary VARCHAR2(1000),
    
    -- Provenance information
    source_system VARCHAR2(100),
    data_lineage VARCHAR2(500),
    transformation_notes VARCHAR2(1000),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- 3. SYSTEM-WIDE AUDIT TABLES
-- =====================================================

-- Audit table for User Actions - tracks all user activities
CREATE TABLE audit_user_actions (
    audit_id NUMBER(20) PRIMARY KEY,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    action_type VARCHAR2(100) NOT NULL,
    action_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    module_name VARCHAR2(100),
    function_name VARCHAR2(100),
    
    -- Action details
    action_description VARCHAR2(1000),
    action_parameters CLOB,
    action_result VARCHAR2(50),
    error_message CLOB,
    
    -- Context information
    table_name VARCHAR2(100),
    record_id VARCHAR2(50),
    operation_type VARCHAR2(10),
    
    -- Performance metrics
    execution_time_ms NUMBER(10),
    rows_affected NUMBER(10),
    
    -- Security context
    user_roles CLOB,
    permissions_used CLOB,
    security_level VARCHAR2(50),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Audit table for Data Access - tracks who accessed what data
CREATE TABLE audit_data_access (
    audit_id NUMBER(20) PRIMARY KEY,
    user_id VARCHAR2(50) NOT NULL,
    session_id VARCHAR2(50),
    access_timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    ip_address VARCHAR2(45),
    application_name VARCHAR2(100),
    
    -- Access details
    table_name VARCHAR2(100) NOT NULL,
    record_id VARCHAR2(50),
    access_type VARCHAR2(50) CHECK (access_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'PRINT')),
    access_method VARCHAR2(100),
    
    -- Query information
    sql_query CLOB,
    query_parameters CLOB,
    rows_returned NUMBER(10),
    
    -- Purpose and justification
    access_purpose VARCHAR2(500),
    business_justification VARCHAR2(1000),
    patient_consent_verified CHAR(1) DEFAULT 'N' CHECK (patient_consent_verified IN ('Y', 'N')),
    
    -- Security context
    user_roles CLOB,
    permissions_used CLOB,
    security_level VARCHAR2(50),
    
    -- Compliance fields
    compliance_level VARCHAR2(50) DEFAULT 'STANDARD',
    retention_period_years NUMBER(3) DEFAULT 7,
    legal_hold CHAR(1) DEFAULT 'N' CHECK (legal_hold IN ('Y', 'N')),
    
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- 4. SEQUENCES FOR AUDIT TABLES
-- =====================================================

CREATE SEQUENCE seq_audit_id START WITH 1 INCREMENT BY 1;

-- =====================================================
-- 5. INDEXES FOR AUDIT TABLES PERFORMANCE
-- =====================================================

-- Core audit table indexes
CREATE INDEX idx_audit_patients_patient_id ON audit_patients(patient_id);
CREATE INDEX idx_audit_patients_timestamp ON audit_patients(operation_timestamp);
CREATE INDEX idx_audit_patients_user ON audit_patients(user_id);
CREATE INDEX idx_audit_patients_operation ON audit_patients(operation_type);

CREATE INDEX idx_audit_doctors_doctor_id ON audit_doctors(doctor_id);
CREATE INDEX idx_audit_doctors_timestamp ON audit_doctors(operation_timestamp);
CREATE INDEX idx_audit_doctors_user ON audit_doctors(user_id);

CREATE INDEX idx_audit_nurses_nurse_id ON audit_nurses(nurse_id);
CREATE INDEX idx_audit_nurses_timestamp ON audit_nurses(operation_timestamp);
CREATE INDEX idx_audit_nurses_user ON audit_nurses(user_id);

CREATE INDEX idx_audit_admins_admin_id ON audit_admins(admin_id);
CREATE INDEX idx_audit_admins_timestamp ON audit_admins(operation_timestamp);
CREATE INDEX idx_audit_admins_user ON audit_admins(user_id);

CREATE INDEX idx_audit_medications_medication_id ON audit_medications(medication_id);
CREATE INDEX idx_audit_medications_timestamp ON audit_medications(operation_timestamp);
CREATE INDEX idx_audit_medications_user ON audit_medications(user_id);

CREATE INDEX idx_audit_records_record_id ON audit_medical_records(record_id);
CREATE INDEX idx_audit_records_timestamp ON audit_medical_records(operation_timestamp);
CREATE INDEX idx_audit_records_user ON audit_medical_records(user_id);

CREATE INDEX idx_audit_prescriptions_prescription_id ON audit_prescriptions(prescription_id);
CREATE INDEX idx_audit_prescriptions_timestamp ON audit_prescriptions(operation_timestamp);

CREATE INDEX idx_audit_lab_lab_id ON audit_lab_results(lab_id);
CREATE INDEX idx_audit_lab_timestamp ON audit_lab_results(operation_timestamp);

CREATE INDEX idx_audit_appointments_appointment_id ON audit_appointments(appointment_id);
CREATE INDEX idx_audit_appointments_timestamp ON audit_appointments(operation_timestamp);

-- System audit table indexes
CREATE INDEX idx_audit_user_actions_user_id ON audit_user_actions(user_id);
CREATE INDEX idx_audit_user_actions_timestamp ON audit_user_actions(action_timestamp);
CREATE INDEX idx_audit_user_actions_type ON audit_user_actions(action_type);

CREATE INDEX idx_audit_data_access_user_id ON audit_data_access(user_id);
CREATE INDEX idx_audit_data_access_timestamp ON audit_data_access(access_timestamp);
CREATE INDEX idx_audit_data_access_table ON audit_data_access(table_name);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_patients_user_time ON audit_patients(user_id, operation_timestamp);
CREATE INDEX idx_audit_records_user_time ON audit_medical_records(user_id, operation_timestamp);
CREATE INDEX idx_audit_user_actions_user_time ON audit_user_actions(user_id, action_timestamp);

-- =====================================================
-- 6. COMMENTS FOR AUDIT TABLES
-- =====================================================

COMMENT ON TABLE audit_patients IS 'Complete audit trail for all patient data changes';
COMMENT ON TABLE audit_doctors IS 'Complete audit trail for all doctor data changes';
COMMENT ON TABLE audit_nurses IS 'Complete audit trail for all nurse data changes';
COMMENT ON TABLE audit_admins IS 'Complete audit trail for all admin data changes';
COMMENT ON TABLE audit_medications IS 'Complete audit trail for all medication data changes';
COMMENT ON TABLE audit_medical_records IS 'Complete audit trail for all medical record changes';
COMMENT ON TABLE audit_prescriptions IS 'Complete audit trail for all prescription changes';
COMMENT ON TABLE audit_lab_results IS 'Complete audit trail for all lab result changes';
COMMENT ON TABLE audit_appointments IS 'Complete audit trail for all appointment changes';
COMMENT ON TABLE audit_specializations IS 'Complete audit trail for all specialization changes';
COMMENT ON TABLE audit_departments IS 'Complete audit trail for all department changes';
COMMENT ON TABLE audit_user_actions IS 'System-wide audit trail for all user actions';
COMMENT ON TABLE audit_data_access IS 'Complete audit trail for all data access activities';

-- =====================================================
-- END OF AUDIT SCHEMA
-- =====================================================
