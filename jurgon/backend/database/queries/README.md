# Healthcare Provenance Queries

## Overview

This directory contains comprehensive SQL queries designed to extract provenance information from the Healthcare Patient Record Management System. These queries demonstrate the three fundamental types of provenance tracking: **Why**, **Where**, and **How** provenance, specifically tailored for healthcare scenarios and compliance requirements.

## Files

### 1. `provenance_queries.sql` - Complete Provenance Analysis Suite

- **Purpose**: Implements all three types of provenance queries for healthcare data
- **Coverage**: 10 comprehensive queries spanning patient care, medical records, prescriptions
- **Features**: Parameter-driven queries, audit trail analysis, compliance reporting

## Provenance Types in Healthcare Context

### Why Provenance (Justification & Reasoning)

**Purpose**: Understanding the medical and business reasons behind data changes

**Healthcare Applications**:

- Medical decision justification and audit trails
- Prescription modification reasoning for patient safety
- Critical status change documentation for quality assurance
- Appointment workflow disruption analysis

### Where Provenance (Data Lineage & Source)

**Purpose**: Tracking the complete journey of patient data through the healthcare system

**Healthcare Applications**:

- Patient data flow from registration to treatment
- Source system identification for data integration
- User access patterns for security and compliance
- Data governance and audit trail verification

### How Provenance (Transformation & Evolution)

**Purpose**: Understanding how patient information and treatment plans evolved over time

**Healthcare Applications**:

- Patient profile changes and medical history evolution
- Treatment plan modifications and medication adjustments
- Care workflow progression from appointment to completion
- Clinical decision support through historical analysis

## Query Specifications

### WHY PROVENANCE QUERIES (3 queries)

#### Query 1: Critical Status Change Analysis

```sql
-- Lists all critical status changes for a patient with medical justification
-- Parameters: &patient_id
-- Use Case: Quality assurance, patient safety monitoring
```

**Business Value**:

- Identifies patterns in patient deterioration
- Supports quality improvement initiatives
- Provides audit trail for critical care decisions

#### Query 2: Prescription Modification Tracking

```sql
-- Tracks all prescription changes for specific medicines with reasoning
-- Parameters: &medicine_name
-- Use Case: Drug safety monitoring, prescription audit
```

**Business Value**:

- Supports pharmacovigilance and drug safety
- Enables prescription pattern analysis
- Provides justification for medication changes

#### Query 3: Appointment Cancellation Analysis

```sql
-- Finds all appointment cancellations with reasons and patterns
-- Parameters: Date range (last 30 days)
-- Use Case: Workflow optimization, resource planning
```

**Business Value**:

- Identifies operational inefficiencies
- Supports capacity planning and scheduling optimization
- Tracks patient no-show patterns

### WHERE PROVENANCE QUERIES (2 queries)

#### Query 4: Complete Patient Data Journey

```sql
-- Tracks complete patient data lineage from registration to treatment
-- Parameters: &patient_id
-- Use Case: Compliance audit, data governance
```

**Business Value**:

- Provides complete audit trail for regulatory compliance
- Supports HIPAA compliance reporting
- Enables data lineage verification

#### Query 5: Source System and User Tracking

```sql
-- Identifies who modified patient data and from where
-- Parameters: &patient_id
-- Use Case: Security audit, access control verification
```

**Business Value**:

- Supports security incident investigation
- Enables access pattern analysis
- Provides user activity audit trails

### HOW PROVENANCE QUERIES (3 queries)

#### Query 6: Patient Profile Evolution

```sql
-- Tracks how patient information changed over time
-- Parameters: &patient_id
-- Use Case: Data quality analysis, profile accuracy
```

**Business Value**:

- Identifies data quality issues and trends
- Supports patient profile accuracy verification
- Enables demographic change analysis

#### Query 7: Medicine Prescription Evolution

```sql
-- Tracks medication changes throughout treatment course
-- Parameters: &patient_id
-- Use Case: Treatment effectiveness analysis, clinical research
```

**Business Value**:

- Supports clinical decision making
- Enables treatment outcome analysis
- Provides medication adherence insights

#### Query 8: Appointment Workflow Transformation

