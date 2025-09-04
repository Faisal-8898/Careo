-- =====================================================
-- Careo Healthcare System - Provenance Queries
-- =====================================================
-- This file contains all the provenance queries for demonstration
-- Run these queries to see the audit trail and provenance tracking

-- =====================================================
-- QUERY 1: WHY-PROVENANCE
-- =====================================================
-- Show all medication dosage changes for a specific patient
-- This demonstrates why a patient's medication dosage was changed
-- (Justification for data changes)

SELECT 
    p.PATIENT_ID,
    p.NAME as PATIENT_NAME,
    med.NAME as MEDICATION_NAME,
    ap.OLD_DOSAGE,
    ap.NEW_DOSAGE,
    ap.OPERATION_TYPE,
    ap.TIMESTAMP,
    ap.USER_ID,
    ap.REASON
FROM AUDIT_PRESCRIPTIONS ap
JOIN PRESCRIPTIONS pr ON ap.PRESCRIPTION_ID = pr.PRESCRIPTION_ID
JOIN PATIENTS p ON pr.PATIENT_ID = p.PATIENT_ID
JOIN MEDICATIONS med ON pr.MEDICATION_ID = med.MEDICATION_ID
WHERE p.PATIENT_ID = 1
ORDER BY ap.TIMESTAMP DESC;

-- =====================================================
-- QUERY 2: WHERE-PROVENANCE
-- =====================================================
-- Find all actions taken by a specific user
-- This demonstrates where data changes originated from
-- (Lineage/source tracking)

SELECT 
    'PATIENTS' as TABLE_NAME,
    PATIENT_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_PATIENTS
WHERE USER_ID = 'CAREO'
UNION ALL
SELECT 
    'DOCTORS' as TABLE_NAME,
    DOCTOR_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_DOCTORS
WHERE USER_ID = 'CAREO'
UNION ALL
SELECT 
    'APPOINTMENTS' as TABLE_NAME,
    APPOINTMENT_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_APPOINTMENTS
WHERE USER_ID = 'CAREO'
ORDER BY TIMESTAMP DESC;

-- =====================================================
-- QUERY 3: HOW-PROVENANCE
-- =====================================================
-- Trace the status transitions of a specific appointment
-- This demonstrates how an appointment evolved over time
-- (Derivation/transformation history)

SELECT 
    APPOINTMENT_ID,
    OLD_STATUS,
    NEW_STATUS,
    OLD_APPOINTMENT_DATE,
    NEW_APPOINTMENT_DATE,
    OLD_DOCTOR_ID,
    NEW_DOCTOR_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID,
    REASON
FROM AUDIT_APPOINTMENTS
WHERE APPOINTMENT_ID = 1
ORDER BY TIMESTAMP;

-- =====================================================
-- QUERY 4: COMPREHENSIVE AUDIT SUMMARY
-- =====================================================
-- This query provides an overview of all audit activities
-- Shows the complete audit trail across all tables

SELECT 
    'PATIENTS' as TABLE_NAME,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES
FROM AUDIT_PATIENTS
UNION ALL
SELECT 
    'DOCTORS' as TABLE_NAME,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES
FROM AUDIT_DOCTORS
UNION ALL
SELECT 
    'APPOINTMENTS' as TABLE_NAME,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES
FROM AUDIT_APPOINTMENTS
UNION ALL
SELECT 
    'MEDICAL_RECORDS' as TABLE_NAME,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES
FROM AUDIT_MEDICAL_RECORDS
UNION ALL
SELECT 
    'PRESCRIPTIONS' as TABLE_NAME,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES
FROM AUDIT_PRESCRIPTIONS;

-- =====================================================
-- QUERY 5: PATIENT DATA LINEAGE
-- =====================================================
-- This query shows the complete lineage of a patient's data across all tables
-- Demonstrates data flow and relationships

SELECT 
    'PATIENT_INFO' as DATA_TYPE,
    p.PATIENT_ID,
    p.NAME,
    p.EMAIL,
    p.PHONE,
    'CURRENT' as STATUS
FROM PATIENTS p
WHERE p.PATIENT_ID = 1
UNION ALL
SELECT 
    'APPOINTMENTS' as DATA_TYPE,
    a.PATIENT_ID,
    a.NOTES as DESCRIPTION,
    a.STATUS,
    TO_CHAR(a.APPOINTMENT_DATE, 'YYYY-MM-DD') as DATE_INFO,
    'CURRENT' as STATUS
FROM APPOINTMENTS a
WHERE a.PATIENT_ID = 1
UNION ALL
SELECT 
    'MEDICAL_RECORDS' as DATA_TYPE,
    mr.PATIENT_ID,
    mr.DIAGNOSIS as DESCRIPTION,
    mr.TREATMENT_PLAN,
    TO_CHAR(mr.VISIT_DATE, 'YYYY-MM-DD') as DATE_INFO,
    'CURRENT' as STATUS
