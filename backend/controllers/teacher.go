package controllers

import (
	"net/http"
	"strconv"

	"collegeMaterialManagement/models"

	"github.com/gin-gonic/gin"
)

func GetTeachers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	name := c.Query("name")
	teacherNo := c.Query("teacher_no")
	department := c.Query("department")
	status := c.Query("status")

	var teachers []models.Teacher
	var total int

	query := models.DB.Model(&models.Teacher{})

	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	if teacherNo != "" {
		query = query.Where("teacher_no LIKE ?", "%"+teacherNo+"%")
	}

	if department != "" {
		query = query.Where("department LIKE ?", "%"+department+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Find(&teachers)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":     teachers,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

func GetTeacher(c *gin.Context) {
	id := c.Param("id")

	var teacher models.Teacher
	if err := models.DB.First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "教师不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": teacher,
	})
}

func CreateTeacher(c *gin.Context) {
	var teacher models.Teacher
	if err := c.ShouldBindJSON(&teacher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var existingTeacher models.Teacher
	if models.DB.Where("teacher_no = ?", teacher.TeacherNo).First(&existingTeacher).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "工号已存在",
		})
		return
	}

	if err := models.DB.Create(&teacher).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": teacher,
	})
}

func UpdateTeacher(c *gin.Context) {
	id := c.Param("id")

	var teacher models.Teacher
	if err := models.DB.First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "教师不存在",
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

	if err := models.DB.Model(&teacher).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
		"data": teacher,
	})
}

func DeleteTeacher(c *gin.Context) {
	id := c.Param("id")

	var teacher models.Teacher
	if err := models.DB.First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "教师不存在",
		})
		return
	}

	var claimCount int
	models.DB.Model(&models.Claim{}).Where("teacher_id = ?", teacher.ID).Count(&claimCount)
	if claimCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该教师存在领取记录，无法删除",
		})
		return
	}

	if err := models.DB.Delete(&teacher).Error; err != nil {
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
