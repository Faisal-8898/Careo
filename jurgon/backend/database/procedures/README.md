# Healthcare Database Stored Procedures

## Overview

This directory contains Oracle PL/SQL stored procedures that implement core healthcare business logic and workflows. These procedures provide secure, validated, and audited methods for performing complex healthcare operations while maintaining data integrity and compliance.

## Files

### 1. `healthcare_procedures.sql` - Complete Healthcare Workflow Procedures

- **Purpose**: Implements all core healthcare business operations
- **Coverage**: Patient registration, appointments, medical records, prescriptions
- **Features**: Input validation, error handling, automatic audit logging, transaction management

## Healthcare Scenario Alignment

### Patient Role Procedures

- **`sp_register_patient`**: Complete patient registration workflow

  - Creates user account and patient profile atomically
  - Validates email format and prevents duplicate registrations
  - Supports patient self-registration via frontend

- **`sp_book_appointment`**: Patient appointment booking
  - Validates doctor availability and prevents conflicts
  - Supports appointment types: consultation, follow-up, emergency
  - Automatic status tracking and audit logging

### Doctor Role Procedures

- **`sp_create_medical_record`**: Medical documentation workflow

  - Links medical records to completed appointments
  - Supports nurse assignment and task specification
  - Automatic appointment status update to "COMPLETED"
  - Critical status tracking for patient safety

- **`sp_create_prescription`**: Multi-medicine prescription management

  - Creates prescription header with general instructions
  - Supports multiple medicines with individual dosages
  - Flexible medicine parsing from structured input
  - Complete audit trail for prescription changes

- **`sp_get_doctor_dashboard`**: Doctor dashboard data retrieval
  - Today's appointment schedule with patient details
  - Current patient count and workload metrics
  - Recent medical records with edit capabilities
  - Optimized queries for dashboard performance

### Nurse Role Procedures

- **`sp_update_critical_status`**: Patient critical status management
  - Updates patient critical status with nurse assignment
  - Automatic doctor notification for critical/attention cases
  - Compliance logging for patient safety monitoring
  - Audit trail for critical status changes

### Admin Role Procedures

- **`sp_get_patient_timeline`**: Patient medical history timeline
  - Complete chronological view of patient interactions
  - Appointment, medical record, and prescription correlation
  - Date range filtering for focused analysis
  - Supports timeline view for all user roles

## Procedure Specifications

### 1. Patient Registration (`sp_register_patient`)

```sql
PARAMETERS:
- p_email: Patient email address (validated)
- p_password_hash: Encrypted password
- p_first_name, p_last_name: Patient name
- p_date_of_birth: Birth date for age calculation
- p_gender: Gender identity (MALE/FEMALE/OTHER)
- p_blood_type: Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- p_contact_phone: Primary contact number
- p_address_*: Complete address information
- p_emergency_contact_*: Emergency contact details
- p_patient_id OUT: Generated patient ID

FEATURES:
- Atomic transaction (user + patient creation)
- Email format validation
- Duplicate prevention
- Automatic audit logging
```

### 2. Appointment Booking (`sp_book_appointment`)

```sql
PARAMETERS:
- p_patient_id: Valid patient identifier
- p_doctor_id: Valid doctor identifier
- p_appointment_date: Appointment date
- p_appointment_time: Specific appointment time
- p_appointment_type: Type of appointment
- p_reason: Reason for visit
- p_appointment_id OUT: Generated appointment ID

FEATURES:
- Doctor availability validation
- Scheduling conflict prevention
- Patient/doctor existence verification
- Automatic status initialization
```

### 3. Medical Record Creation (`sp_create_medical_record`)

```sql
PARAMETERS:
- p_appointment_id: Linked appointment
- p_record_type: Type of medical record
- p_chief_complaint: Primary patient complaint
- p_symptoms: Detailed symptom description (CLOB)
- p_physical_examination: Examination findings (CLOB)
- p_diagnosis: Medical diagnosis (CLOB)
- p_treatment_plan: Treatment recommendations (CLOB)
- p_recommendations: Follow-up recommendations (CLOB)
- p_critical_status: Patient criticality (NORMAL/ATTENTION/CRITICAL)
- p_nurse_id: Optional nurse assignment
- p_nurse_task: Specific nurse tasks
- p_record_id OUT: Generated record ID

FEATURES:
- Appointment status validation
- Automatic appointment completion
- Critical status tracking
- Nurse assignment support
```