FROM MEDICAL_RECORDS mr
WHERE mr.PATIENT_ID = 1
UNION ALL
SELECT 
    'PRESCRIPTIONS' as DATA_TYPE,
    pr.PATIENT_ID,
    med.NAME as DESCRIPTION,
    pr.STATUS,
    TO_CHAR(pr.START_DATE, 'YYYY-MM-DD') as DATE_INFO,
    'CURRENT' as STATUS
FROM PRESCRIPTIONS pr
JOIN MEDICATIONS med ON pr.MEDICATION_ID = med.MEDICATION_ID
WHERE pr.PATIENT_ID = 1;

-- =====================================================
-- QUERY 6: DOCTOR ACTIVITY TRACKING
-- =====================================================
-- Track all activities performed by a specific doctor
-- Shows doctor's involvement in patient care

SELECT 
    d.NAME as DOCTOR_NAME,
    d.SPECIALIZATION,
    COUNT(a.APPOINTMENT_ID) as TOTAL_APPOINTMENTS,
    COUNT(mr.RECORD_ID) as TOTAL_MEDICAL_RECORDS,
    COUNT(pr.PRESCRIPTION_ID) as TOTAL_PRESCRIPTIONS
FROM DOCTORS d
LEFT JOIN APPOINTMENTS a ON d.DOCTOR_ID = a.DOCTOR_ID
LEFT JOIN MEDICAL_RECORDS mr ON d.DOCTOR_ID = mr.DOCTOR_ID
LEFT JOIN PRESCRIPTIONS pr ON d.DOCTOR_ID = pr.DOCTOR_ID
WHERE d.DOCTOR_ID = 1
GROUP BY d.NAME, d.SPECIALIZATION;

-- =====================================================
-- QUERY 7: MEDICATION CHANGE HISTORY
-- =====================================================
-- Track all changes to medication prescriptions
-- Shows medication dosage and frequency modifications

SELECT 
    p.NAME as PATIENT_NAME,
    med.NAME as MEDICATION_NAME,
    ap.OLD_DOSAGE,
    ap.NEW_DOSAGE,
    ap.OLD_FREQUENCY,
    ap.NEW_FREQUENCY,
    ap.OLD_STATUS,
    ap.NEW_STATUS,
    ap.OPERATION_TYPE,
    ap.TIMESTAMP,
    ap.USER_ID
FROM AUDIT_PRESCRIPTIONS ap
JOIN PRESCRIPTIONS pr ON ap.PRESCRIPTION_ID = pr.PRESCRIPTION_ID
JOIN PATIENTS p ON pr.PATIENT_ID = p.PATIENT_ID
JOIN MEDICATIONS med ON pr.MEDICATION_ID = med.MEDICATION_ID
ORDER BY ap.TIMESTAMP DESC;

-- =====================================================
-- QUERY 8: APPOINTMENT RESCHEDULING PATTERNS
-- =====================================================
-- Analyze appointment rescheduling patterns
-- Shows how appointments are modified over time

SELECT 
    p.NAME as PATIENT_NAME,
    d.NAME as DOCTOR_NAME,
    aa.OLD_APPOINTMENT_DATE,
    aa.NEW_APPOINTMENT_DATE,
    aa.OLD_APPOINTMENT_TIME,
    aa.NEW_APPOINTMENT_TIME,
    aa.OLD_STATUS,
    aa.NEW_STATUS,
    aa.OPERATION_TYPE,
    aa.TIMESTAMP,
    aa.USER_ID,
    aa.REASON
FROM AUDIT_APPOINTMENTS aa
JOIN APPOINTMENTS a ON aa.APPOINTMENT_ID = a.APPOINTMENT_ID
JOIN PATIENTS p ON a.PATIENT_ID = p.PATIENT_ID
JOIN DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID
WHERE aa.OPERATION_TYPE = 'UPDATE'
ORDER BY aa.TIMESTAMP DESC;

-- =====================================================
-- QUERY 9: DIAGNOSIS EVOLUTION TRACKING
-- =====================================================
-- Track how patient diagnoses change over time
-- Shows the evolution of medical understanding

SELECT 
    p.NAME as PATIENT_NAME,
    d.NAME as DOCTOR_NAME,
    amr.OLD_DIAGNOSIS,
    amr.NEW_DIAGNOSIS,
    amr.OLD_TREATMENT_PLAN,
    amr.NEW_TREATMENT_PLAN,
    amr.OPERATION_TYPE,
    amr.TIMESTAMP,
    amr.USER_ID
FROM AUDIT_MEDICAL_RECORDS amr
JOIN MEDICAL_RECORDS mr ON amr.RECORD_ID = mr.RECORD_ID
JOIN PATIENTS p ON mr.PATIENT_ID = p.PATIENT_ID
JOIN DOCTORS d ON mr.DOCTOR_ID = d.DOCTOR_ID
ORDER BY amr.TIMESTAMP DESC;

-- =====================================================
-- QUERY 10: USER ACCESS PATTERN ANALYSIS
-- =====================================================
-- Analyze which users are making changes to which tables
-- Shows data access patterns and user activity

