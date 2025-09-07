-- =====================================================
-- Healthcare Patient Record Management System
-- Core Schema Definition
-- =====================================================
-- This file contains the core tables for the healthcare system
-- including patients, doctors, medical records, and related entities
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
-- Note: In production, use proper migration scripts
DROP TABLE prescriptions CASCADE CONSTRAINTS;
DROP TABLE appointments CASCADE CONSTRAINTS;
DROP TABLE medical_records CASCADE CONSTRAINTS;
DROP TABLE doctors CASCADE CONSTRAINTS;
DROP TABLE nurses CASCADE CONSTRAINTS;
DROP TABLE admins CASCADE CONSTRAINTS;
DROP TABLE patients CASCADE CONSTRAINTS;
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
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50)
);

-- Departments table for hospital organization
CREATE TABLE departments (
    department_id NUMBER(5) PRIMARY KEY,
    department_name VARCHAR2(100) NOT NULL UNIQUE,
    location VARCHAR2(100),
    head_doctor_id NUMBER(10),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50)
);

-- =====================================================
-- 2. CORE ENTITY TABLES
-- =====================================================

-- Patients table - core patient information
CREATE TABLE patients (
    patient_id NUMBER(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR2(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_type VARCHAR2(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    contact_phone VARCHAR2(20),
    -- Login credentials (email replaces contact_email)
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    last_login_date DATE,
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
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DECEASED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50)
);

-- Doctors table - healthcare providers
CREATE TABLE doctors (
    doctor_id NUMBER(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    specialization_id NUMBER(5) NOT NULL,
    department_id NUMBER(5),
    medical_degree VARCHAR2(100),
    university VARCHAR2(100),
    experience_years NUMBER(3),
    contact_phone VARCHAR2(20),
    -- Login credentials (email replaces contact_email)
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    last_login_date DATE,
    availability_schedule VARCHAR2(500),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_doctor_specialization FOREIGN KEY (specialization_id) REFERENCES specializations(specialization_id),
    CONSTRAINT fk_doctor_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Nurses table - nursing staff
CREATE TABLE nurses (
    nurse_id NUMBER(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    department_id NUMBER(5),
    license_number VARCHAR2(50) UNIQUE NOT NULL,
    nursing_degree VARCHAR2(100),
    university VARCHAR2(100),
    graduation_year NUMBER(4),
    experience_years NUMBER(3),
    contact_phone VARCHAR2(20),
    -- Login credentials (email replaces contact_email)
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    last_login_date DATE,
    shift_preference VARCHAR2(50) CHECK (shift_preference IN ('DAY', 'NIGHT', 'ROTATING', 'FLEXIBLE')),
    availability_schedule VARCHAR2(500),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_nurse_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Admins table - administrative staff
CREATE TABLE admins (
    admin_id NUMBER(10) PRIMARY KEY,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    department_id NUMBER(5),
    employee_id VARCHAR2(50) UNIQUE NOT NULL,
    contact_phone VARCHAR2(20),
    -- Login credentials (email replaces contact_email)
    email VARCHAR2(100) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    last_login_date DATE,
    access_level VARCHAR2(50) DEFAULT 'STANDARD' CHECK (access_level IN ('STANDARD', 'ADMINISTRATOR', 'SUPER_ADMIN')),
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_admins_department FOREIGN KEY (department_id) REFERENCES departments(department_id)
);


-- =====================================================
-- 3. TRANSACTION TABLES
-- =====================================================

-- Medical Records table - patient visit records
CREATE TABLE medical_records (
    record_id NUMBER(15) PRIMARY KEY,
    patient_id NUMBER(10) NOT NULL,
    doctor_id NUMBER(10) NOT NULL,
    visit_date DATE NOT NULL,
    record_type VARCHAR2(50) CHECK (record_type IN ('CONSULTATION', 'EMERGENCY', 'FOLLOW_UP', 'SURGERY', 'LAB_TEST')),
    chief_complaint VARCHAR2(500),
    symptoms CLOB,
    physical_examination CLOB,
    diagnosis CLOB,
    treatment_plan CLOB,
    recommendations CLOB,
    follow_up_date DATE,
    follow_up_notes VARCHAR2(500),
    record_status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (record_status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

-- Prescriptions table - prescriptions
CREATE TABLE prescriptions (
    prescription_id NUMBER(15) PRIMARY KEY,
    record_id NUMBER(15) NOT NULL,
    medicine_name VARCHAR2(100) NOT NULL,
    dosage VARCHAR2(50) NOT NULL,
    frequency VARCHAR2(100) NOT NULL,
    duration VARCHAR2(100),
    instructions VARCHAR2(500),
    quantity_prescribed NUMBER(5),
    prescription_date DATE DEFAULT SYSDATE NOT NULL,
    expiry_date DATE,
    status VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FILLED', 'EXPIRED', 'CANCELLED')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_prescription_record FOREIGN KEY (record_id) REFERENCES medical_records(record_id),
);



-- Appointments table - patient appointments
CREATE TABLE appointments (
    appointment_id NUMBER(15) PRIMARY KEY,
    patient_id NUMBER(10) NOT NULL,
    doctor_id NUMBER(10) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIMESTAMP NOT NULL,
    -- duration_minutes NUMBER(3) DEFAULT 30,
    appointment_type VARCHAR2(50) CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'LAB_TEST')),
    reason VARCHAR2(500),
    notes VARCHAR2(500),
    status VARCHAR2(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_date DATE DEFAULT SYSDATE NOT NULL,
    created_by VARCHAR2(50) DEFAULT USER NOT NULL,
    modified_date DATE,
    modified_by VARCHAR2(50),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

-- =====================================================
-- 4. SEQUENCES FOR AUTO-INCREMENTING IDs
-- =====================================================

CREATE SEQUENCE seq_specialization_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_department_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_patient_id START WITH 10001 INCREMENT BY 1;
CREATE SEQUENCE seq_doctor_id START WITH 20001 INCREMENT BY 1;
CREATE SEQUENCE seq_nurse_id START WITH 25001 INCREMENT BY 1;
CREATE SEQUENCE seq_admin_id START WITH 30001 INCREMENT BY 1;
CREATE SEQUENCE seq_record_id START WITH 40001 INCREMENT BY 1;
CREATE SEQUENCE seq_prescription_id START WITH 50001 INCREMENT BY 1;
CREATE SEQUENCE seq_appointment_id START WITH 70001 INCREMENT BY 1;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Patient indexes
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_login ON patients(email, status);

-- Doctor indexes
CREATE INDEX idx_doctors_name ON doctors(last_name, first_name);
CREATE INDEX idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX idx_doctors_license ON doctors(license_number);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_login ON doctors(email, status);

-- Nurse indexes
CREATE INDEX idx_nurses_name ON nurses(last_name, first_name);
CREATE INDEX idx_nurses_department ON nurses(department_id);
CREATE INDEX idx_nurses_license ON nurses(license_number);
CREATE INDEX idx_nurses_shift ON nurses(shift_preference);
CREATE INDEX idx_nurses_email ON nurses(email);
CREATE INDEX idx_nurses_login ON nurses(email, status);

-- Admin indexes
CREATE INDEX idx_admins_name ON admins(last_name, first_name);
CREATE INDEX idx_admins_department ON admins(department_id);
CREATE INDEX idx_admins_access ON admins(access_level);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_login ON admins(email, status);

-- Medical record indexes
CREATE INDEX idx_records_patient_date ON medical_records(patient_id, visit_date);
CREATE INDEX idx_records_doctor_date ON medical_records(doctor_id, visit_date);
CREATE INDEX idx_records_type ON medical_records(record_type);

-- Prescription indexes
CREATE INDEX idx_prescriptions_patient ON prescriptions(record_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);


-- Appointment indexes
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE patients IS 'Core patient information and demographics with login credentials';
COMMENT ON TABLE doctors IS 'Healthcare providers with specializations, credentials and login access';
COMMENT ON TABLE nurses IS 'Nursing staff with department assignments, credentials and login access';
COMMENT ON TABLE admins IS 'Administrative staff with role-based access control and login credentials';
COMMENT ON TABLE medical_records IS 'Patient visit records and medical documentation';
COMMENT ON TABLE prescriptions IS 'Prescriptions linked to medical records';
COMMENT ON TABLE appointments IS 'Patient appointment scheduling and management';
COMMENT ON TABLE specializations IS 'Medical specialties and subspecialties';
COMMENT ON TABLE departments IS 'Hospital departments and organizational structure';

-- =====================================================
-- END OF CORE SCHEMA
-- =====================================================
