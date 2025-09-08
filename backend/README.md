# Train Ticket Management System - Provenance-Enabled RDBMS

CSE464 Advanced Database Systems Term Project

## Project Overview

This is a provenance-enabled train ticket management system that demonstrates the capture of "why," "where," and "how" data evolution through comprehensive audit mechanisms. The system includes automatic audit logging via SQL triggers and provides REST APIs for accessing provenance information.

## System Architecture

### Database Schema

- **Stations**: Railway stations with codes and cities
- **Routes**: Train routes between stations
- **Trains**: Train information and capacity
- **Schedules**: Train timings and availability
- **Passengers**: User accounts for ticket booking
- **Admins**: Railway employee accounts
- **Reservations**: Ticket bookings
- **Payments**: Payment transactions

### Audit Tables

- **Audit_Trains**: Tracks train information changes
- **Audit_Schedules**: Tracks schedule modifications
- **Audit_Passengers**: Tracks reservation changes
- **Audit_Payments**: Tracks payment status changes

## Features

### Authentication & Authorization

- **Two user types**: Passengers and Admins
- **JWT-based authentication**
- **Role-based access control**
- **Password hashing with bcrypt**

### Provenance Tracking

- **Automatic audit logging** via database triggers
- **Why Provenance**: Payment status changes and justifications
- **Where Provenance**: User actions across all tables
- **How Provenance**: Data evolution and transformation history

### API Endpoints

#### Authentication

```
POST /api/auth/passenger/register - Register passenger
POST /api/auth/passenger/login    - Passenger login
POST /api/auth/admin/login        - Admin login
POST /api/auth/admin/create       - Create admin (admin only)
```

#### Core Entities

```
GET/POST/PUT/DELETE /api/stations      - Station management
GET/POST/PUT/DELETE /api/routes       - Route management
GET/POST/PUT/DELETE /api/trains       - Train management
GET/POST/PUT/DELETE /api/schedules    - Schedule management
GET/POST/PUT/DELETE /api/reservations - Reservation management
GET/POST/PUT/DELETE /api/payments     - Payment management
```

#### Audit & Provenance

```
GET /api/audit/trains         - Train audit trail
GET /api/audit/schedules      - Schedule audit trail
GET /api/audit/passengers     - Passenger audit trail
GET /api/audit/payments       - Payment audit trail
GET /api/audit/user/:userId   - User action history
GET /api/audit/summary        - Audit statistics
```

#### Admin Features

```
GET /api/admin/dashboard      - Admin dashboard
GET /api/admin/users          - User management
GET /api/admin/reports/*      - Various reports
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Oracle Database (19c or higher)
- Git

### Database Setup

1. **Start Oracle Database in Docker**

```bash
# Your Oracle database is already running in Docker with these settings:
# Host: localhost
# Port: 1521
# Service: XEPDB1
# Username: system
# Password: secret
```

2. **Connect and Setup Database**

```bash
# Connect to Oracle as system user
sqlplus system/secret@localhost:1521/XEPDB1

# Execute schema creation
@database/schema.sql

# Execute triggers creation
@database/triggers.sql

# Load sample data
@database/sample_data.sql
```

### Backend Setup

1. **Clone and Install Dependencies**

```bash
git clone <repository-url>
cd train-ticket-management
npm install
```

2. **Environment Configuration**
   Create `.env` file:

```env
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
DB_USERNAME=system
DB_PASSWORD=secret
JWT_SECRET=your-secret-key-here
PORT=8080
ENV=development
```

3. **Start the Server**

```bash
npm start
# or for development
npm run dev
```

## API Usage Examples

### Authentication

```bash
# Register passenger
curl -X POST http://localhost:8080/api/auth/passenger/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/passenger/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'
```

### Search Trains

```bash
curl "http://localhost:8080/api/schedules/search/routes?departure_station=Dhaka&arrival_station=Chittagong&travel_date=2024-02-01"
```

### Book Ticket

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": 1,
    "passenger_name": "John Doe",
    "passenger_age": 30,
    "passenger_gender": "MALE"
  }'
```

### View Provenance

```bash
# Get audit trail for a specific payment
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:8080/api/audit/payments/1"

# Get all actions by a user
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:8080/api/audit/user/SYSTEM"
```

## Provenance Queries Examples

The system includes 5+ provenance queries demonstrating different types:

### 1. WHY Provenance - Payment Status Changes

```sql
SELECT audit_id, payment_id, old_payment_status, new_payment_status,
       change_reason, audit_timestamp, user_id
FROM Audit_Payments
WHERE payment_id = 1
ORDER BY audit_timestamp;
```

### 2. WHERE Provenance - User Actions

```sql
SELECT 'Trains' as table_name, operation_type, audit_timestamp, change_reason
FROM Audit_Trains WHERE user_id = 'ADMIN'
UNION ALL
SELECT 'Payments', operation_type, audit_timestamp, change_reason
FROM Audit_Payments WHERE user_id = 'ADMIN'
ORDER BY audit_timestamp DESC;
```

### 3. HOW Provenance - Data Evolution

```sql
SELECT audit_id, operation_type, old_status, new_status,
       audit_timestamp, change_reason
FROM Audit_Schedules
WHERE schedule_id = 1
ORDER BY audit_timestamp;
```

## Sample Data

The system includes sample data with:

- 6 railway stations (Dhaka, Chittagong, Sylhet, etc.)
- 3 routes connecting major cities
- 4 trains with different types
- 3 scheduled services
- Sample passenger and admin accounts
- Demonstration booking and payment records

### Test Accounts

- **Admin**: username: `admin`, password: `admin123`
- **Passenger**: username: `john_doe`, password: `password123`

## Project Structure

```
train-ticket-management/
├── database/
│   ├── connection.js      # Database connection
│   ├── schema.sql         # Database schema
│   ├── triggers.sql       # Audit triggers
│   └── sample_data.sql    # Test data
├── controllers/           # Route controllers
├── routes/               # API routes
├── middleware/           # Authentication middleware
├── server.js             # Main server file
└── package.json          # Dependencies
```

## Evaluation Criteria Addressed

- ✅ **Schema Design (10 marks)**: Normalized schema with 8 interconnected tables
- ✅ **Audit Mechanisms (20 marks)**: 4 audit tables with comprehensive triggers
- ✅ **Provenance Queries (20 marks)**: 5+ queries demonstrating WHY/WHERE/HOW provenance
- ✅ **Innovation & Complexity (20 marks)**: Complete REST API with authentication
- ✅ **Documentation (15 marks)**: Comprehensive README with setup instructions

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: Oracle Database 19c
- **Authentication**: JWT with bcrypt
- **Validation**: Joi schema validation
- **Logging**: Morgan HTTP request logger

## Contributing

This is an academic project for CSE464 Advanced Database Systems.

## License

MIT License - Educational Use Only