SELECT 
    USER_ID,
    COUNT(*) as TOTAL_CHANGES,
    SUM(CASE WHEN OPERATION_TYPE = 'INSERT' THEN 1 ELSE 0 END) as INSERTS,
    SUM(CASE WHEN OPERATION_TYPE = 'UPDATE' THEN 1 ELSE 0 END) as UPDATES,
    SUM(CASE WHEN OPERATION_TYPE = 'DELETE' THEN 1 ELSE 0 END) as DELETES,
    MIN(TIMESTAMP) as FIRST_ACTIVITY,
    MAX(TIMESTAMP) as LAST_ACTIVITY
FROM (
    SELECT USER_ID, OPERATION_TYPE, TIMESTAMP FROM AUDIT_PATIENTS
    UNION ALL
    SELECT USER_ID, OPERATION_TYPE, TIMESTAMP FROM AUDIT_DOCTORS
    UNION ALL
    SELECT USER_ID, OPERATION_TYPE, TIMESTAMP FROM AUDIT_APPOINTMENTS
    UNION ALL
    SELECT USER_ID, OPERATION_TYPE, TIMESTAMP FROM AUDIT_MEDICAL_RECORDS
    UNION ALL
    SELECT USER_ID, OPERATION_TYPE, TIMESTAMP FROM AUDIT_PRESCRIPTIONS
)
GROUP BY USER_ID
ORDER BY TOTAL_CHANGES DESC;

-- =====================================================
-- QUERY 11: RECENT ACTIVITY DASHBOARD
-- =====================================================
-- Show recent activity across all tables
-- Useful for real-time monitoring

SELECT 
    'PATIENTS' as TABLE_NAME,
    PATIENT_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_PATIENTS
WHERE TIMESTAMP >= SYSTIMESTAMP - INTERVAL '7' DAY
UNION ALL
SELECT 
    'DOCTORS' as TABLE_NAME,
    DOCTOR_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_DOCTORS
WHERE TIMESTAMP >= SYSTIMESTAMP - INTERVAL '7' DAY
UNION ALL
SELECT 
    'APPOINTMENTS' as TABLE_NAME,
    APPOINTMENT_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_APPOINTMENTS
WHERE TIMESTAMP >= SYSTIMESTAMP - INTERVAL '7' DAY
UNION ALL
SELECT 
    'MEDICAL_RECORDS' as TABLE_NAME,
    RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_MEDICAL_RECORDS
WHERE TIMESTAMP >= SYSTIMESTAMP - INTERVAL '7' DAY
UNION ALL
SELECT 
    'PRESCRIPTIONS' as TABLE_NAME,
    PRESCRIPTION_ID as RECORD_ID,
    OPERATION_TYPE,
    TIMESTAMP,
    USER_ID
FROM AUDIT_PRESCRIPTIONS
WHERE TIMESTAMP >= SYSTIMESTAMP - INTERVAL '7' DAY
ORDER BY TIMESTAMP DESC;

-- =====================================================
-- QUERY 12: DATA INTEGRITY VERIFICATION
-- =====================================================
-- Verify that audit trails are complete
-- Ensures all changes are being tracked

SELECT 
    'PATIENTS' as TABLE_NAME,
    COUNT(*) as CURRENT_RECORDS,
    (SELECT COUNT(*) FROM AUDIT_PATIENTS) as AUDIT_RECORDS
FROM PATIENTS
UNION ALL
SELECT 
    'DOCTORS' as TABLE_NAME,
    COUNT(*) as CURRENT_RECORDS,
    (SELECT COUNT(*) FROM AUDIT_DOCTORS) as AUDIT_RECORDS
FROM DOCTORS
UNION ALL
SELECT 
    'APPOINTMENTS' as TABLE_NAME,
    COUNT(*) as CURRENT_RECORDS,
    (SELECT COUNT(*) FROM AUDIT_APPOINTMENTS) as AUDIT_RECORDS
FROM APPOINTMENTS
UNION ALL
SELECT 
    'MEDICAL_RECORDS' as TABLE_NAME,
    COUNT(*) as CURRENT_RECORDS,
    (SELECT COUNT(*) FROM AUDIT_MEDICAL_RECORDS) as AUDIT_RECORDS
FROM MEDICAL_RECORDS
UNION ALL
SELECT 
    'PRESCRIPTIONS' as TABLE_NAME,
    COUNT(*) as CURRENT_RECORDS,
    (SELECT COUNT(*) FROM AUDIT_PRESCRIPTIONS) as AUDIT_RECORDS
FROM PRESCRIPTIONS;

-- =====================================================
-- END OF PROVENANCE QUERIES
-- =====================================================
-- These queries demonstrate the three types of provenance:
-- 1. Why-Provenance: Justification for data changes
-- 2. Where-Provenance: Source and lineage tracking
-- 3. How-Provenance: Transformation and evolution history
-- =====================================================
