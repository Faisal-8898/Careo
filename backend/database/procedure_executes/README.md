# Procedure Executes

This directory contains organized procedure execution modules for different functional areas.

## Structure

```
procedure_executes/
├── index.js              # Centralized exports
├── adminProcedures.js    # Admin-related procedure executions
└── README.md            # This file
```

## Usage

### In connection.js

```javascript
const adminProcedures = require("./procedure_executes/adminProcedures");

// Use the procedures
const result = await adminProcedures.executeGetDashboardStats(connection);
```

### Adding New Procedure Modules

1. Create a new file (e.g., `userProcedures.js`)
2. Follow the same pattern as `adminProcedures.js`
3. Export the module in `index.js`
4. Import and use in `connection.js`

## Admin Procedures

- `executeGetDashboardStats()` - Get dashboard statistics
- `executeGetRecentBookings()` - Get recent bookings
- `executeGetPopularRoutes()` - Get popular routes
- `executeGetAllPassengers()` - Get all passengers with optional status filter
- `executeGetAllAdmins()` - Get all admins with optional status filter
- `executeGetPassengerStats()` - Get passenger statistics

## Benefits

- **Separation of Concerns**: Each module handles specific functionality
- **Maintainability**: Easy to find and modify procedure executions
- **Reusability**: Procedures can be reused across different controllers
- **Clean Code**: Connection management is centralized in connection.js
