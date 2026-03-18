import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Column, DualAxes, Pie } from '@ant-design/plots';
import axiosClient from '../../utils/axiosClient';
import {
  SyncOutlined
} from '@ant-design/icons';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DashboardContainer = styled.div`
  padding: 30px;
  background: #f7faff;
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  margin-bottom: 30px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #2B3674;
    margin: 0 0 10px 0;
  }

  p {
    color: #707EAE;
    margin: 0;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;

  label {
    font-weight: 600;
    color: #2B3674;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;

    &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.green { background: linear-gradient(135deg, #05CD99 0%, #00A871 100%); }
    &.orange { background: linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%); }
    &.purple { background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); }
  }

  .content {
    flex: 1;

    .label {
      font-size: 13px;
      color: #707EAE;
      margin-bottom: 5px;
    }

    .value {
      font-size: 24px;
      font-weight: 700;
      color: #2B3674;
    }

    .change {
      font-size: 12px;
      margin-top: 5px;
      display: flex;
      align-items: center;
      gap: 5px;

      &.positive { color: #05CD99; }
      &.negative { color: #FF5252; }
    }
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 30px;
  margin-bottom: 30px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2B3674;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #707EAE;

  .anticon {
    font-size: 40px;
    margin-bottom: 15px;
    color: #304FFE;
  }
`;

const TableCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2B3674;
    margin: 0 0 20px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }

    th {
      background: #f7faff;
      font-weight: 600;
      color: #2B3674;
      font-size: 13px;
    }

    td {
      font-size: 14px;
      color: #707EAE;
    }

    tr:hover {
      background: #f7faff;
    }
  }
