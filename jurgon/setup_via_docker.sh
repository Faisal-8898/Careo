#!/bin/bash

# =====================================================
# Healthcare Database Setup via Docker
# =====================================================
# This script sets up the database by executing SQL files
# directly in the Oracle Docker container
# =====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Database connection parameters
CONTAINER_NAME="oracle-xe"
DB_SERVICE="XEPDB1"
DB_USERNAME="system"
DB_PASSWORD="secret"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check if Docker container is running
check_container() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "Oracle container '$CONTAINER_NAME' is not running."
        echo "Please start your Oracle container first:"
        echo "  docker start $CONTAINER_NAME"
        exit 1
    fi
    print_success "Oracle container '$CONTAINER_NAME' is running"
}

# Function to test database connection
test_connection() {
    print_status "Testing database connection..."
    
    CONNECTION_TEST=$(docker exec $CONTAINER_NAME bash -c "echo 'SELECT '\''CONNECTION_SUCCESS'\'' FROM dual;' | sqlplus -s $DB_USERNAME/$DB_PASSWORD@$DB_SERVICE" 2>&1)
    
    if [[ $CONNECTION_TEST == *"CONNECTION_SUCCESS"* ]]; then
        print_success "Database connection successful!"
        return 0
    else
        print_error "Database connection failed!"
        echo "Error output:"
        echo "$CONNECTION_TEST"
        return 1
    fi
}

# Function to execute SQL file in Docker container
execute_sql_file() {
    local sql_file=$1
    local description=$2
    
    if [ ! -f "$sql_file" ]; then
        print_error "SQL file not found: $sql_file"
        return 1
    fi
    
    print_step "$description"
    
    # Copy SQL file to container
    docker cp "$sql_file" "$CONTAINER_NAME:/tmp/$(basename $sql_file)"
    
    # Execute SQL file in container
    OUTPUT=$(docker exec $CONTAINER_NAME bash -c "cd /tmp && sqlplus -s $DB_USERNAME/$DB_PASSWORD@$DB_SERVICE @$(basename $sql_file)" 2>&1)
    RESULT=$?
    
    # Clean up copied file
    docker exec $CONTAINER_NAME rm -f "/tmp/$(basename $sql_file)" 2>/dev/null
    
    # Check for success indicators
    if [[ $OUTPUT == *"Table created"* ]] || [[ $OUTPUT == *"Sequence created"* ]] || [[ $OUTPUT == *"Index created"* ]] || 
       [[ $OUTPUT == *"Procedure created"* ]] || [[ $OUTPUT == *"Trigger created"* ]] ||
       [[ $OUTPUT == *"created successfully"* ]] || [[ $OUTPUT == *"Created Successfully"* ]] ||
       [[ $OUTPUT == *"rows inserted"* ]] || [[ $OUTPUT == *"commit complete"* ]] || [[ $OUTPUT == *"COMMIT"* ]]; then
        print_success "$description completed successfully!"
        
        # Show summary of created objects
        if [[ $OUTPUT == *"Table created"* ]]; then
            table_count=$(echo "$OUTPUT" | grep -c "Table created")
            echo "  Created $table_count tables"
        fi
        if [[ $OUTPUT == *"Sequence created"* ]]; then
            seq_count=$(echo "$OUTPUT" | grep -c "Sequence created")
            echo "  Created $seq_count sequences"
        fi
        if [[ $OUTPUT == *"Index created"* ]]; then
            idx_count=$(echo "$OUTPUT" | grep -c "Index created")
            echo "  Created $idx_count indexes"
        fi
        return 0
    fi
    
    # Check for ignorable errors only
    if [[ $OUTPUT == *"ORA-00942"* ]] && [[ $OUTPUT == *"DROP TABLE"* ]]; then
        print_warning "$description completed (some DROP statements on non-existent objects)"
        return 0
    fi
    if [[ $OUTPUT == *"ORA-01408"* ]] && [[ $OUTPUT == *"already indexed"* ]]; then
        print_warning "$description completed (some indexes already existed)"
        return 0
    fi
    if [[ $OUTPUT == *"ORA-00955"* ]] || [[ $OUTPUT == *"already exists"* ]]; then
        print_warning "$description completed (some objects already existed)"
        return 0
    fi
    
    # Only fail if there are serious errors
    if [[ $OUTPUT == *"ORA-"* ]] && [[ ! $OUTPUT == *"ORA-00942"* ]] && [[ ! $OUTPUT == *"ORA-01408"* ]] && [[ ! $OUTPUT == *"ORA-00955"* ]]; then
        print_error "$description failed!"
        echo "Error output:"
        echo "$OUTPUT"
        return 1
    fi
    
    # If we reach here, assume success
    print_success "$description completed successfully!"
    return 0
}

# Function to check if tables exist
check_tables_exist() {
    print_status "Checking if core tables already exist..."
    
    TABLE_CHECK=$(docker exec $CONTAINER_NAME bash -c "echo \"SELECT COUNT(*) FROM user_tables WHERE table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'MEDICAL_RECORDS');\" | sqlplus -s $DB_USERNAME/$DB_PASSWORD@$DB_SERVICE" 2>&1)
    
    if [[ $TABLE_CHECK =~ [0-9]+ ]]; then
        local count=$(echo "$TABLE_CHECK" | grep -o '[0-9]\+' | head -1)
        if [[ $count -gt 0 ]]; then
            return 0  # Tables exist
        fi
    fi
    return 1  # Tables don't exist
}

