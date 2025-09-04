# Database Triggers for Automatic Audit Logging

## Overview
This folder contains SQL triggers that automatically populate audit tables whenever data changes occur in the core tables. These triggers ensure complete provenance tracking without manual intervention.

## Files
- `audit_triggers.sql` - All audit triggers for core tables
- `cascade_triggers.sql` - Triggers for cascading updates and business logic

## Features
- **Automatic Audit Logging**: Every INSERT, UPDATE, DELETE operation is logged
- **Complete Data Snapshots**: Before/after data captured for all changes
- **User Context Tracking**: Session, IP, and application information logged
- **Business Rule Enforcement**: Cascading updates and validation logic
- **Performance Optimized**: Efficient trigger execution with minimal overhead

## Usage
Execute these triggers after creating the core and audit schemas to enable automatic provenance tracking.
