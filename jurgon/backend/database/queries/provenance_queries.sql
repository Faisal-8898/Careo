-- =====================================================
-- Healthcare Patient Record Management System
-- Provenance Queries for Data Lineage and History Analysis
-- =====================================================
-- This file contains comprehensive provenance queries that demonstrate
-- Why, Where, and How provenance tracking in healthcare context
-- =====================================================

-- =====================================================
-- WHY PROVENANCE QUERIES (Justification & Reasoning)
-- =====================================================

-- =====================================================
-- Query 1: List all critical status changes for a patient over time
-- WHY PROVENANCE: Understanding why patient status changed to critical
-- =====================================================

-- Query 1a: Basic critical status change history
SELECT 
    p.first_name || ' ' || p.last_name as patient_name,
    p.patient_id,
    amr.operation_timestamp,
    amr.old_critical_status,
    amr.new_critical_status,
    amr.change_reason,
    amr.operator_user_id as changed_by,
    amr.ip_address,
    -- Extract affected fields to understand what triggered the change
    amr.new_critical_notes as why_critical,
    amr.new_symptoms,
    amr.new_diagnosis
FROM audit_medical_records amr
JOIN patients p ON amr.new_patient_id = p.patient_id
WHERE amr.operation_type = 'UPDATE'
AND (amr.old_critical_status != amr.new_critical_status)
AND amr.new_critical_status IN ('ATTENTION', 'CRITICAL')
AND p.patient_id = &patient_id  -- Parameter: specific patient
ORDER BY amr.operation_timestamp DESC;

-- Query 1b: Critical status changes with doctor and nurse context
SELECT 
    p.first_name || ' ' || p.last_name as patient_name,
    amr.operation_timestamp as change_date,
    amr.old_critical_status || ' → ' || amr.new_critical_status as status_change,
    d.first_name || ' ' || d.last_name as attending_doctor,
    n.first_name || ' ' || n.last_name as nurse_assigned,
    amr.new_nurse_task as nurse_task,
    amr.new_critical_notes as justification,
    amr.change_reason as why_changed,
    s.specialization_name as doctor_specialty
FROM audit_medical_records amr
JOIN patients p ON amr.new_patient_id = p.patient_id
LEFT JOIN doctors d ON amr.new_doctor_id = d.doctor_id
LEFT JOIN nurses n ON amr.new_nurse_id = n.nurse_id
LEFT JOIN specializations s ON d.specialization_id = s.specialization_id
WHERE amr.operation_type = 'UPDATE'
AND (amr.old_critical_status != amr.new_critical_status)
ORDER BY amr.operation_timestamp DESC;

-- =====================================================
-- Query 2: Track all prescription changes for a specific medicine
-- WHY PROVENANCE: Understanding why prescriptions were modified
-- =====================================================

SELECT 
    p.first_name || ' ' || p.last_name as patient_name,
    apm.operation_timestamp,
    apm.operation_type,
    apm.old_medicine_name,
    apm.new_medicine_name,
    apm.old_dosage || ' → ' || apm.new_dosage as dosage_change,
    apm.old_frequency || ' → ' || apm.new_frequency as frequency_change,
    apm.change_reason as why_changed,
    apm.operator_user_id as changed_by,
    d.first_name || ' ' || d.last_name as prescribing_doctor
FROM audit_prescription_medicines apm
JOIN audit_prescriptions ap ON apm.new_prescription_id = ap.prescription_id
JOIN audit_medical_records amr ON ap.new_record_id = amr.record_id
JOIN patients p ON amr.new_patient_id = p.patient_id
JOIN doctors d ON amr.new_doctor_id = d.doctor_id
WHERE UPPER(apm.new_medicine_name) LIKE UPPER('%&medicine_name%')  -- Parameter: medicine name
OR UPPER(apm.old_medicine_name) LIKE UPPER('%&medicine_name%')
ORDER BY apm.operation_timestamp DESC;

-- =====================================================
-- Query 3: Find all appointment cancellations and their reasons
-- WHY PROVENANCE: Understanding appointment workflow disruptions
-- =====================================================