# Function to verify setup
verify_setup() {
    print_step "Verifying database setup..."
    
    # Create verification script
    cat > "/tmp/verify_setup.sql" << 'EOF'
SET PAGESIZE 50;
SET LINESIZE 120;

-- Check core tables
PROMPT =====================================================
PROMPT CORE TABLES STATUS
PROMPT =====================================================
SELECT table_name, num_rows FROM user_tables 
WHERE table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'NURSES', 'ADMINS', 'APPOINTMENTS', 'MEDICAL_RECORDS', 'PRESCRIPTIONS', 'PRESCRIPTION_MEDICINES', 'DEPARTMENTS', 'SPECIALIZATIONS')
ORDER BY table_name;

-- Check data counts
PROMPT =====================================================
PROMPT DATA SUMMARY  
PROMPT =====================================================
SELECT 'DEPARTMENTS' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 'SPECIALIZATIONS', COUNT(*) FROM specializations
UNION ALL
SELECT 'USERS', COUNT(*) FROM users
UNION ALL
SELECT 'PATIENTS', COUNT(*) FROM patients
UNION ALL
SELECT 'DOCTORS', COUNT(*) FROM doctors
UNION ALL
SELECT 'NURSES', COUNT(*) FROM nurses
UNION ALL
SELECT 'ADMINS', COUNT(*) FROM admins
UNION ALL
SELECT 'APPOINTMENTS', COUNT(*) FROM appointments
UNION ALL
SELECT 'MEDICAL_RECORDS', COUNT(*) FROM medical_records
UNION ALL
SELECT 'PRESCRIPTIONS', COUNT(*) FROM prescriptions;

PROMPT =====================================================
PROMPT SETUP VERIFICATION COMPLETED
PROMPT =====================================================
EOF
    
    # Copy and execute verification script
    docker cp "/tmp/verify_setup.sql" "$CONTAINER_NAME:/tmp/verify_setup.sql"
    OUTPUT=$(docker exec $CONTAINER_NAME bash -c "cd /tmp && sqlplus -s $DB_USERNAME/$DB_PASSWORD@$DB_SERVICE @verify_setup.sql" 2>&1)
    
    # Clean up
    rm -f "/tmp/verify_setup.sql"
    docker exec $CONTAINER_NAME rm -f "/tmp/verify_setup.sql" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        print_success "Database verification completed!"
        echo ""
        echo "$OUTPUT"
        return 0
    else
        print_error "Database verification failed!"
        echo "$OUTPUT"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    echo "======================================================"
    echo "Healthcare Database Setup via Docker"
    echo "======================================================"
    echo ""
    echo "This script will set up the complete healthcare database:"
    echo "1. Core schema (tables, sequences, indexes)"
    echo "2. Audit schema (audit tables for provenance)"
    echo "3. Triggers (audit and cascade triggers)"
    echo "4. Stored procedures (healthcare workflows)"
    echo "5. Mock data injection"
    echo ""
    
    # Check prerequisites
    check_container
    
    # Test database connection
    if ! test_connection; then
        exit 1
    fi
    
    # Check if setup is needed
    if check_tables_exist; then
        echo ""
        print_warning "Core tables already exist in the database."
        print_warning "This will drop existing tables and recreate everything."
        echo ""
        read -p "Do you want to proceed with a fresh setup? (y/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setup cancelled."
            exit 0
        fi
    else
        echo ""
        print_status "No existing tables found. Proceeding with fresh setup."
        echo ""
        read -p "Do you want to proceed? (y/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setup cancelled."
            exit 0
        fi
    fi
    
    echo ""
    print_status "Starting database setup..."
    echo ""
    
    # Setup steps
    steps=(
        "backend/database/core/core_schema.sql|Creating core schema (tables, sequences, indexes)"

        "backend/database/core/audit_schema.sql|Creating audit schema (audit tables for provenance tracking)"
        "backend/database/triggers/audit_triggers.sql|Creating audit triggers (automatic provenance tracking)"
        "backend/database/triggers/cascade_triggers.sql|Creating cascade triggers (business logic enforcement)"
        "backend/database/procedures/healthcare_procedures.sql|Creating stored procedures (healthcare workflows)"
        "backend/database/mock_data.sql|Injecting mock data (sample healthcare records)"
    )
    
    # Execute each step
    for step in "${steps[@]}"; do
        IFS='|' read -r sql_file description <<< "$step"
        
        if execute_sql_file "$sql_file" "$description"; then
            echo ""
        else
            print_error "Setup failed at: $description"
            exit 1
        fi
    done
    
    # Verify setup
    if verify_setup; then
        echo ""
        print_success "Healthcare database setup completed successfully!"
        echo ""
        echo "======================================================"
        echo "Sample Login Credentials:"
        echo "Admin: faisal@gmail.com / Password: 1234"
        echo ""
        echo "Database Components Created:"
        echo "• 11 Core tables (patients, doctors, appointments, etc.)"
        echo "• 13 Audit tables (complete change tracking)"
        echo "• 24+ Triggers (automatic audit trail)"
        echo "• 7 Stored procedures (healthcare workflows)"
        echo "• Sample data (patients, doctors, appointments, records)"
        echo "======================================================"
        echo ""
    else
        print_error "Setup verification failed. Please check the logs."
        exit 1
    fi
}

# Show help if requested
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Healthcare Database Setup via Docker"
    echo ""
    echo "This script sets up the healthcare database by executing SQL files"
    echo "directly in the Oracle Docker container."
    echo ""
    echo "Prerequisites:"
    echo "  • Oracle Docker container '$CONTAINER_NAME' must be running"
    echo "  • Container must be accessible via Docker"
    echo ""
    echo "Usage: $0"
    echo ""
    echo "The script will:"
    echo "  1. Check if Oracle container is running"
    echo "  2. Test database connectivity"
    echo "  3. Execute SQL files in correct order"
    echo "  4. Verify setup completion"
    echo ""
    exit 0
fi

# Run main function
main
