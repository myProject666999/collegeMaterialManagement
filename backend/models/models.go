package models

import (
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

type Model struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `sql:"index" json:"deleted_at,omitempty"`
}

type User struct {
	Model
	Username   string `gorm:"unique_index;not null" json:"username"`
	Password   string `gorm:"not null" json:"password"`
	RoleID     uint   `json:"role_id"`
	TeacherID  *uint  `json:"teacher_id"`
	Status     int    `gorm:"default:1" json:"status"`
	Role       Role   `gorm:"foreignkey:RoleID" json:"role,omitempty"`
	Teacher    *Teacher `gorm:"foreignkey:TeacherID" json:"teacher,omitempty"`
}

type Role struct {
	Model
	Name        string `gorm:"unique_index;not null" json:"name"`
	Description string `json:"description"`
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions,omitempty"`
	Users       []User `gorm:"foreignkey:RoleID" json:"users,omitempty"`
}

type Permission struct {
	Model
	Name        string `gorm:"not null" json:"name"`
	Code        string `gorm:"unique_index;not null" json:"code"`
	Description string `json:"description"`
	Roles       []Role `gorm:"many2many:role_permissions;" json:"roles,omitempty"`
}

type Menu struct {
	Model
	Name       string `gorm:"not null" json:"name"`
	Path       string `json:"path"`
	Icon       string `json:"icon"`
	ParentID   *uint  `json:"parent_id"`
	Sort       int    `gorm:"default:0" json:"sort"`
	PermissionID *uint `json:"permission_id"`
	Status     int    `gorm:"default:1" json:"status"`
	Parent     *Menu  `gorm:"foreignkey:ParentID" json:"parent,omitempty"`
	Children   []Menu `gorm:"foreignkey:ParentID" json:"children,omitempty"`
	Permission *Permission `gorm:"foreignkey:PermissionID" json:"permission,omitempty"`
}

type Teacher struct {
	Model
	TeacherNo  string `gorm:"unique_index;not null" json:"teacher_no"`
	Name       string `gorm:"not null" json:"name"`
	Gender     string `json:"gender"`
	Phone      string `json:"phone"`
	Email      string `json:"email"`
	Department string `json:"department"`
	Status     int    `gorm:"default:1" json:"status"`
}

type MaterialType struct {
	Model
	Name        string `gorm:"unique_index;not null" json:"name"`
	Code        string `gorm:"unique_index;not null" json:"code"`
	Description string `json:"description"`
	Materials   []Material `gorm:"foreignkey:TypeID" json:"materials,omitempty"`
}

type Material struct {
	Model
	Name        string       `gorm:"not null" json:"name"`
	Code        string       `gorm:"unique_index;not null" json:"code"`
	TypeID      uint         `json:"type_id"`
	Unit        string       `json:"unit"`
	Description string       `json:"description"`
	Status      int          `gorm:"default:1" json:"status"`
	Type        MaterialType `gorm:"foreignkey:TypeID" json:"type,omitempty"`
	Stocks      []Stock      `gorm:"foreignkey:MaterialID" json:"stocks,omitempty"`
}

type Stock struct {
	Model
	MaterialID uint     `gorm:"not null" json:"material_id"`
	Quantity   int      `gorm:"not null;default:0" json:"quantity"`
	MinStock   int      `gorm:"default:0" json:"min_stock"`
	MaxStock   int      `gorm:"default:0" json:"max_stock"`
	Location   string   `json:"location"`
	Material   Material `gorm:"foreignkey:MaterialID" json:"material,omitempty"`
}

type InventoryIn struct {
	Model
	MaterialID   uint     `gorm:"not null" json:"material_id"`
	Quantity     int      `gorm:"not null" json:"quantity"`
	UnitPrice    float64  `json:"unit_price"`
	TotalPrice   float64  `json:"total_price"`
	Supplier     string   `json:"supplier"`
	BatchNo      string   `json:"batch_no"`
	Remark       string   `json:"remark"`
	OperatorID   uint     `json:"operator_id"`
	Material     Material `gorm:"foreignkey:MaterialID" json:"material,omitempty"`
	Operator     User     `gorm:"foreignkey:OperatorID" json:"operator,omitempty"`
}

type InventoryOut struct {
	Model
	MaterialID   uint     `gorm:"not null" json:"material_id"`
	Quantity     int      `gorm:"not null" json:"quantity"`
	Remark       string   `json:"remark"`
	OperatorID   uint     `json:"operator_id"`
	Material     Material `gorm:"foreignkey:MaterialID" json:"material,omitempty"`
	Operator     User     `gorm:"foreignkey:OperatorID" json:"operator,omitempty"`
}

type Claim struct {
	Model
	MaterialID   uint     `gorm:"not null" json:"material_id"`
	Quantity     int      `gorm:"not null" json:"quantity"`
	TeacherID    uint     `gorm:"not null" json:"teacher_id"`
	Status       int      `gorm:"default:0" json:"status"`
	Reason       string   `json:"reason"`
	Remark       string   `json:"remark"`
	OperatorID   uint     `json:"operator_id"`
	Material     Material `gorm:"foreignkey:MaterialID" json:"material,omitempty"`
	Teacher      Teacher  `gorm:"foreignkey:TeacherID" json:"teacher,omitempty"`
	Operator     User     `gorm:"foreignkey:OperatorID" json:"operator,omitempty"`
}

var DB *gorm.DB

func Setup(db *gorm.DB) {
	DB = db
	DB.AutoMigrate(
		&User{},
		&Role{},
		&Permission{},
		&Menu{},
		&Teacher{},
		&MaterialType{},
		&Material{},
		&Stock{},
		&InventoryIn{},
		&InventoryOut{},
		&Claim{},
	)
	initData()
}

func initData() {
	var count int
	DB.Model(&Role{}).Count(&count)
	if count == 0 {
		adminRole := Role{Name: "管理员", Description: "系统管理员"}
		teacherRole := Role{Name: "教师", Description: "普通教师用户"}
		DB.Create(&adminRole)
		DB.Create(&teacherRole)

		types := []MaterialType{
			{Name: "固定资产", Code: "fixed_asset"},
			{Name: "消耗品", Code: "consumable"},
			{Name: "福利物品", Code: "welfare"},
		}
		for _, t := range types {
			DB.Create(&t)
		}
	}
}
