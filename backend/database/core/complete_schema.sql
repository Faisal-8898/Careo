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
WHERE table_name LIKE '%AUDIT%' OR table_name IN ('PATIENTS', 'DOCTORS', 'NURSES', 'ADMINS', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'APPOINTMENTS', 'SPECIALIZATIONS', 'DEPARTMENTS')
ORDER BY table_name;

-- Verify all sequences were created
SELECT sequence_name, min_value, max_value, increment_by, last_number
FROM user_sequences
ORDER BY sequence_name;

-- Verify all indexes were created
SELECT index_name, table_name, uniqueness, status
FROM user_indexes
WHERE table_name LIKE '%AUDIT%' OR table_name IN ('PATIENTS', 'DOCTORS', 'NURSES', 'ADMINS', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'APPOINTMENTS', 'SPECIALIZATIONS', 'DEPARTMENTS')
ORDER BY table_name, index_name;

-- =====================================================
-- SCHEMA SUMMARY
-- =====================================================

/*
CORE TABLES CREATED:
- specializations: Medical specialties
- departments: Hospital departments  
- patients: Patient information with login credentials
- doctors: Healthcare providers with login credentials
- nurses: Nursing staff with login credentials
- admins: Administrative staff with login credentials
- medical_records: Patient visit records with nurse assignment, tasks, and critical status tracking
- prescriptions: Text-based medication prescriptions
- appointments: Patient appointments

AUDIT TABLES CREATED:
- audit_patients: Patient data change history
- audit_doctors: Doctor data change history
- audit_nurses: Nurse data change history
- audit_admins: Admin data change history
- audit_medical_records: Medical record change history with nurse task and critical status tracking
- audit_prescriptions: Prescription change history
- audit_appointments: Appointment change history
- audit_specializations: Specialization change history
- audit_departments: Department change history
- audit_user_actions: System-wide user action history
- audit_data_access: Data access tracking

TOTAL: 20 tables (9 core + 11 audit)

PROVENANCE FEATURES:
- Complete data change tracking (INSERT, UPDATE, DELETE)
- Before/after data snapshots
- User activity logging
- Data access monitoring
- Compliance and retention management
- Change justification and reasoning
- Data lineage tracking
- Source system identification
- Login credential tracking and audit trails
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
PROMPT Core Tables: 9
PROMPT Audit Tables: 11
PROMPT Total Tables: 20
PROMPT =====================================================
PROMPT Ready for trigger implementation and data insertion
PROMPT =====================================================
