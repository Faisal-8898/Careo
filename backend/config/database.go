package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/godror/godror"
)

var DB *sql.DB

// Database configuration
type DBConfig struct {
	Host     string
	Port     string
	Service  string
	Username string
	Password string
}

// GetDBConfig returns database configuration from environment variables
func GetDBConfig() *DBConfig {
	return &DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "1521"),
		Service:  getEnv("DB_SERVICE", "XE"),
		Username: getEnv("DB_USERNAME", "careo"),
		Password: getEnv("DB_PASSWORD", "careo123"),
	}
}

// ConnectDB establishes connection to Oracle database
func ConnectDB() error {
	config := GetDBConfig()

	// Oracle connection string
	dsn := fmt.Sprintf(`user="%s" password="%s" connectString="%s:%s/%s"`,
		config.Username, config.Password, config.Host, config.Port, config.Service)

	var err error
	DB, err = sql.Open("godror", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %v", err)
	}

	// Test the connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Successfully connected to Oracle database")
	return nil
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
