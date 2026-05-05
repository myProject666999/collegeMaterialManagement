package controllers

import (
	"net/http"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

type InventoryInStatistics struct {
	TotalQuantity int     `json:"total_quantity"`
	TotalAmount   float64 `json:"total_amount"`
	ByMaterial    []struct {
		MaterialID   uint    `json:"material_id"`
		MaterialName string  `json:"material_name"`
		Quantity     int     `json:"quantity"`
		Amount       float64 `json:"amount"`
	} `json:"by_material"`
	ByMonth []struct {
		Month    string  `json:"month"`
		Quantity int     `json:"quantity"`
		Amount   float64 `json:"amount"`
	} `json:"by_month"`
}

type InventoryOutStatistics struct {
	TotalQuantity int `json:"total_quantity"`
	ByMaterial    []struct {
		MaterialID   uint   `json:"material_id"`
		MaterialName string `json:"material_name"`
		Quantity     int    `json:"quantity"`
	} `json:"by_material"`
	ByMonth []struct {
		Month    string `json:"month"`
		Quantity int    `json:"quantity"`
	} `json:"by_month"`
}

type MaterialTypeStatistics struct {
	TypeName string `json:"type_name"`
	Count    int    `json:"count"`
	Quantity int    `json:"quantity"`
}

func GetInventoryInStatistics(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var stats InventoryInStatistics

	query := models.DB.Model(&models.InventoryIn{})
	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	var totalQuantity int
	var totalAmount float64
	query.Select("COALESCE(SUM(quantity), 0) as total_quantity, COALESCE(SUM(total_price), 0) as total_amount").
		Row().Scan(&totalQuantity, &totalAmount)
	stats.TotalQuantity = totalQuantity
	stats.TotalAmount = totalAmount

	var byMaterial []struct {
		MaterialID   uint    `json:"material_id"`
		MaterialName string  `json:"material_name"`
		Quantity     int     `json:"quantity"`
		Amount       float64 `json:"amount"`
	}

	models.DB.Model(&models.InventoryIn{}).
		Select("inventory_ins.material_id, materials.name as material_name, SUM(inventory_ins.quantity) as quantity, SUM(inventory_ins.total_price) as amount").
		Joins("JOIN materials ON materials.id = inventory_ins.material_id").
		Where(func(db *gorm.DB) *gorm.DB {
			if startDate != "" {
				db = db.Where("DATE(inventory_ins.created_at) >= ?", startDate)
			}
			if endDate != "" {
				db = db.Where("DATE(inventory_ins.created_at) <= ?", endDate)
			}
			return db
		}(models.DB)).
		Group("inventory_ins.material_id, materials.name").
		Order("quantity DESC").
		Limit(10).
		Scan(&byMaterial)
	stats.ByMaterial = byMaterial

	var byMonth []struct {
		Month    string  `json:"month"`
		Quantity int     `json:"quantity"`
		Amount   float64 `json:"amount"`
	}

	models.DB.Model(&models.InventoryIn{}).
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(quantity) as quantity, SUM(total_price) as amount").
		Where(func(db *gorm.DB) *gorm.DB {
			if startDate != "" {
				db = db.Where("DATE(created_at) >= ?", startDate)
			}
			if endDate != "" {
				db = db.Where("DATE(created_at) <= ?", endDate)
			}
			return db
		}(models.DB)).
		Group("month").
		Order("month DESC").
		Limit(12).
		Scan(&byMonth)
	stats.ByMonth = byMonth

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": stats,
	})
}

func GetInventoryOutStatistics(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var stats InventoryOutStatistics

	query := models.DB.Model(&models.InventoryOut{})
	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	var totalQuantity int
	query.Select("COALESCE(SUM(quantity), 0) as total_quantity").
		Row().Scan(&totalQuantity)
	stats.TotalQuantity = totalQuantity

	var byMaterial []struct {
		MaterialID   uint   `json:"material_id"`
		MaterialName string `json:"material_name"`
		Quantity     int    `json:"quantity"`
	}

	models.DB.Model(&models.InventoryOut{}).
		Select("inventory_outs.material_id, materials.name as material_name, SUM(inventory_outs.quantity) as quantity").
		Joins("JOIN materials ON materials.id = inventory_outs.material_id").
		Where(func(db *gorm.DB) *gorm.DB {
			if startDate != "" {
				db = db.Where("DATE(inventory_outs.created_at) >= ?", startDate)
			}
			if endDate != "" {
				db = db.Where("DATE(inventory_outs.created_at) <= ?", endDate)
			}
			return db
		}(models.DB)).
		Group("inventory_outs.material_id, materials.name").
		Order("quantity DESC").
		Limit(10).
		Scan(&byMaterial)
	stats.ByMaterial = byMaterial

	var byMonth []struct {
		Month    string `json:"month"`
		Quantity int    `json:"quantity"`
	}

	models.DB.Model(&models.InventoryOut{}).
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(quantity) as quantity").
		Where(func(db *gorm.DB) *gorm.DB {
			if startDate != "" {
				db = db.Where("DATE(created_at) >= ?", startDate)
			}
			if endDate != "" {
				db = db.Where("DATE(created_at) <= ?", endDate)
			}
			return db
		}(models.DB)).
		Group("month").
		Order("month DESC").
		Limit(12).
		Scan(&byMonth)
	stats.ByMonth = byMonth

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": stats,
	})
}

func GetMaterialTypeStatistics(c *gin.Context) {
	var stats []MaterialTypeStatistics

	models.DB.Model(&models.MaterialType{}).
		Select("material_types.name as type_name, COUNT(DISTINCT materials.id) as count, COALESCE(SUM(stocks.quantity), 0) as quantity").
		Joins("LEFT JOIN materials ON materials.type_id = material_types.id").
		Joins("LEFT JOIN stocks ON stocks.material_id = materials.id").
		Group("material_types.id, material_types.name").
		Scan(&stats)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": stats,
	})
}
