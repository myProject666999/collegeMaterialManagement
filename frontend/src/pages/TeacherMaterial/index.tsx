import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getTeacherMaterials, createClaim, getMaterialTypes } from '../../services/api';
import { Material, MaterialType } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;

const TeacherMaterialPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [claimForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchMaterialTypes = async () => {
    try {
      const result = await getMaterialTypes();
      setMaterialTypes(result.data);
    } catch (error) {
      console.error('Failed to fetch material types:', error);
    }
  };

  const fetchMaterials = async (params?: { name?: string; type_id?: number }) => {
    setLoading(true);
    try {
      const result = await getTeacherMaterials({
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

  const handleClaim = (record: Material) => {
    setSelectedMaterial(record);
    claimForm.resetFields();
    claimForm.setFieldsValue({
      material_id: record.id,
      quantity: 1,
    });
    setClaimModalVisible(true);
  };

  const handleClaimSubmit = async () => {
    try {
      const values = await claimForm.validateFields();
      await createClaim({
        material_id: selectedMaterial?.id,
        quantity: values.quantity,
        reason: values.reason,
      });
      message.success('申请成功，请等待审核');
      setClaimModalVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to create claim:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    fetchMaterials({
      name: values.name,
      type_id: values.type_id,
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
      title: '操作',
      key: 'action',
      render: (_: any, record: Material) => (
        <Space>
          <Button 
            type="primary" 
            onClick={() => handleClaim(record)}
            disabled={!record.stocks || record.stocks[0]?.quantity <= 0}
          >
            领取
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>物资列表</h2>
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
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

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
        title="物资领取申请"
        open={claimModalVisible}
        onOk={handleClaimSubmit}
        onCancel={() => setClaimModalVisible(false)}
        width={500}
      >
        <Form form={claimForm} layout="vertical">
          <Form.Item label="物资名称">
            <Input value={selectedMaterial?.name} disabled />
          </Form.Item>
          <Form.Item label="当前库存">
            <Input value={selectedMaterial?.stocks?.[0]?.quantity || 0} disabled />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="领取数量"
            rules={[
              { required: true, message: '请输入领取数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
              { 
                type: 'number', 
                max: selectedMaterial?.stocks?.[0]?.quantity || 0, 
                message: '数量不能超过库存' 
              },
            ]}
          >
            <InputNumber 
              min={1} 
              max={selectedMaterial?.stocks?.[0]?.quantity || 0}
              style={{ width: '100%' }} 
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="领取原因"
            rules={[{ required: true, message: '请输入领取原因' }]}
          >
            <TextArea placeholder="请输入领取原因" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherMaterialPage;
