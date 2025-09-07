package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv" 
	_ "github.com/godror/godror"
)


var DB *sql.DB


type DBConfig struct {
	Host     string
	Port     string
	Service  string
	Username string
	Password string
}


func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}
}

func GetDBConfig() *DBConfig {
	return &DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "1521"),
		Service:  getEnv("DB_SERVICE", "XEPDB1"),
		Username: getEnv("DB_USERNAME", "system"),
		Password: getEnv("DB_PASSWORD", "secret"),
	}
}


func ConnectDB() error {
	LoadEnv()

	config := GetDBConfig()


	dsn := fmt.Sprintf("%s/%s@%s:%s/%s",
		config.Username, config.Password, config.Host, config.Port, config.Service)

	log.Printf("Connecting to Oracle DB at %s:%s/%s as user '%s'...",
		config.Host, config.Port, config.Service, config.Username)

	var err error
	DB, err = sql.Open("godror", dsn)
	if err != nil {
		log.Printf("Failed to open DB: %v", err)
		DB = nil
		return err
	}


	if err := DB.Ping(); err != nil {
		log.Printf("Failed to ping DB: %v", err)
		DB = nil
		return err
	}

	log.Println("Successfully connected to Oracle database")
	return nil
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
