import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, DatePicker, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getInventoryOutList, createInventoryOut, getMaterials } from '../../services/api';
import { InventoryOut, Material } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const InventoryOutPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryOuts, setInventoryOuts] = useState<InventoryOut[]>([]);
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

  const fetchInventoryOuts = async (params?: { material_name?: string; start_date?: string; end_date?: string }) => {
    setLoading(true);
    try {
      const result = await getInventoryOutList({
        page: currentPage,
        pageSize,
        ...params,
      });
      setInventoryOuts(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch inventory out list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchInventoryOuts();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createInventoryOut({
        material_id: values.material_id,
        quantity: values.quantity,
        remark: values.remark,
      });
      message.success('出库成功');
      setModalVisible(false);
      fetchInventoryOuts();
    } catch (error) {
      console.error('Failed to create inventory out:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    const params: any = {
      material_name: values.material_name,
    };
    if (values.date_range && values.date_range.length === 2) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD');
      params.end_date = values.date_range[1].format('YYYY-MM-DD');
    }
    fetchInventoryOuts(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchInventoryOuts();
  };

  const columns: ColumnsType<InventoryOut> = [
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
      title: '出库数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'username'],
      key: 'operator',
    },
    {
      title: '出库时间',
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
        <h2>出库管理</h2>
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
        <Form.Item name="date_range" label="出库时间">
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
          新增出库
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={inventoryOuts}
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
        title="新增出库"
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
                  {material.name} ({material.code}) - 库存: {material.stocks?.[0]?.quantity || 0}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="出库数量"
            rules={[
              { required: true, message: '请输入出库数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
            ]}
          >
            <Input.Number placeholder="请输入出库数量" style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryOutPage;
