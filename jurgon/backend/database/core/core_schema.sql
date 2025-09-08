-- =====================================================
-- Healthcare Patient Record Management System
-- Core Schema Definition
-- =====================================================
-- This file contains the core tables for the healthcare system
-- including patients, doctors, medical records, and related entities
-- =====================================================

-- SQL*Plus settings for proper execution
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;
SET ECHO OFF;
SET VERIFY OFF;
SET SERVEROUTPUT ON;

-- Drop existing tables if they exist (for clean setup)
-- Note: In production, use proper migration scripts
DROP TABLE prescription_medicines CASCADE CONSTRAINTS;
DROP TABLE prescriptions CASCADE CONSTRAINTS;
DROP TABLE medical_records CASCADE CONSTRAINTS;
DROP TABLE appointments CASCADE CONSTRAINTS;
DROP TABLE doctors CASCADE CONSTRAINTS;
DROP TABLE nurses CASCADE CONSTRAINTS;
DROP TABLE admins CASCADE CONSTRAINTS;
DROP TABLE patients CASCADE CONSTRAINTS;
DROP TABLE users CASCADE CONSTRAINTS;
DROP TABLE departments CASCADE CONSTRAINTS;
DROP TABLE specializations CASCADE CONSTRAINTS;

-- =====================================================
-- 1. REFERENCE TABLES
-- =====================================================

