import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getInventoryInList, createInventoryIn, getMaterials } from '../../services/api';
import { InventoryIn, Material } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const InventoryInPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryIns, setInventoryIns] = useState<InventoryIn[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchMaterials = async () => {
    try {
      const result = await getMaterials({ page: 1, pageSize: 1000, status: 1 });
      setMaterials(result.data.list);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchInventoryIns = async (params?: { material_name?: string; supplier?: string; start_date?: string; end_date?: string }) => {
    setLoading(true);
    try {
      const result = await getInventoryInList({
        page: currentPage,
        pageSize,
        ...params,
      });
      setInventoryIns(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch inventory in list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchInventoryIns();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createInventoryIn({
        material_id: values.material_id,
        quantity: values.quantity,
        unit_price: values.unit_price,
        supplier: values.supplier,
        batch_no: values.batch_no,
        remark: values.remark,
      });
      message.success('入库成功');
      setModalVisible(false);
      fetchInventoryIns();
    } catch (error) {
      console.error('Failed to create inventory in:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    const params: any = {
      material_name: values.material_name,
      supplier: values.supplier,
    };
    if (values.date_range && values.date_range.length === 2) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD');
      params.end_date = values.date_range[1].format('YYYY-MM-DD');
    }
    fetchInventoryIns(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchInventoryIns();
  };

  const columns: ColumnsType<InventoryIn> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '物资名称',
      dataIndex: ['material', 'name'],
      key: 'material_name',
    },
    {
      title: '物资编码',
      dataIndex: ['material', 'code'],
      key: 'material_code',
    },
    {
      title: '入库数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => `¥${price?.toFixed(2) || 0}`,
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price: number) => `¥${price?.toFixed(2) || 0}`,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '批次号',
      dataIndex: 'batch_no',
      key: 'batch_no',
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'username'],
      key: 'operator',
    },
    {
      title: '入库时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>入库管理</h2>
      </div>

      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        className="search-form"
      >
        <Form.Item name="material_name" label="物资名称">
          <Input placeholder="请输入物资名称" prefix={<SearchOutlined />} />
        </Form.Item>
        <Form.Item name="supplier" label="供应商">
          <Input placeholder="请输入供应商" prefix={<SearchOutlined />} />
        </Form.Item>
        <Form.Item name="date_range" label="入库时间">
          <RangePicker />
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
          新增入库
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={inventoryIns}
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
        title="新增入库"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="material_id"
            label="物资"
            rules={[{ required: true, message: '请选择物资' }]}
          >
            <Select placeholder="请选择物资" showSearch optionFilterProp="children">
              {materials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name} ({material.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="入库数量"
            rules={[
              { required: true, message: '请输入入库数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
            ]}
          >
            <Input.Number placeholder="请输入入库数量" style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item
            name="unit_price"
            label="单价"
            rules={[
              { required: true, message: '请输入单价' },
              { type: 'number', min: 0, message: '单价不能为负数' },
            ]}
          >
            <Input.Number placeholder="请输入单价" style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item
            name="supplier"
            label="供应商"
            rules={[{ required: true, message: '请输入供应商' }]}
          >
            <Input placeholder="请输入供应商" />
          </Form.Item>
          <Form.Item
            name="batch_no"
            label="批次号"
          >
            <Input placeholder="请输入批次号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryInPage;
