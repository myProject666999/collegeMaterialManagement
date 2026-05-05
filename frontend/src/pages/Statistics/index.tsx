import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Spin, message } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  getInventoryInStatistics,
  getInventoryOutStatistics,
  getMaterialTypeStatistics,
} from '../../services/api';
import {
  InventoryInStatistics as InventoryInStats,
  InventoryOutStatistics as InventoryOutStats,
  MaterialTypeStatistics,
} from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [inventoryInStats, setInventoryInStats] = useState<InventoryInStats | null>(null);
  const [inventoryOutStats, setInventoryOutStats] = useState<InventoryOutStats | null>(null);
  const [materialTypeStats, setMaterialTypeStats] = useState<MaterialTypeStatistics[]>([]);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const [inResult, outResult, typeResult] = await Promise.all([
        getInventoryInStatistics(params),
        getInventoryOutStatistics(params),
        getMaterialTypeStatistics(),
      ]);

      setInventoryInStats(inResult.data);
      setInventoryOutStats(outResult.data);
      setMaterialTypeStats(typeResult.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStatistics();
  }, [dateRange]);

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
  };

  const pieData = materialTypeStats.map((item, index) => ({
    name: item.type_name,
    value: item.quantity,
  }));

  return (
    <div>
      <div className="page-header">
        <h2>统计查询</h2>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={{ marginRight: 16 }}>时间范围：</span>
        <RangePicker onChange={handleDateChange} allowClear />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-value">
                  {inventoryInStats?.total_quantity || 0}
                </div>
                <div className="stat-label">入库总数量</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-value">
                  ¥{(inventoryInStats?.total_amount?.toFixed(2) || 0}
                </div>
                <div className="stat-label">入库总金额</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-value">
                  {inventoryOutStats?.total_quantity || 0}
                </div>
                <div className="stat-label">出库总数量</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="stat-card">
                <div className="stat-value">
                  {materialTypeStats.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className="stat-label">物资种类数</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="入库统计（按物资）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryInStats?.by_material || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="material_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" name="数量" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="入库统计（按金额）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryInStats?.by_material || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="material_name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value}`} />
                    <Legend />
                    <Bar dataKey="amount" name="金额" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="出库统计（按物资）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryOutStats?.by_material || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="material_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" name="数量" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="物资类型分布（饼图）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="入库趋势（按月）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryInStats?.by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" name="数量" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="出库趋势（按月）">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryOutStats?.by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" name="数量" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default StatisticsPage;
