package config

import (
	"fmt"
	"log"

	"gopkg.in/ini.v1"
)

var (
	Server   *ServerConfig
	Database *DatabaseConfig
)

type ServerConfig struct {
	HttpPort int
	RunMode  string
}

type DatabaseConfig struct {
	Type        string
	User        string
	Password    string
	Host        string
	Name        string
	TablePrefix string
}

func init() {
	loadConfig("config/app.ini")
}

func loadConfig(path string) {
	cfg, err := ini.Load(path)
	if err != nil {
		log.Fatalf("Fail to read config file: %v", err)
	}

	Server = &ServerConfig{
		HttpPort: cfg.Section("server").Key("HttpPort").MustInt(8080),
		RunMode:  cfg.Section("server").Key("RunMode").MustString("debug"),
	}

	Database = &DatabaseConfig{
		Type:        cfg.Section("database").Key("Type").MustString("mysql"),
		User:        cfg.Section("database").Key("User").MustString("root"),
		Password:    cfg.Section("database").Key("Password").MustString(""),
		Host:        cfg.Section("database").Key("Host").MustString("127.0.0.1:3306"),
		Name:        cfg.Section("database").Key("Name").MustString("college_material_management"),
		TablePrefix: cfg.Section("database").Key("TablePrefix").MustString(""),
	}
}

func GetDBConnString() string {
	switch Database.Type {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True&loc=Local",
			Database.User,
			Database.Password,
			Database.Host,
			Database.Name,
		)
	default:
		return ""
	}
}
