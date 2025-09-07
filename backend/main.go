package main

import (
	"log"
	"net/http"

	"careo-backend/config"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin to release mode for production-like behavior
	gin.SetMode(gin.ReleaseMode)

	// Connect to database
	if err := config.ConnectDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer config.CloseDB()

	// Create Gin router
	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		// Test database connection
		if config.DB != nil {
			if err := config.DB.Ping(); err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"status":  "error",
					"message": "Database connection failed",
					"error":   err.Error(),
				})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"status":   "ok",
				"message":  "Careo Backend is running",
				"database": "connected",
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"status":   "ok",
				"message":  "Careo Backend is running",
				"database": "mock_mode",
				"note":     "Database connection not available - running in mock mode",
			})
		}
	})

	// API routes group
	api := r.Group("/api/v1")
	{
		// Patients endpoints
		api.GET("/patients", getPatients)
		api.GET("/patients/:id", getPatient)
		api.POST("/patients", createPatient)
		api.PUT("/patients/:id", updatePatient)
		api.DELETE("/patients/:id", deletePatient)

		// Doctors endpoints
		api.GET("/doctors", getDoctors)
		api.GET("/doctors/:id", getDoctor)
		api.POST("/doctors", createDoctor)
		api.PUT("/doctors/:id", updateDoctor)
		api.DELETE("/doctors/:id", deleteDoctor)

		// Appointments endpoints
		api.GET("/appointments", getAppointments)
		api.GET("/appointments/:id", getAppointment)
		api.POST("/appointments", createAppointment)
		api.PUT("/appointments/:id", updateAppointment)
		api.DELETE("/appointments/:id", deleteAppointment)

		// Audit/Provenance endpoints
		api.GET("/audit/patients/:id", getPatientAudit)
		api.GET("/audit/doctors/:id", getDoctorAudit)
		api.GET("/audit/appointments/:id", getAppointmentAudit)
		api.GET("/audit/summary", getAuditSummary)
	}

	// Start server
	log.Println("Starting Careo Backend on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Placeholder handlers - will be implemented later
func getPatients(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get patients - to be implemented"})
}

func getPatient(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get patient - to be implemented"})
}

func createPatient(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create patient - to be implemented"})
}

func updatePatient(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update patient - to be implemented"})
}

func deletePatient(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete patient - to be implemented"})
}

func getDoctors(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get doctors - to be implemented"})
}

func getDoctor(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get doctor - to be implemented"})
}

func createDoctor(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create doctor - to be implemented"})
}

func updateDoctor(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update doctor - to be implemented"})
}

func deleteDoctor(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete doctor - to be implemented"})
}

func getAppointments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get appointments - to be implemented"})
}

func getAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get appointment - to be implemented"})
}

func createAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create appointment - to be implemented"})
}

func updateAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update appointment - to be implemented"})
}

func deleteAppointment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete appointment - to be implemented"})
}

func getPatientAudit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get patient audit - to be implemented"})
}

func getDoctorAudit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get doctor audit - to be implemented"})
}

func getAppointmentAudit(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get appointment audit - to be implemented"})
}

func getAuditSummary(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get audit summary - to be implemented"})
}
