import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, theme } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  TeamOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { UserInfo } from '../../types';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  children?: MenuItem[];
}

const adminMenuItems: MenuItem[] = [
  {
    key: 'material',
    icon: <ShoppingCartOutlined />,
    label: '物资购买管理',
    path: '/material',
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: '物资出入库管理',
    path: '/inventory-in',
    children: [
      { key: 'inventory-in', icon: <ImportOutlined />, label: '入库管理', path: '/inventory-in' },
      { key: 'inventory-out', icon: <ExportOutlined />, label: '出库管理', path: '/inventory-out' },
    ],
  },
  {
    key: 'stock',
    icon: <InboxOutlined />,
    label: '物资库存信息',
    path: '/stock',
  },
  {
    key: 'claim',
    icon: <FileTextOutlined />,
    label: '物资领取记录',
    path: '/claim',
  },
  {
    key: 'statistics',
    icon: <BarChartOutlined />,
    label: '统计查询',
    path: '/statistics',
  },
  {
    key: 'teacher',
    icon: <TeamOutlined />,
    label: '教师管理',
    path: '/teacher',
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    path: '/user',
    children: [
      { key: 'user', icon: <UserOutlined />, label: '用户管理', path: '/user' },
      { key: 'role', icon: <SafetyOutlined />, label: '权限管理', path: '/role' },
      { key: 'menu', icon: <AppstoreOutlined />, label: '菜单管理', path: '/menu' },
    ],
  },
];

const teacherMenuItems: MenuItem[] = [
  {
    key: 'material-list',
    icon: <ShoppingCartOutlined />,
    label: '物资列表',
    path: '/teacher/material',
  },
  {
    key: 'my-claim',
    icon: <FileTextOutlined />,
    label: '我的领取记录',
    path: '/teacher/claim',
  },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = userInfo?.role_name === '管理员' ? adminMenuItems : teacherMenuItems;
    return items.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children?.map(child => ({
        key: child.key,
        icon: child.icon,
        label: child.label,
      })),
    }));
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    const keys: string[] = [];
    
    const allMenuItems = userInfo?.role_name === '管理员' ? adminMenuItems : teacherMenuItems;
    
    for (const item of allMenuItems) {
      if (item.path === path) {
        keys.push(item.key);
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            keys.push(child.key);
          }
        }
      }
    }
    
    return keys;
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    const keys: string[] = [];
    
    const allMenuItems = userInfo?.role_name === '管理员' ? adminMenuItems : teacherMenuItems;
    
    for (const item of allMenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            keys.push(item.key);
          }
        }
      }
    }
    
    return keys;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const allMenuItems = userInfo?.role_name === '管理员' ? adminMenuItems : teacherMenuItems;
    
    const findPath = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.key === key) {
          return item.path;
        }
        if (item.children) {
          const childPath = findPath(item.children);
          if (childPath) return childPath;
        }
      }
      return null;
    };

    const path = findPath(allMenuItems);
    if (path) {
      navigate(path);
    }
  };

  const userDropdownMenu = {
    items: [
      {
        key: '1',
        icon: <UserOutlined />,
        label: userInfo?.username,
        disabled: true,
      },
      {
        key: '2',
        icon: <SettingOutlined />,
        label: userInfo?.role_name,
        disabled: true,
      },
      {
        type: 'divider' as const,
      },
      {
        key: '3',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? '物资' : '学院物资管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 24px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Dropdown menu={userDropdownMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{userInfo?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
