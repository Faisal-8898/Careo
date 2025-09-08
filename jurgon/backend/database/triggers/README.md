# Healthcare Database Triggers

## Overview

This directory contains Oracle SQL triggers that automatically implement audit logging and business rule enforcement for the Healthcare Patient Record Management System. These triggers ensure complete provenance tracking and workflow automation without manual intervention.

## Files

### 1. `audit_triggers.sql` - Automatic Audit Logging

- **Purpose**: Captures complete audit trail for all data changes
- **Coverage**: All 11 core tables with before/after snapshots
- **Features**: User tracking, IP logging, change reasoning, timestamp precision

### 2. `cascade_triggers.sql` - Business Logic Enforcement

- **Purpose**: Implements healthcare-specific business rules and workflows
- **Features**: Status change automation, critical alerts, validation rules
- **Integration**: Seamless workflow support for all user roles

## Healthcare Scenario Alignment

### Patient Workflow Support

- **Registration**: Automatic user account audit when patients self-register
- **Profile Updates**: Complete tracking of demographic and medical history changes
- **Data Access**: Compliance logging for patient data views

### Doctor Workflow Support

- **Appointment Management**: Status change tracking and completion automation
- **Medical Records**: Complete audit trail for diagnosis and treatment updates
- **Prescription Management**: Multi-medicine tracking with dosage change history

### Nurse Workflow Support

- **Critical Status Updates**: Automatic doctor notification for critical patients
- **Task Assignment**: Audit trail for nurse-patient assignments
- **Care Coordination**: Workflow automation for care handoffs

### Admin Workflow Support

- **User Management**: Complete audit for account creation/modification/deletion
- **System Configuration**: Tracking of department and specialization changes
- **Compliance Monitoring**: Comprehensive audit logs for regulatory requirements

## Trigger Categories

### 1. Core Entity Audit Triggers (11 triggers)

- `trg_audit_users` - User authentication changes
- `trg_audit_patients` - Patient profile modifications
- `trg_audit_doctors` - Doctor information updates
- `trg_audit_nurses` - Nurse profile changes
- `trg_audit_admins` - Admin account modifications
- `trg_audit_appointments` - Appointment lifecycle tracking
- `trg_audit_medical_records` - Medical documentation changes
- `trg_audit_prescriptions` - Prescription header modifications
- `trg_audit_prescription_medicines` - Individual medicine changes
- `trg_audit_specializations` - Medical specialty updates
- `trg_audit_departments` - Hospital department changes

### 2. Business Logic Triggers (7 triggers)

- `trg_appointment_status_change` - Appointment workflow automation
- `trg_critical_status_notification` - Critical patient alerts for doctors
- `trg_prescription_medicine_validation` - Medicine prescription validation
- `trg_patient_data_access` - Patient data access compliance logging
- `trg_medical_record_completion` - Appointment completion automation
- `trg_user_role_validation` - User account validation and tracking
- `trg_nurse_task_assignment` - Nurse care assignment tracking

## Key Features

### Complete Audit Trail

- **Before/After Snapshots**: Full data state capture for all changes
- **User Context**: Session, IP address, and application tracking
- **Change Reasoning**: Automatic categorization of change types
- **Timestamp Precision**: Microsecond-level change timing

### Healthcare Compliance

- **HIPAA Alignment**: Patient data access logging and consent tracking
- **Medical Audit**: Complete medical record and prescription change history
- **Regulatory Support**: Audit trails suitable for healthcare compliance reviews

### Performance Optimization

- **Efficient Execution**: Minimal overhead trigger design
- **Indexed Access**: Audit tables optimized for query performance
- **Batch Processing**: Optimized for high-volume healthcare operations

## Usage Instructions

### Installation Order

1. Execute `core_schema.sql` first
2. Execute `audit_schema.sql` second
3. Execute `audit_triggers.sql` third
4. Execute `cascade_triggers.sql` last

### Monitoring and Maintenance

- All triggers automatically log to `audit_user_actions` table
- Monitor trigger performance using Oracle's trigger statistics
- Review audit logs regularly for compliance and security

## Healthcare Workflow Integration

These triggers seamlessly integrate with the role-based healthcare management system:

- **Patient Timeline View**: Audit data provides complete historical timeline
- **Doctor Dashboard**: Recent changes and critical alerts from trigger actions
- **Nurse Critical Section**: Real-time notifications from critical status triggers
- **Admin Audit Logs**: Complete system change tracking for all operations

The trigger system ensures that every user action in the healthcare system is properly audited and workflow rules are automatically enforced, supporting both operational efficiency and regulatory compliance.
