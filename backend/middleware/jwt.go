package middleware

import (
	"net/http"
	"strings"

	"collegeMaterialManagement/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "未提供认证信息",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "认证格式错误",
			})
			c.Abort()
			return
		}

		claims, err := jwt.ParseToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code": 401,
				"msg":  "认证失败: " + err.Error(),
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role_id", claims.RoleID)
		c.Set("teacher_id", claims.TeacherID)
		c.Next()
	}
}

func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "无权限访问",
			})
			c.Abort()
			return
		}

		adminRoleID := uint(1)
		if roleID != adminRoleID {
			c.JSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "需要管理员权限",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func TeacherAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "无权限访问",
			})
			c.Abort()
			return
		}

		teacherRoleID := uint(2)
		if roleID != teacherRoleID {
			c.JSON(http.StatusForbidden, gin.H{
				"code": 403,
				"msg":  "需要教师权限",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
