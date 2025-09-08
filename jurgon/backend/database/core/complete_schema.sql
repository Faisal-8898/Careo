-- =====================================================
-- Healthcare Patient Record Management System
-- Complete Database Schema (Core + Audit)
-- =====================================================
-- This file contains the complete database schema including:
-- 1. Core tables for the healthcare system
-- 2. Audit tables for provenance tracking
-- 3. Sequences and indexes
-- =====================================================
-- Execute this file to create the complete database structure
-- =====================================================

-- Set session parameters for better performance
ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS';
ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF';

-- =====================================================
-- EXECUTION ORDER:
-- 1. Core Schema (core_schema.sql)
-- 2. Audit Schema (audit_schema.sql)
-- =====================================================

-- Execute Core Schema
@core_schema.sql

-- Execute Audit Schema  
@audit_schema.sql

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables were created successfully
SELECT table_name, tablespace_name, num_rows, last_analyzed
FROM user_tables 
WHERE table_name LIKE '%AUDIT%' OR table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'NURSES', 'ADMINS', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'PRESCRIPTION_MEDICINES', 'APPOINTMENTS', 'SPECIALIZATIONS', 'DEPARTMENTS')
ORDER BY table_name;

-- Verify all sequences were created
SELECT sequence_name, min_value, max_value, increment_by, last_number
FROM user_sequences
ORDER BY sequence_name;

-- Verify all indexes were created
SELECT index_name, table_name, uniqueness, status
FROM user_indexes
WHERE table_name LIKE '%AUDIT%' OR table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'NURSES', 'ADMINS', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'PRESCRIPTION_MEDICINES', 'APPOINTMENTS', 'SPECIALIZATIONS', 'DEPARTMENTS')
ORDER BY table_name, index_name;

-- =====================================================
-- SCHEMA SUMMARY
-- =====================================================

/*
CORE TABLES CREATED:
- users: Centralized authentication for all user types (cleaned - no status/audit fields)
- specializations: Medical specialties (minimal fields)
- departments: Hospital departments (minimal fields)
- patients: Core patient information linked to users table (only created_date)
- doctors: Healthcare providers linked to users table (only created_date)
- nurses: Nursing staff linked to users table (no graduation_year/shift_preference)
- admins: Administrative staff linked to users table (only created_date)
- appointments: Patient appointments (appointment_status only, linked to medical_records)
- medical_records: Patient visit records linked to appointments (critical_status only)
- prescriptions: Prescription headers with general instructions linked to medical records
- prescription_medicines: Individual medicines within prescriptions with dosage details

AUDIT TABLES CREATED:
- audit_users: User authentication data change history
- audit_specializations: Specialization change history
- audit_departments: Department change history
- audit_patients: Patient data change history
- audit_doctors: Doctor data change history
- audit_nurses: Nurse data change history
- audit_admins: Admin data change history
- audit_appointments: Appointment change history
- audit_medical_records: Medical record change history with critical status tracking
- audit_prescriptions: Prescription header change history
- audit_prescription_medicines: Individual medicine change history within prescriptions
- audit_user_actions: System-wide user action history
- audit_data_access: Data access tracking

TOTAL: 24 tables (11 core + 13 audit)

WORKFLOW FEATURES:
- Patient registration and profile management
- Doctor appointment scheduling and completion
- Medical record creation linked to appointments
- Multi-medicine prescription management linked to medical records
- Nurse task assignment and critical status tracking
- Admin user management and system oversight
- Timeline view for patient medical history

PROVENANCE FEATURES:
- Complete data change tracking (INSERT, UPDATE, DELETE)
- Before/after data snapshots for all core entities
- User activity logging with performance metrics
- Data access monitoring with consent verification
- Compliance and retention management
- Change justification and reasoning tracking
- Data lineage and source system identification
- Centralized authentication with role-based audit trails
*/

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 1. Create triggers to automatically populate audit tables
-- 2. Insert sample reference data (specializations, departments)
-- 3. Create stored procedures for common operations
-- 4. Implement provenance queries
-- 5. Test the complete system
-- =====================================================

PROMPT =====================================================
PROMPT Healthcare Database Schema Created Successfully!
PROMPT =====================================================
PROMPT Core Tables: 11
PROMPT Audit Tables: 13
PROMPT Total Tables: 24
PROMPT =====================================================
PROMPT Ready for trigger implementation and data insertion
PROMPT =====================================================
