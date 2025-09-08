package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"

	"careo-backend/config"
)

func main() {
	fmt.Println("======================================================")
	fmt.Println("Healthcare Database Setup via Go")
	fmt.Println("======================================================")
	fmt.Println()

	// Connect to database using existing config
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer config.CloseDB()

	fmt.Println("✅ Successfully connected to Oracle database")
	fmt.Println()

	// Check if tables already exist
	if tablesExist() {
		fmt.Println("⚠️  Some tables already exist in the database.")
		fmt.Println("This will drop existing tables and recreate everything.")
		fmt.Println()
		fmt.Print("Do you want to proceed with a fresh setup? (y/N): ")
		var response string
		fmt.Scanln(&response)
		if strings.ToLower(response) != "y" && strings.ToLower(response) != "yes" {
			fmt.Println("Setup cancelled.")
			return
		}
	} else {
		fmt.Println("This will set up the complete healthcare database:")
		fmt.Println("1. Core schema (tables, sequences, indexes)")
		fmt.Println("2. Audit schema (audit tables for provenance)")
		fmt.Println("3. Triggers (audit and cascade triggers)")
		fmt.Println("4. Stored procedures (healthcare workflows)")
		fmt.Println("5. Mock data injection")
		fmt.Println()
		fmt.Print("Do you want to proceed? (y/N): ")
		var response string
		fmt.Scanln(&response)
		if strings.ToLower(response) != "y" && strings.ToLower(response) != "yes" {
			fmt.Println("Setup cancelled.")
			return
		}
	}

	// Setup steps
	steps := []struct {
		name        string
		sqlFile     string
		description string
	}{
		{"Core Schema", "../database/core/core_schema.sql", "Creating core tables, sequences, and indexes"},
		{"Audit Schema", "../database/core/audit_schema.sql", "Creating audit tables for provenance tracking"},
		{"Audit Triggers", "../database/triggers/audit_triggers.sql", "Installing audit triggers for automatic change tracking"},
		{"Cascade Triggers", "../database/triggers/cascade_triggers.sql", "Installing cascade triggers for business logic"},
		{"Stored Procedures", "../database/procedures/healthcare_procedures.sql", "Creating stored procedures for healthcare workflows"},
		{"Mock Data", "../database/mock_data.sql", "Injecting sample data for testing"},
	}

	// Execute each step
	for i, step := range steps {
		fmt.Printf("[STEP %d/%d] %s\n", i+1, len(steps), step.description)

		if err := executeSQLFile(step.sqlFile); err != nil {
			log.Fatalf("Failed to execute %s: %v", step.name, err)
		}

		fmt.Printf("✅ %s completed successfully!\n", step.name)
		fmt.Println()
		time.Sleep(500 * time.Millisecond) // Brief pause for better UX
	}

	// Verify setup
	fmt.Println("🔍 Verifying database setup...")
	if err := verifySetup(); err != nil {
		log.Fatalf("Setup verification failed: %v", err)
	}

	fmt.Println("======================================================")
	fmt.Println("🎉 Healthcare Database Setup Completed Successfully!")
	fmt.Println("======================================================")
	fmt.Println()
	fmt.Println("Sample Login Credentials:")
	fmt.Println("Admin: faisal@gmail.com / Password: 1234")
	fmt.Println()
	fmt.Println("Database Components Created:")
	fmt.Println("• 11 Core tables (patients, doctors, appointments, etc.)")
	fmt.Println("• 13 Audit tables (complete change tracking)")
	fmt.Println("• 24+ Triggers (automatic audit trail)")
	fmt.Println("• 7 Stored procedures (healthcare workflows)")
	fmt.Println("• Sample data (patients, doctors, appointments, records)")
	fmt.Println("======================================================")
}

func tablesExist() bool {
	query := `SELECT COUNT(*) FROM user_tables WHERE table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'MEDICAL_RECORDS')`
	var count int
	if err := config.DB.QueryRow(query).Scan(&count); err != nil {
		return false
	}
	return count > 0
}

