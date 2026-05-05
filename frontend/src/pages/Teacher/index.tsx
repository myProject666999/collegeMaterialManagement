import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/api';
import { Teacher } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const TeacherPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchTeachers = async (params?: { name?: string; department?: string }) => {
    setLoading(true);
    try {
      const result = await getTeachers({
        page: currentPage,
        pageSize,
        ...params,
      });
      setTeachers(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    setEditingTeacher(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Teacher) => {
    setEditingTeacher(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTeacher(id);
      message.success('删除成功');
      fetchTeachers();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, values);
        message.success('更新成功');
      } else {
        await createTeacher(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchTeachers();
    } catch (error) {
      console.error('Failed to submit teacher:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    fetchTeachers({
      name: values.name,
      department: values.department,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchTeachers();
  };

  const columns: ColumnsType<Teacher> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '教师姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '工号',
      dataIndex: 'employee_id',
      key: 'employee_id',
    },
    {
      title: '院系',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '在职' : '离职'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Teacher) => (
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
            title="确定要删除这个教师吗？"
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

  return (
    <div>
      <div className="page-header">
        <h2>教师管理</h2>
      </div>

      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        className="search-form"
      >
        <Form.Item name="name" label="教师姓名">
          <Input placeholder="请输入教师姓名" prefix={<SearchOutlined />} />
        </Form.Item>
        <Form.Item name="department" label="院系">
          <Input placeholder="请输入院系" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增教师
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={teachers}
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

      <Modal
        title={editingTeacher ? '编辑教师' : '新增教师'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="教师姓名"
            rules={[{ required: true, message: '请输入教师姓名' }]}
          >
            <Input placeholder="请输入教师姓名" />
          </Form.Item>
          <Form.Item
            name="employee_id"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input placeholder="请输入工号" />
          </Form.Item>
          <Form.Item
            name="department"
            label="院系"
            rules={[{ required: true, message: '请输入院系' }]}
          >
            <Input placeholder="请输入院系" />
          </Form.Item>
          <Form.Item
            name="title"
            label="职称"
          >
            <Select placeholder="请选择职称" allowClear>
              <Option value="教授">教授</Option>
              <Option value="副教授">副教授</Option>
              <Option value="讲师">讲师</Option>
              <Option value="助教">助教</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>在职</Option>
              <Option value={0}>离职</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherPage;
