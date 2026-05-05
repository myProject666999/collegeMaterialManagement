import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialTypes } from '../../services/api';
import { Material, MaterialType } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const MaterialPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchMaterialTypes = async () => {
    try {
      const result = await getMaterialTypes();
      setMaterialTypes(result.data);
    } catch (error) {
      console.error('Failed to fetch material types:', error);
    }
  };

  const fetchMaterials = async (params?: { name?: string; type_id?: number; status?: number }) => {
    setLoading(true);
    try {
      const result = await getMaterials({
        page: currentPage,
        pageSize,
        ...params,
      });
      setMaterials(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialTypes();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Material) => {
    setEditingMaterial(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type_id: record.type_id,
      unit: record.unit,
      description: record.description,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMaterial(id);
      message.success('删除成功');
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, values);
        message.success('更新成功');
      } else {
        await createMaterial(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to submit material:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    fetchMaterials({
      name: values.name,
      type_id: values.type_id,
      status: values.status,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchMaterials();
  };

  const columns: ColumnsType<Material> = [
    {
      title: '物资名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '物资编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '物资类型',
      dataIndex: ['type', 'name'],
      key: 'type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '库存数量',
      key: 'stock_quantity',
      render: (_: any, record: Material) => (
        <span style={{ color: record.stocks && record.stocks[0]?.quantity > 0 ? 'green' : 'red' }}>
          {record.stocks?.[0]?.quantity || 0}
        </span>
      ),
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
      render: (_: any, record: Material) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <h2>物资购买管理</h2>
      </div>

      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        className="search-form"
      >
        <Form.Item name="name" label="物资名称">
          <Input placeholder="请输入物资名称" prefix={<SearchOutlined />} />
        </Form.Item>
        <Form.Item name="type_id" label="物资类型">
          <Select placeholder="请选择物资类型" style={{ width: 150 }} allowClear>
            {materialTypes.map(type => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
            <Option value={1}>启用</Option>
            <Option value={0}>禁用</Option>
          </Select>
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
          新增物资
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={materials}
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
        title={editingMaterial ? '编辑物资' : '新增物资'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="物资名称"
            rules={[{ required: true, message: '请输入物资名称' }]}
          >
            <Input placeholder="请输入物资名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="物资编码"
            rules={[{ required: true, message: '请输入物资编码' }]}
          >
            <Input placeholder="请输入物资编码" />
          </Form.Item>
          <Form.Item
            name="type_id"
            label="物资类型"
            rules={[{ required: true, message: '请选择物资类型' }]}
          >
            <Select placeholder="请选择物资类型">
              {materialTypes.map(type => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="请输入单位，如：个、件、台等" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述信息" rows={3} />
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

export default MaterialPage;