### 4. Multi-Medicine Prescription (`sp_create_prescription`)

```sql
PARAMETERS:
- p_record_id: Linked medical record
- p_general_instructions: Overall prescription guidance
- p_medicines: Structured medicine data string
- p_prescription_id OUT: Generated prescription ID

MEDICINE FORMAT:
"medicine1:dosage1:frequency1:duration1:instructions1|medicine2:dosage2:frequency2:duration2:instructions2"

FEATURES:
- Multiple medicine support
- Individual dosage/frequency tracking
- Structured data parsing
- Prescription header management
```

### 5. Critical Status Update (`sp_update_critical_status`)

```sql
PARAMETERS:
- p_record_id: Medical record to update
- p_critical_status: New critical status
- p_critical_notes: Justification for status change
- p_nurse_id: Nurse making the update

FEATURES:
- Medical record validation
- Automatic doctor notification for critical cases
- Compliance audit logging
- Nurse assignment tracking
```

### 6. Patient Timeline (`sp_get_patient_timeline`)

```sql
PARAMETERS:
- p_patient_id: Patient for timeline
- p_start_date: Optional date range start
- p_end_date: Optional date range end
- p_cursor OUT: Result set cursor

RETURNS:
- Chronological appointment history
- Medical record summaries
- Prescription counts
- Doctor and nurse assignments
- Critical status tracking
```

### 7. Doctor Dashboard (`sp_get_doctor_dashboard`)

```sql
PARAMETERS:
- p_doctor_id: Doctor identifier
- p_date: Dashboard date (default today)
- p_appointments_cursor OUT: Today's appointments
- p_patient_count OUT: Today's patient count
- p_recent_records_cursor OUT: Recent medical records

FEATURES:
- Real-time appointment schedule
- Patient workload metrics
- Recent medical record access
- Performance-optimized queries
```

## Error Handling and Security

### Input Validation

- All parameters validated for data type and constraints
- Business rule validation (appointment conflicts, user existence)
- SQL injection prevention through parameterized queries

### Transaction Management

- Atomic operations with proper commit/rollback
- Consistent error handling across all procedures
- Graceful degradation for system failures

### Audit Integration

- Automatic audit logging for all operations
- User context capture for compliance
- Change reason documentation

### Security Features

- Role-based access control ready
- Input sanitization and validation
- Audit trail for security monitoring

## Healthcare Compliance Features

### HIPAA Alignment

- Patient consent verification support
- Access purpose documentation
- Audit trails for data access

### Medical Safety

- Critical status monitoring and alerts
- Prescription validation and tracking
- Care coordination through nurse assignments

### Regulatory Support

- Complete audit trails for all operations
- Change justification documentation
- User activity tracking

## Usage Examples

### Patient Registration Workflow

```sql
DECLARE
    v_patient_id NUMBER;
BEGIN
    sp_register_patient(
        p_email => 'patient@example.com',
        p_password_hash => 'hashed_password',
        p_first_name => 'John',
        p_last_name => 'Doe',
        -- ... other parameters
        p_patient_id => v_patient_id
    );

    DBMS_OUTPUT.PUT_LINE('Patient ID: ' || v_patient_id);
END;
/
```

### Doctor Creating Medical Record

```sql
DECLARE
    v_record_id NUMBER;
BEGIN
    sp_create_medical_record(
        p_appointment_id => 70001,
        p_record_type => 'CONSULTATION',
        p_diagnosis => 'Hypertension',
        p_treatment_plan => 'Medication and lifestyle changes',
        p_critical_status => 'NORMAL',
        p_record_id => v_record_id
    );
END;
/
```

These procedures provide the backbone for all healthcare operations while ensuring data integrity, audit compliance, and operational efficiency.
