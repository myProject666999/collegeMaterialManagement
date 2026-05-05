package controllers

import (
	"net/http"
	"strconv"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetStocks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	materialName := c.Query("material_name")

	var stocks []models.Stock
	var total int

	query := models.DB.Model(&models.Stock{}).Preload("Material").Preload("Material.Type")

	if materialName != "" {
		query = query.Joins("JOIN materials ON materials.id = stocks.material_id").
			Where("materials.name LIKE ?", "%"+materialName+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Find(&stocks)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     stocks,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetStock(c *gin.Context) {
	id := c.Param("id")

	var stock models.Stock
	if err := models.DB.Preload("Material").Preload("Material.Type").First(&stock, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "库存不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": stock,
	})
}

func GetInventoryInList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	materialName := c.Query("material_name")
	supplier := c.Query("supplier")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var inventoryIns []models.InventoryIn
	var total int

	query := models.DB.Model(&models.InventoryIn{}).Preload("Material").Preload("Material.Type").Preload("Operator")

	if materialName != "" {
		query = query.Joins("JOIN materials ON materials.id = inventory_ins.material_id").
			Where("materials.name LIKE ?", "%"+materialName+"%")
	}

	if supplier != "" {
		query = query.Where("supplier LIKE ?", "%"+supplier+"%")
	}

	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&inventoryIns)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     inventoryIns,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetInventoryIn(c *gin.Context) {
	id := c.Param("id")

	var inventoryIn models.InventoryIn
	if err := models.DB.Preload("Material").Preload("Material.Type").Preload("Operator").First(&inventoryIn, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "入库记录不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": inventoryIn,
	})
}

func CreateInventoryIn(c *gin.Context) {
	var inventoryIn models.InventoryIn
	if err := c.ShouldBindJSON(&inventoryIn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	userID := c.GetUint("user_id")
	inventoryIn.OperatorID = userID

	inventoryIn.TotalPrice = float64(inventoryIn.Quantity) * inventoryIn.UnitPrice

	tx := models.DB.Begin()

	if err := tx.Create(&inventoryIn).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	var stock models.Stock
	if err := tx.Where("material_id = ?", inventoryIn.MaterialID).First(&stock).Error; err != nil {
		stock = models.Stock{
			MaterialID: inventoryIn.MaterialID,
			Quantity:   inventoryIn.Quantity,
		}
		if err := tx.Create(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新库存失败: " + err.Error(),
			})
			return
		}
	} else {
		stock.Quantity += inventoryIn.Quantity
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新库存失败: " + err.Error(),
			})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "入库成功",
		"data": inventoryIn,
	})
}

func GetInventoryOutList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	materialName := c.Query("material_name")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var inventoryOuts []models.InventoryOut
	var total int

	query := models.DB.Model(&models.InventoryOut{}).Preload("Material").Preload("Material.Type").Preload("Operator")

	if materialName != "" {
		query = query.Joins("JOIN materials ON materials.id = inventory_outs.material_id").
			Where("materials.name LIKE ?", "%"+materialName+"%")
	}

	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&inventoryOuts)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     inventoryOuts,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetInventoryOut(c *gin.Context) {
	id := c.Param("id")

	var inventoryOut models.InventoryOut
	if err := models.DB.Preload("Material").Preload("Material.Type").Preload("Operator").First(&inventoryOut, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "出库记录不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": inventoryOut,
	})
}

func CreateInventoryOut(c *gin.Context) {
	var inventoryOut models.InventoryOut
	if err := c.ShouldBindJSON(&inventoryOut); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	userID := c.GetUint("user_id")
	inventoryOut.OperatorID = userID

	var stock models.Stock
	if err := models.DB.Where("material_id = ?", inventoryOut.MaterialID).First(&stock).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该物资不存在库存",
		})
		return
	}

	if stock.Quantity < inventoryOut.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "库存不足",
		})
		return
	}

	tx := models.DB.Begin()

	if err := tx.Create(&inventoryOut).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	stock.Quantity -= inventoryOut.Quantity
	if err := tx.Save(&stock).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新库存失败: " + err.Error(),
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "出库成功",
		"data": inventoryOut,
	})
}