```sql
-- Tracks complete appointment lifecycle from booking to completion
-- Parameters: &appointment_id
-- Use Case: Workflow analysis, process improvement
```

**Business Value**:

- Identifies workflow bottlenecks and inefficiencies
- Supports process improvement initiatives
- Enables care coordination analysis

### COMPREHENSIVE ANALYSIS QUERIES (2 queries)

#### Query 9: Hospital-wide Audit Summary

```sql
-- Overview of all changes by user type and timeframe for compliance
-- Parameters: Last 90 days
-- Use Case: Executive reporting, compliance management
```

**Business Value**:

- Provides executive dashboard metrics
- Supports compliance and regulatory reporting
- Enables system-wide audit analysis

#### Query 10: Data Access Patterns and Security

```sql
-- Analysis of who accessed what data when and why
-- Parameters: Last 7 days
-- Use Case: Security monitoring, privacy compliance
```

**Business Value**:

- Supports HIPAA compliance monitoring
- Enables security threat detection
- Provides privacy audit capabilities

## Healthcare Scenario Integration

### Patient Role Support

- **Profile Management**: Track all changes to patient demographics and medical history
- **Medical Records Access**: Audit patient access to their own medical records
- **Timeline View**: Complete chronological view of patient care journey

### Doctor Role Support

- **Medical Documentation**: Audit trail for all medical record creation and updates
- **Prescription Management**: Complete tracking of prescription modifications and reasoning
- **Critical Patient Monitoring**: Analysis of critical status changes and interventions

### Nurse Role Support

- **Critical Status Updates**: Track nurse interventions and status change justifications
- **Task Assignment**: Audit trail for nurse task assignments and patient care coordination
- **Care Handoff**: Documentation of care transitions between shifts

### Admin Role Support

- **User Management**: Complete audit of user account creation, modification, deletion
- **System Configuration**: Track changes to departments, specializations, system settings
- **Compliance Reporting**: Comprehensive audit reports for regulatory requirements
- **Security Monitoring**: Analysis of data access patterns and potential security risks

## Query Usage Examples

### Investigating Critical Patient Status Changes

```sql
-- Find all critical status changes for patient ID 10001
@provenance_queries.sql
-- When prompted, enter: 10001 for patient_id
```

### Tracking Prescription Changes for Specific Medicine

```sql
-- Track all changes for "Lisinopril" prescriptions
@provenance_queries.sql
-- When prompted, enter: Lisinopril for medicine_name
```

### Analyzing Appointment Workflow for Specific Case

```sql
-- Analyze complete workflow for appointment ID 70001
@provenance_queries.sql
-- When prompted, enter: 70001 for appointment_id
```

## Compliance and Regulatory Support

### HIPAA Compliance

- **Access Logs**: Complete audit trail of patient data access
- **Consent Verification**: Tracking of patient consent for data access
- **Breach Investigation**: Detailed analysis capabilities for security incidents

### Medical Audit Requirements

- **Clinical Decision Support**: Justification tracking for medical decisions
- **Prescription Monitoring**: Complete medication change audit trails
- **Quality Assurance**: Patient safety and care quality monitoring

### Data Governance

- **Data Lineage**: Complete tracking of data flow through the system
- **Source Verification**: Identification of data sources and transformations
- **Change Management**: Comprehensive change tracking and approval workflows

## Performance Considerations

### Query Optimization

- All queries use appropriate indexes on audit tables
- Parameter-driven queries for efficient execution
- Date range limitations to manage result set sizes

### Audit Table Design

- Partitioned audit tables for large-scale healthcare systems
- Optimized for both write performance (triggers) and read performance (queries)
- Appropriate retention policies for compliance requirements

## Security and Privacy

### Data Protection

- Queries designed to support HIPAA compliance
- Patient consent verification tracking
- Access purpose documentation and justification

### Audit Trail Integrity

- Immutable audit records with timestamp verification
- User context capture for accountability
- IP address and session tracking for security

These provenance queries provide comprehensive audit capabilities essential for healthcare operations, regulatory compliance, and patient safety monitoring while supporting the specific workflow requirements of each user role in the healthcare management system.