SELECT 
    p.first_name || ' ' || p.last_name as patient_name,
    d.first_name || ' ' || d.last_name as doctor_name,
    aa.old_appointment_date as original_date,
    aa.old_appointment_time as original_time,
    aa.operation_timestamp as cancelled_when,
    aa.old_appointment_status || ' → ' || aa.new_appointment_status as status_change,
    aa.change_reason as why_cancelled,
    aa.operator_user_id as cancelled_by,
    aa.ip_address,
    s.specialization_name,
    dp.department_name
FROM audit_appointments aa
JOIN patients p ON aa.new_patient_id = p.patient_id
JOIN doctors d ON aa.new_doctor_id = d.doctor_id
JOIN specializations s ON d.specialization_id = s.specialization_id
LEFT JOIN departments dp ON d.department_id = dp.department_id
WHERE aa.operation_type IN ('UPDATE', 'DELETE')
AND (aa.new_appointment_status = 'CANCELLED' OR aa.operation_type = 'DELETE')
AND aa.operation_timestamp >= SYSDATE - 30  -- Last 30 days
ORDER BY aa.operation_timestamp DESC;

-- =====================================================
-- WHERE PROVENANCE QUERIES (Data Lineage & Source)
-- =====================================================

-- =====================================================
-- Query 4: Complete data lineage for a patient's medical journey
-- WHERE PROVENANCE: Track patient data flow through the system
-- =====================================================

WITH patient_journey AS (
    SELECT 'USER_CREATION' as event_type, au.operation_timestamp as event_date, 
           au.operator_user_id as actor, au.ip_address, 'User account created' as description,
           1 as sort_order
    FROM audit_users au 
    JOIN patients p ON au.user_id = p.user_id
    WHERE p.patient_id = &patient_id
    
    UNION ALL
    
    SELECT 'PATIENT_REGISTRATION', ap.operation_timestamp, ap.operator_user_id, ap.ip_address,
           'Patient profile created', 2
    FROM audit_patients ap
    WHERE ap.patient_id = &patient_id AND ap.operation_type = 'INSERT'
    
    UNION ALL
    
    SELECT 'APPOINTMENT_BOOKED', aa.operation_timestamp, aa.operator_user_id, aa.ip_address,
           'Appointment scheduled with Dr. ' || d.first_name || ' ' || d.last_name, 3
    FROM audit_appointments aa
    JOIN doctors d ON aa.new_doctor_id = d.doctor_id
    WHERE aa.new_patient_id = &patient_id AND aa.operation_type = 'INSERT'
    
    UNION ALL
    
    SELECT 'MEDICAL_RECORD_CREATED', amr.operation_timestamp, amr.operator_user_id, amr.ip_address,
           'Medical record created - ' || SUBSTR(amr.new_diagnosis, 1, 50), 4
    FROM audit_medical_records amr
    WHERE amr.new_patient_id = &patient_id AND amr.operation_type = 'INSERT'
    
    UNION ALL
    
    SELECT 'PRESCRIPTION_ISSUED', ap.operation_timestamp, ap.operator_user_id, ap.ip_address,
           'Prescription created', 5
    FROM audit_prescriptions ap
    JOIN audit_medical_records amr ON ap.new_record_id = amr.record_id
    WHERE amr.new_patient_id = &patient_id AND ap.operation_type = 'INSERT'
    
    UNION ALL
    
    SELECT 'DATA_ACCESS', ada.access_timestamp, ada.user_id, ada.ip_address,
           'Patient data accessed: ' || ada.access_purpose, 6
    FROM audit_data_access ada
    WHERE ada.table_name = 'PATIENTS' AND ada.record_id = TO_CHAR(&patient_id)
)
SELECT event_type, event_date, actor, ip_address, description
FROM patient_journey
ORDER BY event_date, sort_order;

-- =====================================================
-- Query 5: Source system and user tracking for all patient data changes
-- WHERE PROVENANCE: Understanding who modified patient data and from where
-- =====================================================

SELECT 
    event_type,
    change_date,
    data_source,
    user_location,
    user_session,
    change_description,
    affected_table
