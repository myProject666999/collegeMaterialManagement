package models

import (
	"log"

	"collegeMaterialManagement/config"

	"github.com/jinzhu/gorm"
)

func SetupDB() *gorm.DB {
	var err error
	db, err := gorm.Open(config.Database.Type, config.GetDBConnString())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	db.DB().SetMaxIdleConns(10)
	db.DB().SetMaxOpenConns(100)
	db.LogMode(true)

	return db
}
