import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message, Spin } from 'antd';
import { 
  InboxOutlined, 
  OutboxOutlined, 
  ShoppingCartOutlined, 
  TeamOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { getStocks, getMaterialTypeStatistics } from '../../services/api';
import { Stock } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<Stock[]>([]);
  const [typeStats, setTypeStats] = useState<any[]>([]);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const result = await getStocks({ page: 1, pageSize: 10 });
      const lowStock = result.data.list.filter((s: Stock) => 
        s.quantity <= s.min_stock
      );
      setLowStockItems(lowStock.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeStats = async () => {
    try {
      const result = await getMaterialTypeStatistics();
      setTypeStats(result.data);
    } catch (error) {
      console.error('Failed to fetch type stats:', error);
    }
  };

  useEffect(() => {
    fetchLowStock();
    fetchTypeStats();
  }, []);

  const lowStockColumns: ColumnsType<Stock> = [
    {
      title: '物资名称',
      dataIndex: ['material', 'name'],
      key: 'name',
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (q: number) => <span style={{ color: 'red' }}>{q}</span>,
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>系统概览</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="入库记录"
              value={128}
              prefix={<InboxOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="出库记录"
              value={85}
              prefix={<OutboxOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="物资种类"
              value={typeStats.length || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审批申请"
              value={3}
              prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <WarningOutlined style={{ color: 'red', marginRight: 8 }} />
                库存预警
              </span>
            }
          >
            {lowStockItems.length > 0 ? (
              <Table
                columns={lowStockColumns}
                dataSource={lowStockItems}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无库存预警
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="物资类型分布">
            <Row gutter={16}>
              {typeStats.map((item, index) => (
                <Col span={8} key={index}>
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Statistic
                      title={item.name || '未分类'}
                      value={item.count || 0}
                      suffix="种"
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