-- Specializations table for doctor specialties
CREATE TABLE specializations (
    specialization_id NUMBER(5) PRIMARY KEY,
    specialization_name VARCHAR2(100) NOT NULL UNIQUE,
    description VARCHAR2(500),
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- Departments table for hospital organization
CREATE TABLE departments (
    department_id NUMBER(5) PRIMARY KEY,
    department_name VARCHAR2(100) NOT NULL UNIQUE,
    location VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- 2. AUTHENTICATION AND USER MANAGEMENT
-- =====================================================

-- Users table - centralized authentication for all user types
CREATE TABLE users (
    user_id NUMBER(10) PRIMARY KEY,
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    user_type VARCHAR2(20) NOT NULL CHECK (user_type IN ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN')),
    created_date DATE DEFAULT SYSDATE NOT NULL
);

-- =====================================================
-- 3. CORE ENTITY TABLES
-- =====================================================

-- Patients table - core patient information
CREATE TABLE patients (
    patient_id NUMBER(10) PRIMARY KEY,
    user_id NUMBER(10) NOT NULL UNIQUE,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR2(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_type VARCHAR2(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    contact_phone VARCHAR2(20),
    -- Address information
    address_line1 VARCHAR2(200),
    address_line2 VARCHAR2(200),
    city VARCHAR2(100),
    state VARCHAR2(100),
    postal_code VARCHAR2(20),
    country VARCHAR2(100),
    emergency_contact_name VARCHAR2(100),
    emergency_contact_phone VARCHAR2(20),
    emergency_contact_relationship VARCHAR2(50),
    medical_history_summary CLOB,
    allergies CLOB,
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Doctors table - healthcare providers
CREATE TABLE doctors (
    doctor_id NUMBER(10) PRIMARY KEY,
    user_id NUMBER(10) NOT NULL UNIQUE,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    specialization_id NUMBER(5) NOT NULL,
    department_id NUMBER(5),
    medical_degree VARCHAR2(100),
    university VARCHAR2(100),
    experience_years NUMBER(3),
    contact_phone VARCHAR2(20),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_doctor_specialization FOREIGN KEY (specialization_id) REFERENCES specializations(specialization_id),
    CONSTRAINT fk_doctor_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Nurses table - nursing staff
CREATE TABLE nurses (
    nurse_id NUMBER(10) PRIMARY KEY,
    user_id NUMBER(10) NOT NULL UNIQUE,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    department_id NUMBER(5),
    nursing_degree VARCHAR2(100),
    experience_years NUMBER(3),
    contact_phone VARCHAR2(20),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_nurse_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_nurse_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Admins table - administrative staff
CREATE TABLE admins (
    admin_id NUMBER(10) PRIMARY KEY,
    user_id NUMBER(10) NOT NULL UNIQUE,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    department_id NUMBER(5),
    employee_id VARCHAR2(50) UNIQUE NOT NULL,
    contact_phone VARCHAR2(20),
    access_level VARCHAR2(50) DEFAULT 'STANDARD' CHECK (access_level IN ('STANDARD', 'ADMINISTRATOR', 'SUPER_ADMIN')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_admins_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);


-- =====================================================
-- 3. TRANSACTION TABLES
-- =====================================================

-- Appointments table - patient appointments (must be defined first)
CREATE TABLE appointments (
    appointment_id NUMBER(15) PRIMARY KEY,
    patient_id NUMBER(10) NOT NULL,
    doctor_id NUMBER(10) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIMESTAMP NOT NULL,
    appointment_type VARCHAR2(50) CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'LAB_TEST')),
    reason VARCHAR2(500),
    notes VARCHAR2(500),
    appointment_status VARCHAR2(20) DEFAULT 'SCHEDULED' CHECK (appointment_status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

-- Medical Records table - patient visit records
CREATE TABLE medical_records (
    record_id NUMBER(15) PRIMARY KEY,
    patient_id NUMBER(10) NOT NULL,
    doctor_id NUMBER(10) NOT NULL,
    nurse_id NUMBER(10),
    nurse_task VARCHAR2(500),
    appointment_id NUMBER(15) NOT NULL,
    record_type VARCHAR2(50) CHECK (record_type IN ('CONSULTATION', 'EMERGENCY', 'FOLLOW_UP', 'SURGERY', 'LAB_TEST')),
    chief_complaint VARCHAR2(500),
    symptoms CLOB,
    physical_examination CLOB,
    diagnosis CLOB,
    treatment_plan CLOB,
    recommendations CLOB,
    critical_status VARCHAR2(20) CHECK (critical_status IN ('NORMAL', 'ATTENTION', 'CRITICAL')),
    critical_notes VARCHAR2(500),
    follow_up_date DATE,
    follow_up_notes VARCHAR2(500),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    CONSTRAINT fk_record_nurse FOREIGN KEY (nurse_id) REFERENCES nurses(nurse_id),
    CONSTRAINT fk_record_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);

-- Prescriptions table - prescription header
CREATE TABLE prescriptions (
    prescription_id NUMBER(15) PRIMARY KEY,
    record_id NUMBER(15) NOT NULL,
    prescription_date DATE DEFAULT SYSDATE NOT NULL,
    general_instructions VARCHAR2(1000),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_prescription_record FOREIGN KEY (record_id) REFERENCES medical_records(record_id)
);

-- Prescription Medicines table - individual medicines in a prescription
CREATE TABLE prescription_medicines (
    medicine_id NUMBER(15) PRIMARY KEY,
    prescription_id NUMBER(15) NOT NULL,
    medicine_name VARCHAR2(100) NOT NULL,
    dosage VARCHAR2(50) NOT NULL,
    frequency VARCHAR2(100) NOT NULL,
    duration VARCHAR2(100),
    instructions VARCHAR2(500),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_prescription_medicine FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)
);

-- =====================================================
-- 4. SEQUENCES FOR AUTO-INCREMENTING IDs
-- =====================================================

CREATE SEQUENCE seq_specialization_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_department_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_user_id START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE seq_patient_id START WITH 10001 INCREMENT BY 1;
CREATE SEQUENCE seq_doctor_id START WITH 20001 INCREMENT BY 1;
CREATE SEQUENCE seq_nurse_id START WITH 25001 INCREMENT BY 1;
CREATE SEQUENCE seq_admin_id START WITH 30001 INCREMENT BY 1;
CREATE SEQUENCE seq_appointment_id START WITH 70001 INCREMENT BY 1;
CREATE SEQUENCE seq_record_id START WITH 40001 INCREMENT BY 1;
CREATE SEQUENCE seq_prescription_id START WITH 50001 INCREMENT BY 1;
CREATE SEQUENCE seq_prescription_medicine_id START WITH 60001 INCREMENT BY 1;

-- ===================================================== 
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- User authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- Patient indexes
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_user ON patients(user_id);

-- Doctor indexes
CREATE INDEX idx_doctors_name ON doctors(last_name, first_name);
CREATE INDEX idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX idx_doctors_user ON doctors(user_id);

-- Nurse indexes
CREATE INDEX idx_nurses_name ON nurses(last_name, first_name);
CREATE INDEX idx_nurses_department ON nurses(department_id);
CREATE INDEX idx_nurses_user ON nurses(user_id);

-- Admin indexes
CREATE INDEX idx_admins_name ON admins(last_name, first_name);
CREATE INDEX idx_admins_department ON admins(department_id);
CREATE INDEX idx_admins_access ON admins(access_level);
CREATE INDEX idx_admins_user ON admins(user_id);

-- Medical record indexes
CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_records_nurse ON medical_records(nurse_id);
CREATE INDEX idx_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_records_type ON medical_records(record_type);

-- Prescription indexes
CREATE INDEX idx_prescriptions_record ON prescriptions(record_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);

-- Prescription medicines indexes
CREATE INDEX idx_prescription_medicines_prescription ON prescription_medicines(prescription_id);
CREATE INDEX idx_prescription_medicines_medicine ON prescription_medicines(medicine_name);

-- Appointment indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Centralized authentication table for all user types (patients, doctors, nurses, admins)';
COMMENT ON TABLE patients IS 'Core patient information and demographics linked to users table';
COMMENT ON TABLE doctors IS 'Healthcare providers with specializations and credentials linked to users table';
COMMENT ON TABLE nurses IS 'Nursing staff with department assignments and credentials linked to users table';
COMMENT ON TABLE admins IS 'Administrative staff with role-based access control linked to users table';
COMMENT ON TABLE appointments IS 'Patient appointment scheduling and management';
COMMENT ON TABLE medical_records IS 'Patient visit records and medical documentation with optional nurse assignment';
COMMENT ON TABLE prescriptions IS 'Prescription headers containing general information and instructions';
COMMENT ON TABLE prescription_medicines IS 'Individual medicines within a prescription with specific dosage and instructions';
COMMENT ON TABLE specializations IS 'Medical specialties and subspecialties';
COMMENT ON TABLE departments IS 'Hospital departments and organizational structure';

-- =====================================================
-- END OF CORE SCHEMA
-- =====================================================

EXIT;
