-- ====================================================================
-- STORED PROCEDURE FOR ADMIN INSERTION
-- CSE464 Advanced Database Systems - Admin Management
-- ====================================================================

CREATE OR REPLACE PROCEDURE CreateAdmin(
    p_username IN VARCHAR2,
    p_email IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_full_name IN VARCHAR2,
    p_employee_id IN VARCHAR2 DEFAULT NULL,
    p_role IN VARCHAR2 DEFAULT 'ADMIN',
    p_status IN VARCHAR2 DEFAULT 'ACTIVE',
    p_created_by IN NUMBER DEFAULT NULL,
    p_admin_id OUT NUMBER
) AS
    v_admin_id NUMBER;
BEGIN
    -- Validate required parameters
    IF p_username IS NULL OR TRIM(p_username) = '' THEN
        RAISE_APPLICATION_ERROR(-20001, 'Username is required and cannot be empty');
    END IF;
    
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RAISE_APPLICATION_ERROR(-20002, 'Email is required and cannot be empty');
    END IF;
    
    IF p_password_hash IS NULL OR TRIM(p_password_hash) = '' THEN
        RAISE_APPLICATION_ERROR(-20003, 'Password hash is required and cannot be empty');
    END IF;
    
    IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
        RAISE_APPLICATION_ERROR(-20004, 'Full name is required and cannot be empty');
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('ADMIN', 'SUPER_ADMIN', 'OPERATOR') THEN
        RAISE_APPLICATION_ERROR(-20005, 'Invalid role. Must be ADMIN, SUPER_ADMIN, or OPERATOR');
    END IF;
    
    -- Validate status
    IF p_status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
        RAISE_APPLICATION_ERROR(-20006, 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED');
    END IF;
    
    -- Check if username already exists
    SELECT COUNT(*) INTO v_admin_id FROM Admins WHERE username = p_username;
    IF v_admin_id > 0 THEN
        RAISE_APPLICATION_ERROR(-20007, 'Username already exists');
    END IF;
    
    -- Check if email already exists
    SELECT COUNT(*) INTO v_admin_id FROM Admins WHERE email = p_email;
    IF v_admin_id > 0 THEN
        RAISE_APPLICATION_ERROR(-20008, 'Email already exists');
    END IF;
    
    -- Check if employee_id already exists (if provided)
    IF p_employee_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_admin_id FROM Admins WHERE employee_id = p_employee_id;
        IF v_admin_id > 0 THEN
            RAISE_APPLICATION_ERROR(-20009, 'Employee ID already exists');
        END IF;
    END IF;
    
    -- Validate created_by if provided
    IF p_created_by IS NOT NULL THEN
        SELECT COUNT(*) INTO v_admin_id FROM Admins WHERE admin_id = p_created_by;
        IF v_admin_id = 0 THEN
            RAISE_APPLICATION_ERROR(-20010, 'Invalid created_by admin ID');
        END IF;
    END IF;
    
    -- Insert the new admin
    INSERT INTO Admins (
        admin_id,
        username,
        email,
        password_hash,
        full_name,
        employee_id,
        role,
        status,
        created_by,
        created_at
    ) VALUES (
        admin_seq.NEXTVAL,
        p_username,
        p_email,
        p_password_hash,
        p_full_name,
        p_employee_id,
        p_role,
        p_status,
        p_created_by,
        CURRENT_TIMESTAMP
    ) RETURNING admin_id INTO p_admin_id;
    
    -- Log the creation
    DBMS_OUTPUT.PUT_LINE('Admin created successfully with ID: ' || p_admin_id);
    
    -- Commit the transaction
    COMMIT;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback on error
        ROLLBACK;
        -- Log the error and re-raise
        DBMS_OUTPUT.PUT_LINE('Error creating admin: ' || SQLERRM);
        RAISE;
END CreateAdmin;
/

-- ====================================================================
-- EXAMPLE USAGE OF THE PROCEDURE
-- ====================================================================

/*
-- Example 1: Create a basic admin (password: 1234)
DECLARE
    v_admin_id NUMBER;
BEGIN
    CreateAdmin(
        p_username => 'ntest',
        p_email => 'ntest@example.com',
        p_password_hash => '$2a$12$MnLhJWsU5SJqXx472Z/TVe5W45sTb6w4qmHiA.3zTmuRdRC1GPet2',
        p_full_name => 'New Test User',
        p_role => 'SUPER_ADMIN',
        p_status => 'ACTIVE',
        p_admin_id => v_admin_id
    );
    DBMS_OUTPUT.PUT_LINE('Created admin with ID: ' || v_admin_id);
END;
/
commit;


COMMIT;
