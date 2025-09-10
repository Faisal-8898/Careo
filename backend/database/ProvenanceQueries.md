# Provenance Queries Documentation

## Train Ticket Management System - Provenance Query Reference

---

## AuditController.js - Core Provenance Queries

### Train Provenance
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getTrainAudit()` | HOW | Shows evolution/transformation history of train records | `GET /api/audit/trains` |
| `getTrainAuditById()` | HOW | Shows complete change history for specific train | `GET /api/audit/trains/:id` |

### Schedule Provenance  
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getScheduleAudit()` | HOW | Shows schedule status transitions and modifications | `GET /api/audit/schedules` |
| `getScheduleAuditById()` | HOW | Shows complete modification history for specific schedule | `GET /api/audit/schedules/:id` |

### Passenger Provenance
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getPassengerAudit()` | HOW | Shows booking status transitions and reservation changes | `GET /api/audit/passengers` |
| `getPassengerAuditById()` | HOW | Shows complete modification history for specific reservation | `GET /api/audit/passengers/:id` |

### Payment Provenance
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getPaymentAudit()` | WHY | Shows payment status changes and refund justifications | `GET /api/audit/payments` |
| `getPaymentAuditById()` | WHY | Shows complete payment transaction history and justifications | `GET /api/audit/payments/:id` |

### Cross-Entity Provenance
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getAuditByUser()` | WHERE | Shows all actions taken by specified user across all tables | `GET /api/audit/users/:userId` |
| `getAuditByDateRange()` | WHERE | Shows all changes within specified date range | `GET /api/audit/daterange` |
| `getAuditSummary()` | SUMMARY | Overview of all audit activity and user actions | `GET /api/audit/summary` |

---

## AdminController.js - Analytical Provenance

### Business Intelligence
| Query | Type | Purpose | API Endpoint |
|-------|------|---------|--------------|
| `getBookingReports()` | WHEN | Shows booking trends and patterns over time | `GET /api/admin/reports/bookings` |
| `getRevenueReports()` | WHEN | Shows revenue patterns and payment trends | `GET /api/admin/reports/revenue` |
| `getTrainReports()` | HOW | Shows train utilization and performance metrics | `GET /api/admin/reports/trains` |

---

## Provenance Types Summary

- **HOW**: Data evolution and transformation history
- **WHY**: Causality and business justifications  
- **WHERE**: Location context (user/time-based filtering)
- **WHEN**: Temporal patterns and trends
- **SUMMARY**: Comprehensive overview across all entities




1. Revenue Source Lineage Query
Purpose: Track which specific reservations and payments contributed to revenue calculations
Practical Value:
Financial auditing and compliance
Revenue reconciliation
Identifying which bookings generated specific revenue amounts
Fraud detection by tracing payment sources
Example Use Case: "Show me all the individual reservations and payments that contributed to the $50,000 revenue reported for Route A in December 2023"
2. Train Utilization Source Query
Purpose: Show which specific schedules and bookings contributed to a train's utilization percentage
Practical Value:
Capacity planning and optimization
Performance analysis
Identifying peak usage patterns
Resource allocation decisions
Example Use Case: "Show me all the specific schedules and confirmed bookings that resulted in Train 101 having 85% utilization last month"
3. Popular Route Derivation Query
Purpose: Track which specific bookings and passenger data made a route "popular"
Practical Value:
Marketing insights and route planning
Understanding passenger preferences
Seasonal trend analysis
Service optimization
Example Use Case: "Show me all the individual bookings, passenger demographics, and booking patterns that contributed to Route B being ranked as the #1 popular route this quarter"