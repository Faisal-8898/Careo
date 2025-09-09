-- ====================================================================
-- COMPLETE SETUP FOR CLEAN TRAIN TICKET MANAGEMENT DATABASE
-- Run this script section by section
-- ====================================================================

-- STEP 1: Connect as SYSTEM and create user
-- sqlplus system/secret@localhost:1521/XEPDB1

-- Drop user if exists (uncomment if you want to start completely fresh)
-- DROP USER trainuser CASCADE;

-- Create new user
CREATE USER trainuser IDENTIFIED BY secret
DEFAULT TABLESPACE USERS
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON USERS;

-- Grant privileges
GRANT CONNECT, RESOURCE, CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, 
      CREATE TRIGGER, CREATE PROCEDURE, CREATE VIEW, CREATE SYNONYM, 
      ALTER SESSION TO trainuser;

GRANT SELECT_CATALOG_ROLE TO trainuser;
GRANT EXECUTE ON DBMS_STATS TO trainuser;

-- STEP 2: Connect as new user and create schema
-- CONNECT trainuser/secret@localhost:1521/XEPDB1

-- Now run the schema.sql file:
-- @schema.sql

-- Then run the sample_data.sql file:
-- @sample_data.sql

-- STEP 3: Verify setup
-- SELECT table_name FROM user_tables ORDER BY table_name;
-- SELECT sequence_name FROM user_sequences ORDER BY sequence_name;

COMMIT;
