import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tree, InputNumber, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../services/api';
import { Menu } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

const { Option } = Select;
const { TextArea } = Input;

const MenuPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [form] = Form.useForm();

  const buildTreeData = (menuList: Menu[]): DataNode[] => {
    const map: { [key: number]: DataNode } = {};
    const result: DataNode[] = [];

    menuList.forEach(menu => {
      map[menu.id] = {
        title: menu.name,
        key: menu.id,
        children: [],
      };
    });

    menuList.forEach(menu => {
      if (menu.parent_id === 0) {
        result.push(map[menu.id]);
      } else if (map[menu.parent_id]) {
        (map[menu.parent_id].children as DataNode[]).push(map[menu.id]);
      }
    });

    return result;
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const result = await getMenus();
      setMenus(result.data);
      setTotal(result.data.length);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setEditingMenu(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Menu) => {
    setEditingMenu(record);
    form.setFieldsValue({
      name: record.name,
      parent_id: record.parent_id || 0,
      path: record.path,
      icon: record.icon,
      sort: record.sort,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      message.success('删除成功');
      fetchMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMenu) {
        await updateMenu(editingMenu.id, values);
        message.success('更新成功');
      } else {
        await createMenu(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchMenus();
    } catch (error) {
      console.error('Failed to submit menu:', error);
    }
  };

  const columns: ColumnsType<Menu> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '上级菜单',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId: number) => {
        if (parentId === 0) return '顶级菜单';
        const parent = menus.find(m => m.id === parentId);
        return parent?.name || '-';
      },
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Menu) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个菜单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const treeData = buildTreeData(menus);

  return (
    <div>
      <div className="page-header">
        <h2>菜单管理</h2>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 280 }}>
          <div style={{ marginBottom: 16, fontWeight: 'bold' }}>
            <UnorderedListOutlined style={{ marginRight: 8 }} />
            菜单树
          </div>
          <div style={{ border: '1px solid #e8e8e8', padding: 16, borderRadius: 8 }}>
            <Tree
              treeData={treeData}
              defaultExpandAll
            />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增菜单
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={menus}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </div>
      </div>

      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item
            name="parent_id"
            label="上级菜单"
          >
            <Select placeholder="请选择上级菜单（不选则为顶级菜单）" allowClear>
              <Option value={0}>顶级菜单</Option>
              {menus.filter(m => m.parent_id === 0).map(menu => (
                <Option key={menu.id} value={menu.id}>
                  {menu.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="path"
            label="路由路径"
            rules={[{ required: true, message: '请输入路由路径' }]}
          >
            <Input placeholder="请输入路由路径，如 /material" />
          </Form.Item>
          <Form.Item
            name="icon"
            label="图标"
          >
            <Input placeholder="请输入图标名称，如 InboxOutlined" />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber placeholder="请输入排序值" style={{ width: '100%' }} defaultValue={0} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuPage;
