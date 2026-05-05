package controllers

import (
	"net/http"
	"strconv"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetRoles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "100"))
	name := c.Query("name")

	var roles []models.Role
	var total int

	query := models.DB.Model(&models.Role{})

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Preload("Permissions").Find(&roles)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     roles,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := models.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "角色不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": role,
	})
}

func CreateRole(c *gin.Context) {
	var role models.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var existingRole models.Role
	if models.DB.Where("name = ?", role.Name).First(&existingRole).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "角色名称已存在",
		})
		return
	}

	if err := models.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": role,
	})
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := models.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "角色不存在",
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

	if err := models.DB.Model(&role).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": role,
	})
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := models.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "角色不存在",
		})
		return
	}

	if role.ID <= 2 {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "系统默认角色无法删除",
		})
		return
	}

	var userCount int
	models.DB.Model(&models.User{}).Where("role_id = ?", role.ID).Count(&userCount)
	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该角色下存在用户，无法删除",
		})
		return
	}

	if err := models.DB.Delete(&role).Error; err != nil {
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

func GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	models.DB.Find(&permissions)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": permissions,
	})
}

func GetPermission(c *gin.Context) {
	id := c.Param("id")

	var permission models.Permission
	if err := models.DB.First(&permission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "权限不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": permission,
	})
}

func CreatePermission(c *gin.Context) {
	var permission models.Permission
	if err := c.ShouldBindJSON(&permission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var existingPermission models.Permission
	if models.DB.Where("code = ?", permission.Code).First(&existingPermission).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "权限代码已存在",
		})
		return
	}

	if err := models.DB.Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": permission,
	})
}

func UpdatePermission(c *gin.Context) {
	id := c.Param("id")

	var permission models.Permission
	if err := models.DB.First(&permission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "权限不存在",
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

	if err := models.DB.Model(&permission).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": permission,
	})
}

func DeletePermission(c *gin.Context) {
	id := c.Param("id")

	var permission models.Permission
	if err := models.DB.First(&permission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "权限不存在",
		})
		return
	}

	if err := models.DB.Delete(&permission).Error; err != nil {
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
