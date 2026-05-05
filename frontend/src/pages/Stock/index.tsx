import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Input, Select, message, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getStocks } from '../../services/api';
import { Stock } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const StockPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();

  const fetchStocks = async (params?: { material_name?: string }) => {
    setLoading(true);
    try {
      const result = await getStocks({
        page: currentPage,
        pageSize,
        ...params,
      });
      setStocks(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [currentPage, pageSize]);

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    fetchStocks({
      material_name: values.material_name,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchStocks();
  };

  const columns: ColumnsType<Stock> = [
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
      title: '物资类型',
      dataIndex: ['material', 'type', 'name'],
      key: 'material_type',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <span style={{ color: quantity > 0 ? 'green' : 'red' }}>
          {quantity}
        </span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
    },
    {
      title: '最高库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
    },
    {
      title: '库存位置',
      dataIndex: 'location',
      key: 'location',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>物资库存信息</h2>
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
        dataSource={stocks}
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
  );
};

export default StockPage;