FROM (
    -- Patient profile changes
    SELECT 'PATIENT_UPDATE' as event_type,
           ap.operation_timestamp as change_date,
           ap.operator_user_id as data_source,
           ap.ip_address as user_location,
           ap.operator_user_id as user_session,
           'Patient: ' || COALESCE(ap.new_first_name, ap.old_first_name) || ' ' || 
           COALESCE(ap.new_last_name, ap.old_last_name) || ' - ' || ap.change_reason as change_description,
           'PATIENTS' as affected_table
    FROM audit_patients ap
    WHERE ap.patient_id = &patient_id
    
    UNION ALL
    
    -- Medical record changes
    SELECT 'MEDICAL_RECORD_UPDATE',
           amr.operation_timestamp,
           amr.operator_user_id,
           amr.ip_address,
           amr.operator_user_id,
           'Medical Record ID: ' || amr.record_id || ' - ' || amr.change_reason,
           'MEDICAL_RECORDS'
    FROM audit_medical_records amr
    WHERE amr.new_patient_id = &patient_id OR amr.old_patient_id = &patient_id
    
    UNION ALL
    
    -- Prescription changes
    SELECT 'PRESCRIPTION_UPDATE',
           apm.operation_timestamp,
           apm.operator_user_id,
           apm.ip_address,
           apm.operator_user_id,
           'Medicine: ' || COALESCE(apm.new_medicine_name, apm.old_medicine_name) || ' - ' || apm.change_reason,
           'PRESCRIPTION_MEDICINES'
    FROM audit_prescription_medicines apm
    JOIN audit_prescriptions ap ON apm.new_prescription_id = ap.prescription_id
    JOIN audit_medical_records amr ON ap.new_record_id = amr.record_id
    WHERE amr.new_patient_id = &patient_id
)
ORDER BY change_date DESC;

-- =====================================================
-- HOW PROVENANCE QUERIES (Transformation & Evolution)
-- =====================================================

-- =====================================================
-- Query 6: Patient profile evolution over time
-- HOW PROVENANCE: Track how patient information changed
-- =====================================================

SELECT 
    ap.operation_timestamp as change_date,
    ap.operation_type,
    CASE 
        WHEN ap.old_first_name != ap.new_first_name THEN 
            'Name: ' || ap.old_first_name || ' → ' || ap.new_first_name
        WHEN ap.old_contact_phone != ap.new_contact_phone THEN 
            'Phone: ' || ap.old_contact_phone || ' → ' || ap.new_contact_phone
        WHEN ap.old_address_line1 != ap.new_address_line1 THEN 
            'Address: ' || ap.old_address_line1 || ' → ' || ap.new_address_line1
        WHEN ap.old_emergency_contact_name != ap.new_emergency_contact_name THEN 
            'Emergency Contact: ' || ap.old_emergency_contact_name || ' → ' || ap.new_emergency_contact_name
        ELSE 'Other changes'
    END as transformation,
    ap.change_reason as why_changed,
    ap.operator_user_id as changed_by
FROM audit_patients ap
WHERE ap.patient_id = &patient_id
AND ap.operation_type = 'UPDATE'
ORDER BY ap.operation_timestamp;

-- =====================================================
-- Query 7: Medicine prescription evolution for a patient
-- HOW PROVENANCE: Track how medications changed over treatment course
-- =====================================================

