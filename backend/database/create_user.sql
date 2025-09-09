-- ====================================================================
-- CREATE NEW USER FOR TRAIN TICKET MANAGEMENT SYSTEM
-- Run this as SYSTEM user to create a clean environment
-- ====================================================================

-- Connect as SYSTEM user first, then run these commands:
-- sqlplus system/secret@localhost:1521/XEPDB1

-- Drop user if exists (optional - only if you want to start fresh)
-- DROP USER trainuser CASCADE;

-- Create new user
CREATE USER trainuser IDENTIFIED BY secret
DEFAULT TABLESPACE USERS
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON USERS;

-- Grant necessary privileges
GRANT CONNECT TO trainuser;
GRANT RESOURCE TO trainuser;
GRANT CREATE SESSION TO trainuser;
GRANT CREATE TABLE TO trainuser;
GRANT CREATE SEQUENCE TO trainuser;
GRANT CREATE TRIGGER TO trainuser;
GRANT CREATE PROCEDURE TO trainuser;
GRANT CREATE VIEW TO trainuser;
GRANT CREATE SYNONYM TO trainuser;
GRANT ALTER SESSION TO trainuser;

-- Grant additional privileges for application development
GRANT SELECT_CATALOG_ROLE TO trainuser;
GRANT EXECUTE ON DBMS_STATS TO trainuser;
GRANT EXECUTE ON DBMS_LOCK TO trainuser;

-- Verify user creation
SELECT username, account_status, default_tablespace, temporary_tablespace 
FROM dba_users 
WHERE username = 'TRAINUSER';

-- Show granted privileges
SELECT * FROM dba_role_privs WHERE grantee = 'TRAINUSER';
SELECT * FROM dba_sys_privs WHERE grantee = 'TRAINUSER';

COMMIT;

-- ====================================================================
-- INSTRUCTIONS:
-- ====================================================================
-- 1. Connect to Oracle as SYSTEM user:
--    sqlplus system/secret@localhost:1521/XEPDB1
--
-- 2. Run this script:
--    @create_user.sql
--
-- 3. Connect as the new user:
--    CONNECT trainuser/secret@localhost:1521/XEPDB1
--
-- 4. Run schema.sql and sample_data.sql as trainuser
--
-- 5. Update your .env file:
--    DB_USERNAME=trainuser
--    DB_PASSWORD=secret
-- ====================================================================
