-- =====================================================
-- Healthcare Patient Record Management System
-- Mock Data for Testing and Development
-- =====================================================
-- This file contains minimal test data for healthcare system
-- including admin, reference data, and sample healthcare records
-- =====================================================

-- SQL*Plus settings for proper execution
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;
SET ECHO OFF;
SET VERIFY OFF;
SET SERVEROUTPUT ON;

-- =====================================================
-- 1. REFERENCE DATA (Departments & Specializations)
-- =====================================================

-- Insert Departments
INSERT INTO departments (department_id, department_name, location) VALUES 
(seq_department_id.NEXTVAL, 'Emergency Department', 'Building A, Ground Floor');
INSERT INTO departments (department_id, department_name, location) VALUES 
(seq_department_id.NEXTVAL, 'Cardiology', 'Building B, 2nd Floor');
INSERT INTO departments (department_id, department_name, location) VALUES 
(seq_department_id.NEXTVAL, 'Internal Medicine', 'Building A, 3rd Floor');

-- Insert Specializations  
INSERT INTO specializations (specialization_id, specialization_name, description) VALUES 
(seq_specialization_id.NEXTVAL, 'Emergency Medicine', 'Acute care and emergency medical services');
INSERT INTO specializations (specialization_id, specialization_name, description) VALUES 
(seq_specialization_id.NEXTVAL, 'Cardiology', 'Heart and cardiovascular system disorders');
INSERT INTO specializations (specialization_id, specialization_name, description) VALUES 
(seq_specialization_id.NEXTVAL, 'Internal Medicine', 'Adult disease prevention, diagnosis and treatment');

-- =====================================================
-- 2. ADMIN USER (Faisal)
-- =====================================================

-- Insert Admin User Account and Profile in a PL/SQL block to handle CURRVAL properly
DECLARE
    v_user_id NUMBER;
BEGIN
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'faisal@gmail.com', '1234', 'ADMIN')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO admins (admin_id, user_id, first_name, last_name, department_id, employee_id, contact_phone, access_level) VALUES 
    (seq_admin_id.NEXTVAL, v_user_id, 'Faisal', 'Ahmed', 1, 'ADM001', '+1-555-0001', 'SUPER_ADMIN');
END;
/

-- =====================================================
-- 3. SAMPLE DOCTORS
-- =====================================================

-- Doctors in PL/SQL block
DECLARE
    v_user_id NUMBER;
BEGIN
    -- Doctor 1: Emergency Medicine
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'dr.smith@hospital.com', 'doc123', 'DOCTOR')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO doctors (doctor_id, user_id, first_name, last_name, specialization_id, department_id, medical_degree, university, experience_years, contact_phone) VALUES 
    (seq_doctor_id.NEXTVAL, v_user_id, 'John', 'Smith', 1, 1, 'MD', 'Harvard Medical School', 8, '+1-555-0002');

    -- Doctor 2: Cardiology
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'dr.johnson@hospital.com', 'doc456', 'DOCTOR')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO doctors (doctor_id, user_id, first_name, last_name, specialization_id, department_id, medical_degree, university, experience_years, contact_phone) VALUES 
    (seq_doctor_id.NEXTVAL, v_user_id, 'Sarah', 'Johnson', 2, 2, 'MD', 'Johns Hopkins University', 12, '+1-555-0003');
END;
/

-- =====================================================
-- 4. SAMPLE NURSES
-- =====================================================

-- Nurses in PL/SQL block
DECLARE
    v_user_id NUMBER;
BEGIN
    -- Nurse 1: Emergency Department
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'nurse.williams@hospital.com', 'nurse123', 'NURSE')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO nurses (nurse_id, user_id, first_name, last_name, department_id, nursing_degree, experience_years, contact_phone) VALUES 
    (seq_nurse_id.NEXTVAL, v_user_id, 'Emily', 'Williams', 1, 'BSN', 5, '+1-555-0004');

    -- Nurse 2: Cardiology
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'nurse.brown@hospital.com', 'nurse456', 'NURSE')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO nurses (nurse_id, user_id, first_name, last_name, department_id, nursing_degree, experience_years, contact_phone) VALUES 
    (seq_nurse_id.NEXTVAL, v_user_id, 'Michael', 'Brown', 2, 'RN', 7, '+1-555-0005');
END;
/

-- =====================================================
-- 5. SAMPLE PATIENTS
-- =====================================================

-- Patients in PL/SQL block
DECLARE
    v_user_id NUMBER;
