package controllers

import (
	"net/http"

	"collegeMaterialManagement/models"
	"collegeMaterialManagement/pkg/jwt"
	"collegeMaterialManagement/pkg/util"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token     string `json:"token"`
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	RoleID    uint   `json:"role_id"`
	RoleName  string `json:"role_name"`
	TeacherID *uint  `json:"teacher_id"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var user models.User
	if err := models.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "用户名或密码错误",
		})
		return
	}

	if user.Status != 1 {
		c.JSON(http.StatusForbidden, gin.H{
			"code": 403,
			"msg":  "用户已被禁用",
		})
		return
	}

	if !util.CheckPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "用户名或密码错误",
		})
		return
	}

	var role models.Role
	models.DB.First(&role, user.RoleID)

	token, err := jwt.GenerateToken(user.ID, user.Username, user.RoleID, user.TeacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "生成token失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "登录成功",
		"data": LoginResponse{
			Token:     token,
			UserID:    user.ID,
			Username:  user.Username,
			RoleID:    user.RoleID,
			RoleName:  role.Name,
			TeacherID: user.TeacherID,
		},
	})
}

func GetUserInfo(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := models.DB.Preload("Role").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"role_id":   user.RoleID,
			"role_name": user.Role.Name,
			"teacher_id": user.TeacherID,
		},
	})
}