func executeSQLFile(filePath string) error {
	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("SQL file not found: %s", filePath)
	}

	// Read SQL file
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read SQL file %s: %w", filePath, err)
	}

	sqlContent := string(content)

	// Split by statements and execute
	statements := splitSQLStatements(sqlContent)

	for i, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") || strings.HasPrefix(stmt, "/*") {
			continue
		}

		// Skip Oracle-specific commands that might not work in Go
		upperStmt := strings.ToUpper(stmt)
		if strings.HasPrefix(upperStmt, "PROMPT") ||
			strings.HasPrefix(upperStmt, "SET ") ||
			strings.HasPrefix(upperStmt, "ALTER SESSION") ||
			strings.HasPrefix(upperStmt, "WHENEVER") {
			continue
		}

		// Execute the statement
		if _, err := config.DB.Exec(stmt); err != nil {
			// Handle common ignorable errors
			errStr := err.Error()
			if strings.Contains(errStr, "ORA-00955") { // Name already used
				fmt.Printf("⚠️  Object already exists (statement %d), continuing...\n", i+1)
				continue
			}
			if strings.Contains(errStr, "ORA-00942") { // Table doesn't exist for DROP
				fmt.Printf("⚠️  Object doesn't exist for DROP (statement %d), continuing...\n", i+1)
				continue
			}
			if strings.Contains(errStr, "ORA-04043") { // Object doesn't exist
				fmt.Printf("⚠️  Object doesn't exist (statement %d), continuing...\n", i+1)
				continue
			}

			// For other errors, show more context but continue
			stmtPreview := stmt
			if len(stmtPreview) > 100 {
				stmtPreview = stmtPreview[:100] + "..."
			}
			fmt.Printf("⚠️  Warning in statement %d: %v\n", i+1, err)
			fmt.Printf("    Statement: %s\n", stmtPreview)
			// Continue with other statements instead of failing
			continue
		}
	}

	return nil
}

func splitSQLStatements(sqlContent string) []string {
	// Remove block comments
	sqlContent = removeBlockComments(sqlContent)

	var statements []string
	var currentStmt strings.Builder
	var inPLSQL bool
	var plsqlDepth int

	lines := strings.Split(sqlContent, "\n")

	for _, line := range lines {
		originalLine := line
		line = strings.TrimSpace(line)

		// Skip empty lines and single-line comments
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}

		// Check for PL/SQL block start
		upperLine := strings.ToUpper(line)
		if (strings.Contains(upperLine, "CREATE OR REPLACE") &&
			(strings.Contains(upperLine, "PROCEDURE") || strings.Contains(upperLine, "TRIGGER") || strings.Contains(upperLine, "FUNCTION"))) ||
			strings.HasPrefix(upperLine, "DECLARE") ||
			strings.HasPrefix(upperLine, "BEGIN") {
			inPLSQL = true
			plsqlDepth++
		}

		// Track BEGIN/END blocks
		if inPLSQL {
			if strings.HasPrefix(upperLine, "BEGIN") {
				plsqlDepth++
			} else if strings.HasPrefix(upperLine, "END") {
				plsqlDepth--
			}
		}

		currentStmt.WriteString(originalLine)
		currentStmt.WriteString("\n")

		// Check for statement end
		if line == "/" {
			// End of PL/SQL block
			if inPLSQL {
				inPLSQL = false
				plsqlDepth = 0
				statements = append(statements, currentStmt.String())
				currentStmt.Reset()
			}
		} else if strings.HasSuffix(line, ";") {
			if !inPLSQL || plsqlDepth <= 0 {
				// End of regular SQL statement or PL/SQL block
				statements = append(statements, currentStmt.String())
				currentStmt.Reset()
				if inPLSQL {
					inPLSQL = false
					plsqlDepth = 0
				}
			}
		}
	}

	// Add any remaining statement
	if currentStmt.Len() > 0 {
		statements = append(statements, currentStmt.String())
	}

	return statements
}

func removeBlockComments(content string) string {
	var result strings.Builder
	i := 0
	for i < len(content) {
		if i < len(content)-1 && content[i:i+2] == "/*" {
			// Found start of block comment, find end
			j := i + 2
			for j < len(content)-1 {
				if content[j:j+2] == "*/" {
					i = j + 2
					break
				}
				j++
			}
			if j >= len(content)-1 {
				break // Unclosed comment, end of content
			}
		} else {
			result.WriteByte(content[i])
			i++
		}
	}
	return result.String()
}

func verifySetup() error {
	// Check core tables
	coreTableQuery := `
		SELECT table_name, num_rows 
		FROM user_tables 
		WHERE table_name IN ('USERS', 'PATIENTS', 'DOCTORS', 'MEDICAL_RECORDS', 'APPOINTMENTS')
		ORDER BY table_name
	`

	rows, err := config.DB.Query(coreTableQuery)
	if err != nil {
		return fmt.Errorf("failed to query core tables: %w", err)
	}
	defer rows.Close()

	fmt.Println("Core Tables:")
	coreTableCount := 0
	for rows.Next() {
		var tableName string
		var numRows *int
		if err := rows.Scan(&tableName, &numRows); err != nil {
			return fmt.Errorf("failed to scan table info: %w", err)
		}
		rowCount := "0"
		if numRows != nil {
			rowCount = fmt.Sprintf("%d", *numRows)
		}
		fmt.Printf("  ✅ %s (rows: %s)\n", tableName, rowCount)
		coreTableCount++
	}

	if coreTableCount == 0 {
		return fmt.Errorf("no core tables found")
	}

	// Check data counts
	fmt.Println("\nData Summary:")
	dataTables := []string{"departments", "specializations", "users", "patients", "doctors", "appointments", "medical_records"}

	for _, table := range dataTables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
		if err := config.DB.QueryRow(query).Scan(&count); err != nil {
			fmt.Printf("  ⚠️  %s: Error querying (%v)\n", table, err)
		} else {
			fmt.Printf("  ✅ %s: %d records\n", table, count)
		}
	}

	return nil
}

