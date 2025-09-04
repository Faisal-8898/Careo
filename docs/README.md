# Careo - Healthcare Patient Management System

A provenance-enabled healthcare management system that tracks the "why," "where," and "how" of data evolution in patient care.

## 🏥 Project Overview

Careo is a comprehensive healthcare patient management system designed to demonstrate data provenance tracking capabilities. The system captures and maintains complete audit trails of all data changes, enabling transparency, compliance, and accountability in healthcare operations.

## 🎯 Objectives

- Design a normalized relational schema for healthcare management
- Implement comprehensive audit mechanisms for data provenance
- Create SQL triggers and procedures for automatic audit logging
- Develop provenance queries to extract meaningful insights
- Build a modern GUI for data visualization and audit inspection

## 🏗️ Architecture

```
careo/
├── frontend/          # Next.js React application
├── backend/           # Go Gin REST API
├── docs/             # Documentation and SQL scripts
└── database/         # Oracle database scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Go, Gin Framework
- **Database**: Oracle Database
- **Development**: macOS

## 📋 Prerequisites

### 1. Oracle Database Setup

#### Option A: Oracle Database Express Edition (XE) - Recommended for Assignment

1. **Download Oracle Database XE**:

   - Visit: https://www.oracle.com/database/technologies/xe-downloads.html
   - Download Oracle Database 21c Express Edition for macOS

2. **Install Oracle Database XE**:

   ```bash
   # Extract and run the installer
   sudo installer -pkg OracleXE213_Homebrew.pkg -target /
   ```

3. **Set up environment variables**:

   ```bash
   # Add to your ~/.zshrc or ~/.bash_profile
   export ORACLE_HOME=/opt/oracle/product/21c/dbhomeXE
   export PATH=$ORACLE_HOME/bin:$PATH
   export LD_LIBRARY_PATH=$ORACLE_HOME/lib:$LD_LIBRARY_PATH
   ```

4. **Start Oracle Database**:

   ```bash
   # Start the database service
   sudo /opt/oracle/product/21c/dbhomeXE/bin/dbstart
   ```

5. **Connect to database**:
   ```bash
   # Connect as system user
   sqlplus system/oracle@localhost:1521/XE
   ```

#### Option B: Docker Oracle Database (Alternative)

```bash
# Pull Oracle Database image
docker pull container-registry.oracle.com/database/express:latest

# Run Oracle Database container
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=oracle \
  container-registry.oracle.com/database/express:latest
```

### 2. Create Database User and Schema

```sql
-- Connect as system user
sqlplus system/oracle@localhost:1521/XE

-- Create user for Careo application
CREATE USER careo IDENTIFIED BY careo123;

-- Grant necessary privileges
GRANT CONNECT, RESOURCE, DBA TO careo;
GRANT CREATE SESSION TO careo;
GRANT CREATE TABLE TO careo;
GRANT CREATE SEQUENCE TO careo;
GRANT CREATE TRIGGER TO careo;
GRANT CREATE PROCEDURE TO careo;
GRANT CREATE VIEW TO careo;

-- Connect to careo user
CONNECT careo/careo123@localhost:1521/XE
```

## 🚀 Quick Start

### 1. Clone and Setup Project

```bash
# Navigate to project directory
cd careo

# Setup frontend
cd frontend
npm install
npm run dev

# Setup backend (in new terminal)
cd backend
go mod tidy
go run main.go
```

### 2. Environment Configuration

```bash
# Copy environment example
cp backend/env.example backend/.env

# Edit the .env file with your Oracle database credentials
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_USERNAME=careo
DB_PASSWORD=careo123
```

### 3. Database Schema Setup

```bash
# Run the database setup script
sqlplus careo/careo123@localhost:1521/XE @docs/database/schema.sql
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 📊 Database Schema

### Core Tables

- `PATIENTS` - Patient information
- `DOCTORS` - Doctor information
- `DEPARTMENTS` - Hospital departments
- `APPOINTMENTS` - Patient appointments
- `MEDICAL_RECORDS` - Patient medical history
- `MEDICATIONS` - Available medications
- `PRESCRIPTIONS` - Patient prescriptions

### Audit Tables

- `AUDIT_PATIENTS` - Patient data changes
- `AUDIT_DOCTORS` - Doctor data changes
- `AUDIT_APPOINTMENTS` - Appointment changes
- `AUDIT_MEDICAL_RECORDS` - Medical record changes
- `AUDIT_PRESCRIPTIONS` - Prescription changes

## 🔍 Provenance Features

### Why-Provenance

- Track reasons for medication dosage changes
- Monitor diagnosis modification justifications
- Audit appointment rescheduling reasons

### Where-Provenance

- Identify data sources and contributors
- Track user access patterns
- Monitor data lineage across tables

### How-Provenance

- Visualize data transformation history
- Track cascading updates
- Monitor business rule applications

## 📝 API Endpoints

### Patients

- `GET /api/v1/patients` - List all patients
- `GET /api/v1/patients/:id` - Get patient details
- `POST /api/v1/patients` - Create new patient
- `PUT /api/v1/patients/:id` - Update patient
- `DELETE /api/v1/patients/:id` - Delete patient

### Audit/Provenance

- `GET /api/v1/audit/patients/:id` - Get patient audit trail
- `GET /api/v1/audit/doctors/:id` - Get doctor audit trail
- `GET /api/v1/audit/appointments/:id` - Get appointment audit trail
- `GET /api/v1/audit/summary` - Get audit summary

## 🎨 GUI Features

- **Dashboard**: Overview of system statistics
- **Patient Management**: CRUD operations with audit trails
- **Doctor Management**: Doctor information and schedules
- **Appointment Scheduling**: Appointment booking and management
- **Audit Viewer**: Visual audit trail exploration
- **Reports**: Provenance analysis and compliance reports

## 📚 Assignment Requirements Coverage

✅ **Schema Design** - Normalized healthcare schema  
✅ **Audit Mechanisms** - Comprehensive audit tables and triggers  
✅ **Provenance Queries** - Why, Where, How provenance extraction  
✅ **GUI Tool** - Modern Next.js frontend for visualization  
✅ **Documentation** - Complete setup and usage documentation

## 🔧 Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Backend
go run main.go       # Start development server
go test ./...        # Run tests
go mod tidy          # Clean dependencies

# Database
sqlplus careo/careo123@localhost:1521/XE  # Connect to database
```

## 📄 License

This project is created for educational purposes as part of the CSE464 course assignment.

## 🤝 Contributing

This is an academic project. For questions or issues, please refer to the course instructor.
