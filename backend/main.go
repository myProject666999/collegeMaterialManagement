package main

import (
	"fmt"
	"log"

	"collegeMaterialManagement/config"
	"collegeMaterialManagement/models"
	"collegeMaterialManagement/pkg/util"
	"collegeMaterialManagement/routers"
)

func main() {
	fmt.Println("Starting College Material Management System...")

	db := models.SetupDB()
	defer db.Close()

	models.Setup(db)

	initAdminUser()

	router := routers.SetupRouter()

	addr := fmt.Sprintf(":%d", config.Server.HttpPort)
	fmt.Printf("Server running on http://localhost%s\n", addr)

	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initAdminUser() {
	var count int
	models.DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		hashedPassword, err := util.HashPassword("admin123")
		if err != nil {
			log.Printf("Failed to hash password: %v", err)
			return
		}

		adminUser := models.User{
			Username: "admin",
			Password: hashedPassword,
			RoleID:   1,
			Status:   1,
		}

		if err := models.DB.Create(&adminUser).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
		} else {
			fmt.Println("Default admin user created: username=admin, password=admin123")
		}
	}
}
