package routers

import (
	"collegeMaterialManagement/controllers"
	"collegeMaterialManagement/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := router.Group("/api")
	{
		api.POST("/login", controllers.Login)

		auth := api.Group("")
		auth.Use(middleware.JWTAuth())
		{
			auth.GET("/user/info", controllers.GetUserInfo)

			admin := auth.Group("")
			admin.Use(middleware.AdminAuth())
			{
				admin.GET("/users", controllers.GetUsers)
				admin.GET("/users/:id", controllers.GetUser)
				admin.POST("/users", controllers.CreateUser)
				admin.PUT("/users/:id", controllers.UpdateUser)
				admin.DELETE("/users/:id", controllers.DeleteUser)
				admin.PUT("/users/:id/password", controllers.ResetPassword)

				admin.GET("/teachers", controllers.GetTeachers)
				admin.GET("/teachers/:id", controllers.GetTeacher)
				admin.POST("/teachers", controllers.CreateTeacher)
				admin.PUT("/teachers/:id", controllers.UpdateTeacher)
				admin.DELETE("/teachers/:id", controllers.DeleteTeacher)

				admin.GET("/roles", controllers.GetRoles)
				admin.GET("/roles/:id", controllers.GetRole)
				admin.POST("/roles", controllers.CreateRole)
				admin.PUT("/roles/:id", controllers.UpdateRole)
				admin.DELETE("/roles/:id", controllers.DeleteRole)

				admin.GET("/permissions", controllers.GetPermissions)
				admin.GET("/permissions/:id", controllers.GetPermission)
				admin.POST("/permissions", controllers.CreatePermission)
				admin.PUT("/permissions/:id", controllers.UpdatePermission)
				admin.DELETE("/permissions/:id", controllers.DeletePermission)

				admin.GET("/menus", controllers.GetMenus)
				admin.GET("/menus/:id", controllers.GetMenu)
				admin.POST("/menus", controllers.CreateMenu)
				admin.PUT("/menus/:id", controllers.UpdateMenu)
				admin.DELETE("/menus/:id", controllers.DeleteMenu)
				admin.GET("/menus/tree", controllers.GetMenuTree)

				admin.GET("/material-types", controllers.GetMaterialTypes)
				admin.GET("/material-types/:id", controllers.GetMaterialType)
				admin.POST("/material-types", controllers.CreateMaterialType)
				admin.PUT("/material-types/:id", controllers.UpdateMaterialType)
				admin.DELETE("/material-types/:id", controllers.DeleteMaterialType)

				admin.GET("/materials", controllers.GetMaterials)
				admin.GET("/materials/:id", controllers.GetMaterial)
				admin.POST("/materials", controllers.CreateMaterial)
				admin.PUT("/materials/:id", controllers.UpdateMaterial)
				admin.DELETE("/materials/:id", controllers.DeleteMaterial)

				admin.GET("/stocks", controllers.GetStocks)
				admin.GET("/stocks/:id", controllers.GetStock)

				admin.GET("/inventory-in", controllers.GetInventoryInList)
				admin.GET("/inventory-in/:id", controllers.GetInventoryIn)
				admin.POST("/inventory-in", controllers.CreateInventoryIn)

				admin.GET("/inventory-out", controllers.GetInventoryOutList)
				admin.GET("/inventory-out/:id", controllers.GetInventoryOut)
				admin.POST("/inventory-out", controllers.CreateInventoryOut)

				admin.GET("/claims", controllers.GetClaims)
				admin.GET("/claims/:id", controllers.GetClaim)
				admin.PUT("/claims/:id/status", controllers.UpdateClaimStatus)

				admin.GET("/statistics/inventory-in", controllers.GetInventoryInStatistics)
				admin.GET("/statistics/inventory-out", controllers.GetInventoryOutStatistics)
				admin.GET("/statistics/material-type", controllers.GetMaterialTypeStatistics)
			}

			teacher := auth.Group("")
			teacher.Use(middleware.TeacherAuth())
			{
				teacher.GET("/teacher/materials", controllers.GetTeacherMaterials)
				teacher.POST("/teacher/claims", controllers.CreateClaim)
				teacher.GET("/teacher/claims", controllers.GetTeacherClaims)
				teacher.GET("/teacher/claims/:id", controllers.GetTeacherClaim)
			}
		}
	}

	return router
}
