# Quick Setup Guide

## Prerequisites

- Oracle Database running in Docker on localhost:1521/XEPDB1
- Node.js installed
- sqlplus or SQL Developer for database setup

## Step 1: Database Setup

Connect to your Oracle database:

```bash
sqlplus system/secret@localhost:1521/XEPDB1
```

Then run the database scripts in order:

```sql
-- 1. Create the schema and tables
@database/schema.sql

-- 2. Create the triggers for audit logging
@database/triggers.sql

-- 3. Load sample data
@database/sample_data.sql
```

## Step 2: Backend Setup

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file with your database details:

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

3. Start the server:

```bash
npm start
```

## Step 3: Test the API

Test health endpoint:

```bash
curl http://localhost:8080/health
```

Register a test user:

```bash
curl -X POST http://localhost:8080/api/auth/passenger/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Login:

```bash
curl -X POST http://localhost:8080/api/auth/passenger/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

## Default Admin Account

After running the sample data script, you can login as admin:

- Username: `admin`
- Password: `admin123`

```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Provenance Demo

To see the audit system in action:

1. Login as admin and get a token
2. View audit trails:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/audit/summary"
```

3. Make some changes to trigger audit logs:

```bash
# Update a train status
curl -X PUT http://localhost:8080/api/trains/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "MAINTENANCE"}'
```

4. Check the audit trail:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/audit/trains/1"
```

This will show you the provenance tracking in action!
