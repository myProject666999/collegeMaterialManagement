package controllers

import (
	"net/http"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetMenus(c *gin.Context) {
	var menus []models.Menu
	models.DB.Preload("Permission").Order("sort ASC").Find(&menus)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": menus,
	})
}

func GetMenuTree(c *gin.Context) {
	var menus []models.Menu
	models.DB.Where("parent_id IS NULL").Preload("Children").Order("sort ASC").Find(&menus)

	buildMenuTree(menus)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": menus,
	})
}

func buildMenuTree(menus []models.Menu) {
	for i := range menus {
		var children []models.Menu
		models.DB.Where("parent_id = ?", menus[i].ID).Preload("Children").Order("sort ASC").Find(&children)
		menus[i].Children = children
		if len(children) > 0 {
			buildMenuTree(children)
		}
	}
}

func GetMenu(c *gin.Context) {
	id := c.Param("id")

	var menu models.Menu
	if err := models.DB.Preload("Permission").First(&menu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "菜单不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": menu,
	})
}

func CreateMenu(c *gin.Context) {
	var menu models.Menu
	if err := c.ShouldBindJSON(&menu); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	if err := models.DB.Create(&menu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": menu,
	})
}

func UpdateMenu(c *gin.Context) {
	id := c.Param("id")

	var menu models.Menu
	if err := models.DB.First(&menu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "菜单不存在",
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

	if err := models.DB.Model(&menu).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": menu,
	})
}

func DeleteMenu(c *gin.Context) {
	id := c.Param("id")

	var menu models.Menu
	if err := models.DB.First(&menu, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "菜单不存在",
		})
		return
	}

	var childCount int
	models.DB.Model(&models.Menu{}).Where("parent_id = ?", menu.ID).Count(&childCount)
	if childCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该菜单存在子菜单，无法删除",
		})
		return
	}

	if err := models.DB.Delete(&menu).Error; err != nil {
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