BEGIN
    -- Patient 1: Regular patient
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'alice.davis@email.com', 'patient123', 'PATIENT')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO patients (patient_id, user_id, first_name, last_name, date_of_birth, gender, blood_type, contact_phone, address_line1, city, state, postal_code, country, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, medical_history_summary, allergies) VALUES 
    (seq_patient_id.NEXTVAL, v_user_id, 'Alice', 'Davis', DATE '1985-03-15', 'FEMALE', 'A+', '+1-555-0006', '123 Main Street', 'Boston', 'MA', '02101', 'USA', 'Bob Davis', '+1-555-0007', 'Spouse', 'No significant medical history', 'Penicillin allergy');

    -- Patient 2: Patient with medical history
    INSERT INTO users (user_id, email, password_hash, user_type) VALUES 
    (seq_user_id.NEXTVAL, 'robert.wilson@email.com', 'patient456', 'PATIENT')
    RETURNING user_id INTO v_user_id;
    
    INSERT INTO patients (patient_id, user_id, first_name, last_name, date_of_birth, gender, blood_type, contact_phone, address_line1, city, state, postal_code, country, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, medical_history_summary, allergies) VALUES 
    (seq_patient_id.NEXTVAL, v_user_id, 'Robert', 'Wilson', DATE '1970-08-22', 'MALE', 'O-', '+1-555-0008', '456 Oak Avenue', 'Boston', 'MA', '02102', 'USA', 'Mary Wilson', '+1-555-0009', 'Spouse', 'Hypertension, Type 2 Diabetes', 'Sulfa drugs');
END;
/

-- =====================================================
-- 6. SAMPLE APPOINTMENTS
-- =====================================================

-- Variables to store IDs for relationships
DECLARE
    v_patient1_id NUMBER;
    v_patient2_id NUMBER;
    v_doctor1_id NUMBER;
    v_doctor2_id NUMBER;
    v_nurse1_id NUMBER;
    v_nurse2_id NUMBER;
    v_appointment1_id NUMBER;
    v_appointment2_id NUMBER;
    v_appointment3_id NUMBER;
    v_record1_id NUMBER;
    v_record2_id NUMBER;
    v_prescription1_id NUMBER;
    v_prescription2_id NUMBER;
