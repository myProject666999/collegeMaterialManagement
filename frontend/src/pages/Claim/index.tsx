import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, DatePicker, Tag } from 'antd';
import { SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getClaims, updateClaimStatus } from '../../services/api';
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

const ClaimPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [rejectForm] = Form.useForm();

  const fetchClaims = async (params?: { teacher_name?: string; material_name?: string; status?: number; start_date?: string; end_date?: string }) => {
    setLoading(true);
    try {
      const result = await getClaims({
        page: currentPage,
        pageSize,
        ...params,
      });
      setClaims(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [currentPage, pageSize]);

  const handleApprove = async (id: number) => {
    try {
      await updateClaimStatus(id, 1);
      message.success('审核通过');
      fetchClaims();
    } catch (error) {
      console.error('Failed to approve claim:', error);
    }
  };

  const handleReject = (record: Claim) => {
    setSelectedClaim(record);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (selectedClaim) {
        await updateClaimStatus(selectedClaim.id, 2, values.reject_reason);
        message.success('已拒绝');
        setRejectModalVisible(false);
        fetchClaims();
      }
    } catch (error) {
      console.error('Failed to reject claim:', error);
    }
  };

  const handleSearch = (values: any) => {
    setCurrentPage(1);
    const params: any = {
      teacher_name: values.teacher_name,
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
      title: '教师姓名',
      dataIndex: ['teacher', 'name'],
      key: 'teacher_name',
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
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Claim) => (
        <Space>
          {record.status === 0 && (
            <>
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button 
                danger 
                size="small" 
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>领取记录</h2>
      </div>

      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        className="search-form"
      >
        <Form.Item name="teacher_name" label="教师姓名">
          <Input placeholder="请输入教师姓名" prefix={<SearchOutlined />} />
        </Form.Item>
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
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
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

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reject_reason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <Input.TextArea placeholder="请输入拒绝原因" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClaimPage;
