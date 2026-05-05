package controllers

import (
	"net/http"
	"strconv"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetClaims(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	materialName := c.Query("material_name")
	teacherName := c.Query("teacher_name")
	status := c.Query("status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var claims []models.Claim
	var total int

	query := models.DB.Model(&models.Claim{}).
		Preload("Material").Preload("Material.Type").
		Preload("Teacher").Preload("Operator")

	if materialName != "" {
		query = query.Joins("JOIN materials ON materials.id = claims.material_id").
			Where("materials.name LIKE ?", "%"+materialName+"%")
	}

	if teacherName != "" {
		query = query.Joins("JOIN teachers ON teachers.id = claims.teacher_id").
			Where("teachers.name LIKE ?", "%"+teacherName+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&claims)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     claims,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetClaim(c *gin.Context) {
	id := c.Param("id")

	var claim models.Claim
	if err := models.DB.Preload("Material").Preload("Material.Type").
		Preload("Teacher").Preload("Operator").First(&claim, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "领取记录不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": claim,
	})
}

func UpdateClaimStatus(c *gin.Context) {
	id := c.Param("id")

	var claim models.Claim
	if err := models.DB.First(&claim, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "领取记录不存在",
		})
		return
	}

	var req struct {
		Status int    `json:"status" binding:"required"`
		Remark string `json:"remark"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	if req.Status < 0 || req.Status > 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "状态值无效",
		})
		return
	}

	claim.Status = req.Status
	if req.Remark != "" {
		claim.Remark = req.Remark
	}

	if req.Status == 1 {
		var stock models.Stock
		if err := models.DB.Where("material_id = ?", claim.MaterialID).First(&stock).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "该物资不存在库存",
			})
			return
		}

		if stock.Quantity < claim.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "库存不足",
			})
			return
		}

		tx := models.DB.Begin()

		stock.Quantity -= claim.Quantity
		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新库存失败: " + err.Error(),
			})
			return
		}

		userID := c.GetUint("user_id")
		inventoryOut := models.InventoryOut{
			MaterialID: claim.MaterialID,
			Quantity:   claim.Quantity,
			Remark:     "发放领取: " + claim.Reason,
			OperatorID: userID,
		}
		if err := tx.Create(&inventoryOut).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "创建出库记录失败: " + err.Error(),
			})
			return
		}

		if err := tx.Save(&claim).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新领取记录失败: " + err.Error(),
			})
			return
		}

		tx.Commit()
	} else {
		if err := models.DB.Save(&claim).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新失败: " + err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "状态更新成功",
		"data": claim,
	})
}

func GetTeacherMaterials(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	name := c.Query("name")
	typeID := c.Query("type_id")

	var materials []models.Material
	var total int

	query := models.DB.Model(&models.Material{}).
		Preload("Type").Preload("Stocks").
		Where("status = ?", 1)

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	if typeID != "" {
		query = query.Where("type_id = ?", typeID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Find(&materials)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     materials,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func CreateClaim(c *gin.Context) {
	var claim models.Claim
	if err := c.ShouldBindJSON(&claim); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	teacherID, exists := c.Get("teacher_id")
	if !exists || teacherID == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请先关联教师信息",
		})
		return
	}

	var stock models.Stock
	if err := models.DB.Where("material_id = ?", claim.MaterialID).First(&stock).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该物资不存在库存",
		})
		return
	}

	if stock.Quantity < claim.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "库存不足",
		})
		return
	}

	claim.TeacherID = teacherID.(uint)
	claim.Status = 0

	if err := models.DB.Create(&claim).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "申请失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "申请成功",
		"data": claim,
	})
}

func GetTeacherClaims(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	materialName := c.Query("material_name")
	status := c.Query("status")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	teacherID, exists := c.Get("teacher_id")
	if !exists || teacherID == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请先关联教师信息",
		})
		return
	}

	var claims []models.Claim
	var total int

	query := models.DB.Model(&models.Claim{}).
		Preload("Material").Preload("Material.Type").
		Preload("Teacher").Preload("Operator").
		Where("teacher_id = ?", teacherID.(uint))

	if materialName != "" {
		query = query.Joins("JOIN materials ON materials.id = claims.material_id").
			Where("materials.name LIKE ?", "%"+materialName+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&claims)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     claims,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetTeacherClaim(c *gin.Context) {
	id := c.Param("id")

	teacherID, exists := c.Get("teacher_id")
	if !exists || teacherID == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请先关联教师信息",
		})
		return
	}

	var claim models.Claim
	if err := models.DB.Preload("Material").Preload("Material.Type").
		Preload("Teacher").Preload("Operator").
		Where("id = ? AND teacher_id = ?", id, teacherID.(uint)).
		First(&claim).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "领取记录不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": claim,
	})
}