BEGIN
    -- Get the generated IDs for patients and doctors
    SELECT patient_id INTO v_patient1_id FROM patients WHERE first_name = 'Alice' AND last_name = 'Davis';
    SELECT patient_id INTO v_patient2_id FROM patients WHERE first_name = 'Robert' AND last_name = 'Wilson';
    SELECT doctor_id INTO v_doctor1_id FROM doctors WHERE first_name = 'John' AND last_name = 'Smith';
    SELECT doctor_id INTO v_doctor2_id FROM doctors WHERE first_name = 'Sarah' AND last_name = 'Johnson';
    SELECT nurse_id INTO v_nurse1_id FROM nurses WHERE first_name = 'Emily' AND last_name = 'Williams';
    SELECT nurse_id INTO v_nurse2_id FROM nurses WHERE first_name = 'Michael' AND last_name = 'Brown';

    -- Appointment 1: Completed emergency visit
    INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason, notes, appointment_status) VALUES 
    (seq_appointment_id.NEXTVAL, v_patient1_id, v_doctor1_id, DATE '2024-01-15', TIMESTAMP '2024-01-15 10:30:00', 'EMERGENCY', 'Chest pain and shortness of breath', 'Patient walked in with acute symptoms', 'COMPLETED')
    RETURNING appointment_id INTO v_appointment1_id;

    -- Appointment 2: Scheduled cardiology follow-up
    INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason, notes, appointment_status) VALUES 
    (seq_appointment_id.NEXTVAL, v_patient2_id, v_doctor2_id, DATE '2024-01-20', TIMESTAMP '2024-01-20 14:00:00', 'FOLLOW_UP', 'Hypertension management', 'Regular follow-up for blood pressure monitoring', 'SCHEDULED')
    RETURNING appointment_id INTO v_appointment2_id;

    -- Appointment 3: Recent consultation
    INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason, notes, appointment_status) VALUES 
    (seq_appointment_id.NEXTVAL, v_patient1_id, v_doctor2_id, DATE '2024-01-25', TIMESTAMP '2024-01-25 11:15:00', 'CONSULTATION', 'Cardiac evaluation post-emergency visit', 'Follow-up after emergency department visit', 'COMPLETED')
    RETURNING appointment_id INTO v_appointment3_id;

    -- =====================================================
    -- 7. SAMPLE MEDICAL RECORDS
    -- =====================================================

    -- Medical Record 1: Emergency visit for chest pain
    INSERT INTO medical_records (record_id, patient_id, doctor_id, nurse_id, nurse_task, appointment_id, record_type, chief_complaint, symptoms, physical_examination, diagnosis, treatment_plan, recommendations, critical_status, critical_notes, follow_up_date, follow_up_notes) VALUES 
    (seq_record_id.NEXTVAL, v_patient1_id, v_doctor1_id, v_nurse1_id, 'Monitor vital signs, administer oxygen', v_appointment1_id, 'EMERGENCY', 'Chest pain and shortness of breath', 'Patient reports crushing chest pain radiating to left arm, started 2 hours ago. Associated with shortness of breath and diaphoresis.', 'BP 140/90, HR 95, RR 22, O2 Sat 96% on room air. Heart sounds regular, lungs clear bilaterally. No peripheral edema.', 'Rule out acute coronary syndrome. EKG shows no acute ST changes. Troponins pending.', 'Serial cardiac enzymes, chest X-ray, cardiology consultation. Pain management with nitroglycerin PRN.', 'Cardiology follow-up within 1 week', 'ATTENTION', 'Patient needs close cardiac monitoring', DATE '2024-01-22', 'Schedule stress test if symptoms persist')
    RETURNING record_id INTO v_record1_id;

    -- Medical Record 2: Cardiology follow-up 
    INSERT INTO medical_records (record_id, patient_id, doctor_id, nurse_id, nurse_task, appointment_id, record_type, chief_complaint, symptoms, physical_examination, diagnosis, treatment_plan, recommendations, critical_status, follow_up_date, follow_up_notes) VALUES 
    (seq_record_id.NEXTVAL, v_patient1_id, v_doctor2_id, v_nurse2_id, 'Check blood pressure, review medications', v_appointment3_id, 'CONSULTATION', 'Follow-up after emergency visit', 'Patient reports significant improvement in chest pain. No recent episodes of shortness of breath.', 'BP 130/85, HR 78, regular rhythm. Heart sounds normal, lungs clear. Good exercise tolerance.', 'Stable angina, well controlled. No evidence of acute coronary syndrome.', 'Continue current medications. Lifestyle modifications including diet and exercise.', 'Continue cardiac medications, follow-up in 3 months', 'NORMAL', DATE '2024-04-25', 'Annual stress test recommended')
    RETURNING record_id INTO v_record2_id;

    -- =====================================================
    -- 8. SAMPLE PRESCRIPTIONS
    -- =====================================================

    -- Prescription 1: Emergency department medications
    INSERT INTO prescriptions (prescription_id, record_id, prescription_date, general_instructions) VALUES 
    (seq_prescription_id.NEXTVAL, v_record1_id, DATE '2024-01-15', 'Take medications as directed. Follow up with cardiology. Return to emergency if chest pain worsens.')
    RETURNING prescription_id INTO v_prescription1_id;

    -- Prescription medicines for emergency visit
    INSERT INTO prescription_medicines (medicine_id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
    (seq_prescription_medicine_id.NEXTVAL, v_prescription1_id, 'Aspirin', '81mg', 'Once daily', '30 days', 'Take with food to prevent stomach irritation');

    INSERT INTO prescription_medicines (medicine_id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
    (seq_prescription_medicine_id.NEXTVAL, v_prescription1_id, 'Nitroglycerin', '0.4mg sublingual', 'As needed', '30 days', 'Use for chest pain. May repeat every 5 minutes up to 3 doses. Call 911 if pain persists.');

    -- Prescription 2: Cardiology follow-up medications
    INSERT INTO prescriptions (prescription_id, record_id, prescription_date, general_instructions) VALUES 
    (seq_prescription_id.NEXTVAL, v_record2_id, DATE '2024-01-25', 'Continue current regimen. Monitor blood pressure at home. Follow-up in 3 months.')
    RETURNING prescription_id INTO v_prescription2_id;

    INSERT INTO prescription_medicines (medicine_id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
    (seq_prescription_medicine_id.NEXTVAL, v_prescription2_id, 'Lisinopril', '10mg', 'Once daily', '90 days', 'Take in the morning. Monitor blood pressure weekly.');

    INSERT INTO prescription_medicines (medicine_id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES 
    (seq_prescription_medicine_id.NEXTVAL, v_prescription2_id, 'Metoprolol', '25mg', 'Twice daily', '90 days', 'Take with food. Do not stop abruptly.');

END;
/

-- =====================================================
-- COMMIT ALL CHANGES
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

PROMPT =====================================================
PROMPT Healthcare Mock Data Inserted Successfully!
PROMPT =====================================================

-- Show summary of inserted data
SELECT 'DEPARTMENTS' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 'SPECIALIZATIONS', COUNT(*) FROM specializations  
UNION ALL
SELECT 'USERS', COUNT(*) FROM users
UNION ALL
SELECT 'ADMINS', COUNT(*) FROM admins
UNION ALL  
SELECT 'DOCTORS', COUNT(*) FROM doctors
UNION ALL
SELECT 'NURSES', COUNT(*) FROM nurses
UNION ALL
SELECT 'PATIENTS', COUNT(*) FROM patients
UNION ALL
SELECT 'APPOINTMENTS', COUNT(*) FROM appointments
UNION ALL
SELECT 'MEDICAL_RECORDS', COUNT(*) FROM medical_records
UNION ALL
SELECT 'PRESCRIPTIONS', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'PRESCRIPTION_MEDICINES', COUNT(*) FROM prescription_medicines;

PROMPT =====================================================
PROMPT Admin Login: faisal@gmail.com / Password: 1234
PROMPT =====================================================
PROMPT Sample Data Summary:
PROMPT - 1 Super Admin (Faisal)
PROMPT - 2 Doctors (Emergency Medicine & Cardiology)  
PROMPT - 2 Nurses (Emergency & Cardiology departments)
PROMPT - 2 Patients (with realistic medical histories)
PROMPT - 3 Appointments (completed and scheduled)
PROMPT - 2 Medical Records (emergency and follow-up)
PROMPT - 2 Prescriptions (with multiple medicines each)
PROMPT =====================================================
PROMPT Ready for healthcare system testing!
PROMPT =====================================================

EXIT;
