# Careo Project Setup Guide

## 🚀 Quick Start

This guide will help you set up the Careo Healthcare Patient Management System on your macOS machine.

## 📋 Prerequisites

1. **Oracle Database XE** (Express Edition)
2. **Go** (for backend)
3. **Node.js** (for frontend)
4. **Git** (for version control)

## 🗄️ Oracle Database Setup

### Option 1: Oracle Database XE (Recommended)

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
   # Add to your ~/.zshrc
   export ORACLE_HOME=/opt/oracle/product/21c/dbhomeXE
   export PATH=$ORACLE_HOME/bin:$PATH
   export LD_LIBRARY_PATH=$ORACLE_HOME/lib:$LD_LIBRARY_PATH

   # Reload shell
   source ~/.zshrc
   ```

4. **Start Oracle Database**:

   ```bash
   # Start the database service
   sudo /opt/oracle/product/21c/dbhomeXE/bin/dbstart
   ```

5. **Create Database User**:

   ```bash
   # Connect as system user
   sqlplus system/oracle@localhost:1521/XE

   # Create user for Careo application
   CREATE USER careo IDENTIFIED BY careo123;

   # Grant necessary privileges
   GRANT CONNECT, RESOURCE, DBA TO careo;
   GRANT CREATE SESSION TO careo;
   GRANT CREATE TABLE TO careo;
   GRANT CREATE SEQUENCE TO careo;
   GRANT CREATE TRIGGER TO careo;
   GRANT CREATE PROCEDURE TO careo;
   GRANT CREATE VIEW TO careo;

   # Exit
   EXIT;
   ```

### Option 2: Docker Oracle Database (Alternative)

```bash
# Pull Oracle Database image
docker pull container-registry.oracle.com/database/express:latest

# Run Oracle Database container
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=oracle \
  container-registry.oracle.com/database/express:latest
```

## 🏗️ Project Setup

### 1. Clone and Navigate

```bash
# Navigate to project directory
cd careo
```

### 2. Database Schema Setup

```bash
# Run the database setup script
sqlplus careo/careo123@localhost:1521/XE @backend/database/schema.sql
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod tidy

# Set environment variables
cp env.example .env

# Edit .env file with your Oracle database credentials
# DB_HOST=localhost
# DB_PORT=1521
# DB_SERVICE=XE
# DB_USERNAME=careo
# DB_PASSWORD=careo123

# Run the backend server
go run main.go
```

### 4. Frontend Setup

```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 📊 Database Schema Overview

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

## 🔍 Provenance Queries

Run the provenance queries to see audit trails:

```bash
# Connect to database
sqlplus careo/careo123@localhost:1521/XE

# Run provenance queries
@backend/database/provenance_queries.sql
```

## 🧪 Testing the Setup

### 1. Test Database Connection

```bash
# Connect to database
sqlplus careo/careo123@localhost:1521/XE

# Check tables
SELECT table_name FROM user_tables;

# Check sample data
SELECT * FROM PATIENTS;
SELECT * FROM DOCTORS;
```

### 2. Test Backend API

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test patients endpoint
curl http://localhost:8080/api/v1/patients
```

### 3. Test Frontend

- Open http://localhost:3000 in your browser
- Check if the backend status shows "Connected"
- Verify all components are loading correctly

## 🔧 Development Commands

```bash
# Backend
go run main.go          # Start development server
go test ./...           # Run tests
go mod tidy             # Clean dependencies

# Frontend
npm run dev             # Start development server
npm run build           # Build for production
npm run lint            # Run ESLint

# Database
sqlplus careo/careo123@localhost:1521/XE  # Connect to database
```

## 📁 Project Structure

```
careo/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   └── app/
│   │       └── page.tsx     # Main dashboard
│   ├── package.json
│   └── next.config.js
├── backend/                  # Go Gin REST API
│   ├── main.go              # Main server file
│   ├── config/
│   │   └── database.go      # Database configuration
│   ├── database/            # Database scripts
│   │   ├── schema.sql       # Database schema
│   │   └── provenance_queries.sql  # Audit queries
│   ├── go.mod
│   └── env.example
├── docs/                     # Documentation
│   └── README.md            # Project overview
└── SETUP.md                 # This file
```

## 🚨 Troubleshooting

### Oracle Database Issues

1. **Connection refused**:

   ```bash
   # Check if Oracle is running
   sudo /opt/oracle/product/21c/dbhomeXE/bin/dbstart
   ```

2. **Permission denied**:

   ```bash
   # Check Oracle installation
   ls -la /opt/oracle/product/21c/dbhomeXE/
   ```

3. **Environment variables**:

   ```bash
   # Verify Oracle environment
   echo $ORACLE_HOME
   which sqlplus
   ```

### Backend Issues

1. **Go dependencies**:

   ```bash
   cd backend
   go mod tidy
   go get github.com/godror/godror
   ```

2. **Database connection**:
   - Check `.env` file configuration
   - Verify Oracle database is running
   - Test connection manually with sqlplus

### Frontend Issues

1. **Node modules**:

   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Backend connection**:
   - Check if backend is running on port 8080
   - Verify CORS configuration
   - Check browser console for errors

## 📚 Next Steps

1. **Implement CRUD Operations**: Add full patient, doctor, and appointment management
2. **Add Authentication**: Implement user login and role-based access
3. **Enhance Audit Features**: Add more detailed provenance tracking
4. **Create Reports**: Build comprehensive reporting dashboard
5. **Add Testing**: Implement unit and integration tests

## 📞 Support

For issues related to:

- **Oracle Database**: Check Oracle documentation
- **Go Backend**: Check Gin framework documentation
- **Next.js Frontend**: Check Next.js documentation
- **Project Specific**: Refer to the main README.md

---

**Careo Healthcare System** - CSE464 Assignment Project
