# Database Stored Procedures

## Overview
This folder contains stored procedures for common healthcare operations and business logic. These procedures provide a secure and consistent way to perform complex operations while maintaining audit trails.

## Files
- `patient_procedures.sql` - Patient management procedures
- `doctor_procedures.sql` - Doctor management procedures
- `medical_procedures.sql` - Medical record and prescription procedures
- `audit_procedures.sql` - Audit and provenance analysis procedures

## Features
- **Business Logic Encapsulation**: Complex operations wrapped in procedures
- **Audit Trail Maintenance**: Automatic logging of all operations
- **Data Validation**: Comprehensive input validation and error handling
- **Security**: Role-based access control and parameterized queries
- **Performance**: Optimized queries with proper indexing support

## Usage
Execute these procedures after creating the core schema and triggers to enable advanced healthcare operations.