WITH prescription_timeline AS (
    SELECT 
        apm.operation_timestamp,
        apm.operation_type,
        apm.old_medicine_name,
        apm.new_medicine_name,
        apm.old_dosage,
        apm.new_dosage,
        apm.old_frequency,
        apm.new_frequency,
        apm.change_reason,
        ROW_NUMBER() OVER (ORDER BY apm.operation_timestamp) as sequence_num
    FROM audit_prescription_medicines apm
    JOIN audit_prescriptions ap ON apm.new_prescription_id = ap.prescription_id
    JOIN audit_medical_records amr ON ap.new_record_id = amr.record_id
    WHERE amr.new_patient_id = &patient_id
)
SELECT 
    pt.operation_timestamp as change_date,
    pt.sequence_num as step_number,
    CASE pt.operation_type
        WHEN 'INSERT' THEN 'Added: ' || pt.new_medicine_name || ' (' || pt.new_dosage || ', ' || pt.new_frequency || ')'
        WHEN 'UPDATE' THEN 'Modified: ' || pt.old_medicine_name || 
            CASE WHEN pt.old_dosage != pt.new_dosage THEN ' | Dosage: ' || pt.old_dosage || ' → ' || pt.new_dosage ELSE '' END ||
            CASE WHEN pt.old_frequency != pt.new_frequency THEN ' | Frequency: ' || pt.old_frequency || ' → ' || pt.new_frequency ELSE '' END
        WHEN 'DELETE' THEN 'Removed: ' || pt.old_medicine_name
    END as transformation_step,
    pt.change_reason as medical_justification
FROM prescription_timeline pt
ORDER BY pt.operation_timestamp;

-- =====================================================
-- Query 8: Complete appointment workflow transformation
-- HOW PROVENANCE: Track appointment lifecycle from booking to completion
-- =====================================================

SELECT 
    aa.operation_timestamp as change_date,
    aa.operation_type,
    p.first_name || ' ' || p.last_name as patient_name,
    d.first_name || ' ' || d.last_name as doctor_name,
    CASE aa.operation_type
        WHEN 'INSERT' THEN 'Appointment Scheduled: ' || TO_CHAR(aa.new_appointment_date, 'DD-MON-YYYY') || 
                          ' at ' || TO_CHAR(aa.new_appointment_time, 'HH24:MI')
        WHEN 'UPDATE' THEN 'Status Changed: ' || aa.old_appointment_status || ' → ' || aa.new_appointment_status
        WHEN 'DELETE' THEN 'Appointment Cancelled/Deleted'
    END as workflow_step,
    aa.change_reason as step_reason,
    -- Check if medical record was created
    CASE WHEN mr.record_id IS NOT NULL THEN 'Medical Record Created (ID: ' || mr.record_id || ')' ELSE 'No Medical Record' END as outcome
FROM audit_appointments aa
JOIN patients p ON COALESCE(aa.new_patient_id, aa.old_patient_id) = p.patient_id
JOIN doctors d ON COALESCE(aa.new_doctor_id, aa.old_doctor_id) = d.doctor_id
LEFT JOIN medical_records mr ON COALESCE(aa.new_appointment_id, aa.old_appointment_id) = mr.appointment_id
WHERE COALESCE(aa.new_appointment_id, aa.old_appointment_id) = &appointment_id  -- Parameter: specific appointment
ORDER BY aa.operation_timestamp;

-- =====================================================
-- COMPREHENSIVE PROVENANCE ANALYSIS QUERIES
-- =====================================================

-- =====================================================
-- Query 9: Hospital-wide audit summary for compliance reporting
-- COMPREHENSIVE PROVENANCE: Overview of all changes by user type and timeframe
-- =====================================================

SELECT 
    audit_week,
    user_type,
    table_affected,
    operation_count,
    unique_users,
    critical_changes
FROM (
    SELECT 
        TO_CHAR(operation_timestamp, 'YYYY-IW') as audit_week,
        'PATIENT' as user_type,
        'PATIENTS' as table_affected,
        COUNT(*) as operation_count,
        COUNT(DISTINCT operator_user_id) as unique_users,
        SUM(CASE WHEN change_reason LIKE '%critical%' OR change_reason LIKE '%emergency%' THEN 1 ELSE 0 END) as critical_changes
    FROM audit_patients
    WHERE operation_timestamp >= SYSDATE - 90
    GROUP BY TO_CHAR(operation_timestamp, 'YYYY-IW')
    
    UNION ALL
    
    SELECT 
        TO_CHAR(operation_timestamp, 'YYYY-IW'),
        'MEDICAL_STAFF',
        'MEDICAL_RECORDS',
        COUNT(*),
        COUNT(DISTINCT operator_user_id),
        SUM(CASE WHEN new_critical_status IN ('ATTENTION', 'CRITICAL') THEN 1 ELSE 0 END)
    FROM audit_medical_records
    WHERE operation_timestamp >= SYSDATE - 90
    GROUP BY TO_CHAR(operation_timestamp, 'YYYY-IW')
    
    UNION ALL
    
    SELECT 
        TO_CHAR(operation_timestamp, 'YYYY-IW'),
        'MEDICAL_STAFF',
        'PRESCRIPTIONS',
        COUNT(*),
        COUNT(DISTINCT operator_user_id),
        0
    FROM audit_prescriptions
    WHERE operation_timestamp >= SYSDATE - 90
    GROUP BY TO_CHAR(operation_timestamp, 'YYYY-IW')
)
ORDER BY audit_week DESC, user_type, table_affected;

