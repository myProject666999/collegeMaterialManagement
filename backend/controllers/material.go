package controllers

import (
	"net/http"
	"strconv"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetMaterialTypes(c *gin.Context) {
	var types []models.MaterialType
	models.DB.Find(&types)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": types,
	})
}

func GetMaterialType(c *gin.Context) {
	id := c.Param("id")

	var materialType models.MaterialType
	if err := models.DB.First(&materialType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资类型不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": materialType,
	})
}

func CreateMaterialType(c *gin.Context) {
	var materialType models.MaterialType
	if err := c.ShouldBindJSON(&materialType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var existingType models.MaterialType
	if models.DB.Where("code = ?", materialType.Code).First(&existingType).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "类型代码已存在",
		})
		return
	}

	if err := models.DB.Create(&materialType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": materialType,
	})
}

func UpdateMaterialType(c *gin.Context) {
	id := c.Param("id")

	var materialType models.MaterialType
	if err := models.DB.First(&materialType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资类型不存在",
		})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	delete(updateData, "id")
	delete(updateData, "created_at")
	delete(updateData, "updated_at")

	if err := models.DB.Model(&materialType).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": materialType,
	})
}

func DeleteMaterialType(c *gin.Context) {
	id := c.Param("id")

	var materialType models.MaterialType
	if err := models.DB.First(&materialType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资类型不存在",
		})
		return
	}

	var materialCount int
	models.DB.Model(&models.Material{}).Where("type_id = ?", materialType.ID).Count(&materialCount)
	if materialCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该类型下存在物资，无法删除",
		})
		return
	}

	if err := models.DB.Delete(&materialType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func GetMaterials(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	name := c.Query("name")
	code := c.Query("code")
	typeID := c.Query("type_id")
	status := c.Query("status")

	var materials []models.Material
	var total int

	query := models.DB.Model(&models.Material{}).Preload("Type").Preload("Stocks")

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	if code != "" {
		query = query.Where("code LIKE ?", "%"+code+"%")
	}

	if typeID != "" {
		query = query.Where("type_id = ?", typeID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
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

func GetMaterial(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := models.DB.Preload("Type").Preload("Stocks").First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": material,
	})
}

func CreateMaterial(c *gin.Context) {
	var material models.Material
	if err := c.ShouldBindJSON(&material); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var existingMaterial models.Material
	if models.DB.Where("code = ?", material.Code).First(&existingMaterial).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "物资编码已存在",
		})
		return
	}

	if err := models.DB.Create(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	stock := models.Stock{
		MaterialID: material.ID,
		Quantity:   0,
	}
	models.DB.Create(&stock)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": material,
	})
}

func UpdateMaterial(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := models.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资不存在",
		})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	delete(updateData, "id")
	delete(updateData, "created_at")
	delete(updateData, "updated_at")

	if err := models.DB.Model(&material).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": material,
	})
}

func DeleteMaterial(c *gin.Context) {
	id := c.Param("id")

	var material models.Material
	if err := models.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "物资不存在",
		})
		return
	}

	var claimCount int
	models.DB.Model(&models.Claim{}).Where("material_id = ?", material.ID).Count(&claimCount)
	if claimCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该物资存在领取记录，无法删除",
		})
		return
	}

	models.DB.Where("material_id = ?", material.ID).Delete(&models.Stock{})

	if err := models.DB.Delete(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}
