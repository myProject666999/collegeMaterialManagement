import React, { useState, useEffect } from 'react';
import { Table, Form, Input, Select, message, Space, DatePicker, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getTeacherClaims } from '../../services/api';
import { Claim } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const statusMap: { [key: number]: { text: string; color: string } } = {
  0: { text: '待审核', color: 'orange' },
  1: { text: '已通过', color: 'green' },
  2: { text: '已拒绝', color: 'red' },
};

const TeacherClaimPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();

  const fetchClaims = async (params?: { material_name?: string; status?: number; start_date?: string; end_date?: string }) => {
    setLoading(true);
    try {
      const result = await getTeacherClaims({
        page: currentPage,
        pageSize,
        ...params,
      });
      setClaims(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch my claims:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [currentPage, pageSize]);

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    const params: any = {
      material_name: values.material_name,
      status: values.status,
    };
    if (values.date_range && values.date_range.length === 2) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD');
      params.end_date = values.date_range[1].format('YYYY-MM-DD');
    }
    fetchClaims(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setCurrentPage(1);
    fetchClaims();
  };

  const columns: ColumnsType<Claim> = [
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
      title: '领取数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '领取原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      ),
    },
    {
      title: '拒绝原因',
      dataIndex: 'reject_reason',
      key: 'reject_reason',
      render: (reason: string) => reason || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>我的领取记录</h2>
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
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
            <Option value={0}>待审核</Option>
            <Option value={1}>已通过</Option>
            <Option value={2}>已拒绝</Option>
          </Select>
        </Form.Item>
        <Form.Item name="date_range" label="申请时间">
          <RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <button type="submit" className="ant-btn ant-btn-primary">
              <span className="anticon"><SearchOutlined /></span>
              <span>查询</span>
            </button>
            <button type="button" className="ant-btn" onClick={handleReset}>
              <span>重置</span>
            </button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={claims}
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

export default TeacherClaimPage;