-- =====================================================
-- Query 10: Data access patterns and security audit
-- COMPREHENSIVE PROVENANCE: Who accessed what data when and why
-- =====================================================

SELECT 
    access_date,
    user_role,
    access_pattern,
    patient_count,
    total_accesses,
    security_risk_score
FROM (
    SELECT 
        TRUNC(ada.access_timestamp) as access_date,
        CASE 
            WHEN ada.user_id LIKE '%DOCTOR%' THEN 'DOCTOR'
            WHEN ada.user_id LIKE '%NURSE%' THEN 'NURSE'  
            WHEN ada.user_id LIKE '%ADMIN%' THEN 'ADMIN'
            ELSE 'PATIENT'
        END as user_role,
        ada.access_purpose as access_pattern,
        COUNT(DISTINCT ada.record_id) as patient_count,
        COUNT(*) as total_accesses,
        CASE 
            WHEN COUNT(*) > 100 THEN 'HIGH'
            WHEN COUNT(*) > 50 THEN 'MEDIUM' 
            ELSE 'LOW' 
        END as security_risk_score
    FROM audit_data_access ada
    WHERE ada.access_timestamp >= SYSDATE - 7  -- Last 7 days
    AND ada.table_name = 'PATIENTS'
    GROUP BY TRUNC(ada.access_timestamp), 
             CASE 
                WHEN ada.user_id LIKE '%DOCTOR%' THEN 'DOCTOR'
                WHEN ada.user_id LIKE '%NURSE%' THEN 'NURSE'  
                WHEN ada.user_id LIKE '%ADMIN%' THEN 'ADMIN'
                ELSE 'PATIENT'
             END,
             ada.access_purpose
)
ORDER BY access_date DESC, total_accesses DESC;

-- =====================================================
-- PROVENANCE QUERY SUMMARY
-- =====================================================

/*
PROVENANCE QUERIES CREATED: 10 queries covering all three types

WHY PROVENANCE (Justification):
1. Critical status changes with medical justification
2. Prescription modifications and reasons
3. Appointment cancellations and workflow disruptions

WHERE PROVENANCE (Data Lineage):
4. Complete patient data journey through the system  
5. Source tracking for all patient data changes

HOW PROVENANCE (Transformation):
6. Patient profile evolution over time
7. Medicine prescription changes during treatment
8. Appointment workflow lifecycle tracking

COMPREHENSIVE ANALYSIS:
9. Hospital-wide audit summary for compliance
10. Data access patterns and security monitoring

These queries support:
- Healthcare compliance requirements
- Medical audit trails
- Patient safety monitoring  
- Security and privacy compliance
- Clinical decision support
- Quality improvement initiatives
*/

PROMPT =====================================================
PROMPT Healthcare Provenance Queries Created Successfully!
PROMPT =====================================================
PROMPT Total Queries: 10 (covering all provenance types)
PROMPT - WHY Provenance: 3 queries (justification & reasoning)
PROMPT - WHERE Provenance: 2 queries (data lineage & source)  
PROMPT - HOW Provenance: 3 queries (transformation & evolution)
PROMPT - Comprehensive: 2 queries (audit summary & security)
PROMPT =====================================================
PROMPT Use parameters like &patient_id, &medicine_name, &appointment_id
PROMPT =====================================================