`;

const DashboardStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [popularServices, setPopularServices] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [hourlyStats, setHourlyStats] = useState(null);
  const [topCustomers, setTopCustomers] = useState(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };

      const [overviewRes, revenueRes, servicesRes, staffRes, comparisonRes, hourlyRes, customersRes] = await Promise.all([
        axiosClient.get('/Statistics/appointments/overview', { params }),
        axiosClient.get('/Statistics/appointments/revenue', { params }),
        axiosClient.get('/Statistics/services/popular', { params: { ...params, top: 5 } }),
        axiosClient.get('/Statistics/staff/performance', { params }),
        axiosClient.get('/Statistics/comparison', { params }),
        axiosClient.get('/Statistics/appointments/by-hour', { params }),
        axiosClient.get('/Statistics/customers/top', { params: { ...params, top: 10 } })
      ]);

      setOverview(overviewRes.data);
      setRevenue(revenueRes.data);
      setPopularServices(servicesRes.data);
      setStaffPerformance(staffRes.data);
      setComparison(comparisonRes.data);
      setHourlyStats(hourlyRes.data);
      setTopCustomers(customersRes.data);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingOverlay>
          <SyncOutlined spin />
          <p>Đang tải thống kê...</p>
        </LoadingOverlay>
      </DashboardContainer>
    );
  }

  // Prepare data for charts
  const statusData = overview?.statusCounts?.map(item => ({
    name: item.status,
    value: item.count
  })) || [];

  const statusPieConfig = {
    data: statusData,
    angleField: 'value',
    colorField: 'name',
    legend: false,
    innerRadius: 0.6,
    label: false,
    style: {
      stroke: '#fff',
      inset: 1,
      radius: 10,
    },
    scale: {
      color: {
        palette: 'spectral',
        offset: (t) => t * 0.8 + 0.1,
      },
    },
  };

  const revenueByDateData = revenue?.revenueByDate?.map(item => ({
    date: dayjs(item.date).format('DD/MM'),
    revenue: item.revenue,
    count: item.count
  })) || [];

  const servicesData = popularServices?.topServices?.map(item => ({
    name: item.serviceName,
    bookings: item.totalBookings,
    revenue: item.revenue
  })) || [];

  const staffData = staffPerformance?.staffPerformance?.slice(0, 10).map(item => ({
    name: item.staffName,
    completed: item.completedAppointments,
    cancelled: item.cancelledAppointments
  })) || [];

  const topServicesColumnConfig = {
    data: servicesData,
    xField: 'name',
    yField: 'bookings',
    label: false,
    axis: {
      x: {
        labelAutoRotate: false,
        labelFormatter: (text) => (text.length > 16 ? `${text.slice(0, 16)}...` : text),
      },
      y: {
        title: 'Số lượt đặt',
      },
    },
    style: {
      radiusTopLeft: 10,
      radiusTopRight: 10,
      fill: '#304FFE',
      maxWidth: 56,
    },
    tooltip: {
      items: [
        (d) => ({
          name: 'Số lượt đặt',
          value: `${d.bookings} lượt`,
        }),
      ],
    },
    interaction: {
      elementHighlight: { background: true },
    },
  };

  const hourlyBarData = (hourlyStats?.hourlyStats || []).flatMap((item) => [
    { time: item.timeSlot, value: item.count || 0, type: 'Tổng lịch hẹn' },
    { time: item.timeSlot, value: item.cancelledCount || 0, type: 'Đã hủy' },
  ]);

  const hourlyLineData = (hourlyStats?.hourlyStats || []).map((item) => ({
    time: item.timeSlot,
    count: item.completedCount || 0,
  }));

  const hourlyDualAxesConfig = {
    xField: 'time',
    legend: true,
    children: [
      {
        data: hourlyBarData,
        type: 'interval',
        yField: 'value',
        stack: true,
        colorField: 'type',
        style: { maxWidth: 56 },
        scale: { y: { domainMin: 0, key: 'hourly-axis', independent: false } },
        interaction: { elementHighlight: { background: true } },
      },
      {
        data: hourlyLineData,
        type: 'line',
        yField: 'count',
        style: { lineWidth: 3, stroke: '#FE911E' },
        scale: { y: { domainMin: 0, key: 'hourly-axis', independent: false } },
      },
    ],
    axis: {
      x: { labelAutoRotate: false },
      y: { grid: true },
    },
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h1>Thống kê & Báo cáo</h1>
        <p>Tổng quan về hoạt động kinh doanh và dịch vụ</p>
      </DashboardHeader>

      <FilterSection>
        <label>Khoảng thời gian:</label>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          format="DD/MM/YYYY"
          style={{ width: 300 }}
        />
      </FilterSection>

      {/* Stats Cards */}
      <StatsGrid>
        <StatCard>
          <div className="content">
            <div className="label">Tổng lịch hẹn</div>
            <div className="value">{overview?.totalAppointments || 0}</div>
            <div className={`change ${comparison?.change?.totalAppointmentsPercent >= 0 ? 'positive' : 'negative'}`}>
              {comparison?.change?.totalAppointmentsPercent >= 0 ? '↑' : '↓'} {Math.abs(comparison?.change?.totalAppointmentsPercent || 0)}% so với kỳ trước
            </div>
          </div>
        </StatCard>

        <StatCard>
          <div className="content">
            <div className="label">Tổng doanh thu</div>
            <div className="value">{(revenue?.totalRevenue || 0).toLocaleString('vi-VN')}₫</div>
            <div className={`change ${comparison?.change?.revenuePercent >= 0 ? 'positive' : 'negative'}`}>
              {comparison?.change?.revenuePercent >= 0 ? '↑' : '↓'} {Math.abs(comparison?.change?.revenuePercent || 0)}% so với kỳ trước
            </div>
          </div>
        </StatCard>

        <StatCard>
          <div className="content">
            <div className="label">Đã hoàn thành</div>
            <div className="value">{overview?.statusBreakdown?.completed || 0}</div>
            <div className={`change ${comparison?.change?.completedAppointmentsPercent >= 0 ? 'positive' : 'negative'}`}>
              {comparison?.change?.completedAppointmentsPercent >= 0 ? '↑' : '↓'} {Math.abs(comparison?.change?.completedAppointmentsPercent || 0)}% so với kỳ trước
            </div>
          </div>
        </StatCard>

        <StatCard>
          <div className="content">
            <div className="label">Đã hủy</div>
            <div className="value">{overview?.statusBreakdown?.cancelled || 0}</div>
            <div className="change negative">
              Tỷ lệ: {overview?.rates?.cancellationRate}%
            </div>
          </div>
        </StatCard>
      </StatsGrid>

      {/* Charts */}
      <ChartGrid>
        {/* Doanh thu theo ngày */}
        <ChartCard>
          <h3>Doanh thu theo ngày</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByDateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                labelFormatter={(label) => `Ngày: ${label}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#304FFE"
                strokeWidth={3}
                name="Doanh thu"
                dot={{ fill: '#304FFE', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Trạng thái lịch hẹn */}
        <ChartCard>
          <h3>Phân bố trạng thái lịch hẹn</h3>
          <Pie {...statusPieConfig} height={300} />
        </ChartCard>

        {/* Top dịch vụ */}
        <ChartCard>
          <h3>Top 5 dịch vụ phổ biến</h3>
          <Column {...topServicesColumnConfig} height={300} />
        </ChartCard>

        {/* Hiệu suất nhân viên */}
        <ChartCard>
          <h3>Hiệu suất nhân viên (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                height={120}
                interval={0}
                style={{ fontSize: '11px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value, name) => [`${value} lịch hẹn`, name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar
                dataKey="completed"
                fill="#05CD99"
                name="Hoàn thành"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="cancelled"
                fill="#FF5252"
                name="Hủy"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartGrid>

      {/* Bảng chi tiết doanh thu */}
      <TableCard>
        <h3>Chi tiết doanh thu theo ngày</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số lịch hẹn</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {revenueByDateData.map((item, index) => (
              <tr key={index}>
                <td>{item.date}</td>
                <td>{item.count} lịch</td>
                <td style={{ fontWeight: 600, color: '#304FFE' }}>
                  {item.revenue.toLocaleString('vi-VN')}₫
                </td>
              </tr>
            ))}
            {revenueByDateData.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>

      {/* Thống kê theo khung giờ */}
      <ChartCard style={{ marginBottom: '30px' }}>
        <h3>Thống kê theo khung giờ</h3>
        <DualAxes {...hourlyDualAxesConfig} height={300} />
      </ChartCard>

      {/* Top khách hàng */}
      <TableCard>
        <h3>Top khách hàng thân thiết</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên khách hàng</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Tổng lịch hẹn</th>
              <th>Hoàn thành</th>
              <th>Tổng chi tiêu</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers?.topCustomers?.map((customer, index) => (
              <tr key={customer.userId}>
                <td style={{ fontWeight: 600 }}>#{index + 1}</td>
                <td style={{ fontWeight: 600, color: '#2B3674' }}>{customer.customerName}</td>
                <td>{customer.email || 'N/A'}</td>
                <td>{customer.phone || 'N/A'}</td>
                <td>{customer.totalAppointments}</td>
                <td style={{ color: '#05CD99' }}>{customer.completedAppointments}</td>
                <td style={{ fontWeight: 600, color: '#304FFE' }}>
                  {customer.totalSpent.toLocaleString('vi-VN')}₫
                </td>
              </tr>
            ))}
            {(!topCustomers?.topCustomers || topCustomers.topCustomers.length === 0) && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#999' }}>
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </DashboardContainer>
  );
};

export default DashboardStatistics;
