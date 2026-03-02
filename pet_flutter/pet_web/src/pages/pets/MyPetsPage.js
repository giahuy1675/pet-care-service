import React, { useState, useEffect } from 'react';
import { 
  Typography, Row, Col, Card, Button, Spin, Empty, 
  Divider, Space, Tag, Statistic, Alert, Badge,
  Avatar, Tooltip, Input, Tabs, Carousel, Progress
} from 'antd';
import {
  PlusOutlined, HeartOutlined, SettingOutlined,
  CalendarOutlined, TeamOutlined, MedicineBoxOutlined,
  PieChartOutlined, BulbOutlined, RocketOutlined,
  ShopOutlined, GiftOutlined, WarningOutlined,
  BellOutlined, ThunderboltOutlined, StarOutlined,
  FireOutlined, ReloadOutlined, LoadingOutlined,
  CheckCircleOutlined, SearchOutlined, FilterOutlined,
  PlusCircleOutlined, ArrowRightOutlined, ClockCircleOutlined,
  DashboardOutlined, SafetyOutlined, GoldOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import PetList from '../../components/pets/PetList';
import petService from '../../services/petService';
import useAuth from '../../hooks/useAuth';
import appointmentService from '../../services/appointmentService';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideRight = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 32px auto 64px;
  padding: 0 24px;
  animation: ${fadeInUp} 0.6s ease-out;
`;

const DashboardHeader = styled.div`
  position: relative;
  padding: 40px;
  border-radius: 24px;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
  margin-bottom: 40px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(24, 144, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -50px;
    left: -50px;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(82, 196, 26, 0.06) 0%, rgba(0, 0, 0, 0) 70%);
    border-radius: 50%;
  }
`;

const GlassmorphicCard = styled(Card)`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
  }
  
  .ant-card-body {
    padding: 24px;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StyledAvatar = styled(Avatar)`
  width: 96px;
  height: 96px;
  border-radius: 24px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  box-shadow: 0 12px 24px rgba(24, 144, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
  }
  
  .anticon {
    font-size: 48px;
    color: white;
    z-index: 1;
  }
  
  @media (max-width: 576px) {
    width: 80px;
    height: 80px;
    .anticon {
      font-size: 40px;
    }
  }
`;

const CreatePetButton = styled(Button)`
  height: 52px;
  padding: 0 28px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(90deg, #1890ff, #096dd9);
  border: none;
  box-shadow: 0 10px 20px rgba(24, 144, 255, 0.25);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px rgba(24, 144, 255, 0.35);
    background: linear-gradient(90deg, #40a9ff, #1890ff);
    
    &::before {
      left: 100%;
    }
  }
  
  .anticon {
    font-size: 18px;
    margin-right: 8px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  
  .loading-icon {
    font-size: 64px;
    color: #1890ff;
    margin-bottom: 24px;
    display: inline-block;
    animation: ${rotate} 2s linear infinite;
  }
`;

const EmptyContainer = styled(Card)`
  text-align: center;
  padding: 60px 24px;
  border-radius: 24px;
  background: linear-gradient(to bottom, #f9f9ff, #ffffff);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.05);
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    transform: translateY(-5px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(24, 144, 255, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(82, 196, 26, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
    border-radius: 50%;
  }
`;

const EmptyIconWrapper = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background: rgba(24, 144, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  position: relative;
  animation: ${pulse} 2s infinite;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 3px dashed rgba(24, 144, 255, 0.3);
    animation: ${rotate} 15s linear infinite;
  }
  
  .empty-icon {
    font-size: 64px;
    color: #1890ff;
    animation: ${float} 3s ease-in-out infinite;
  }
`;

const GradientTitle = styled(Title)`
  background: linear-gradient(90deg, #1890ff, #096dd9);
  background-size: 200% 200%;
  animation: ${gradientMove} 4s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px !important;
  position: relative;
  display: inline-block;
  font-weight: 700 !important;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    width: 60px;
    background: linear-gradient(90deg, #1890ff, #096dd9);
    border-radius: 4px;
  }
`;

const FloatingTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  margin-top: 16px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 30px;
  background: linear-gradient(90deg, #1890ff, #096dd9);
  background-size: 200% 200%;
  animation: ${shimmer} 3s linear infinite;
  border: none;
  color: white;
  box-shadow: 0 8px 16px rgba(9, 109, 217, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 20px rgba(9, 109, 217, 0.3);
  }
  
  .anticon {
    margin-right: 8px;
    font-size: 16px;
  }
`;


const SuccessAlert = styled(Alert)`
  margin-bottom: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(82, 196, 26, 0.15);
  border: none;
  
  .ant-alert-message {
    font-weight: 600;
    font-size: 16px;
  }
  
  .ant-alert-icon {
    color: #52c41a;
    font-size: 20px;
  }
`;

const StyledSearch = styled(Search)`
  width: 100%;
  
  .ant-input-wrapper {
    display: flex;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    border: 1px solid #e8e8e8;
    transition: all 0.3s ease;
  }

  .ant-input {
    height: 48px;
    border-radius: 0;
    border: none;
    border-right: 1px solid #e8e8e8;
    font-size: 15px;
    padding-left: 16px;
    flex: 1;
  }
  
  .ant-input-search-button {
    height: 48px;
    border-radius: 0;
    border: none;
    width: 60px;
    flex-shrink: 0;
  }
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
  }
`;

const FilterCard = styled(Card)`
  margin-bottom: 32px; 
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  border: none;
  
  .ant-card-body {
    padding: 24px;
  }
`;

const EmptyResultsContainer = styled(Empty)`
  margin: 48px 0;
  padding: 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  
  .ant-empty-image {
    height: 160px;
  }
  
  .ant-empty-description {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.65);
    margin-bottom: 24px;
  }
`;

const ResetButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  font-weight: 500;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.15);
  
  .anticon {
    font-size: 16px;
    margin-right: 8px;
  }
`;

const StyledBadge = styled(Badge)`
  .ant-badge-count {
    font-weight: 600;
    font-size: 12px;
    padding: 0 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }
`;

const FeatureCard = styled(Card)`
  border-radius: 20px;
  height: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border: none;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
    
    .feature-avatar {
      transform: scale(1.1);
    }
  }
  
  .ant-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .feature-avatar {
    width: 72px;
    height: 72px;
    border-radius: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    
    .anticon {
      font-size: 32px;
    }
  }
  
  .feature-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .feature-description {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    line-height: 1.6;
  }
`;

// Main Component
const MyPetsPage = () => {
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({
    totalVisits: 0,
    upcomingAppointments: 0,
    reminders: 0
  });
  
  // Thêm states mới cho tìm kiếm và lọc
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      
      // Tự động xóa thông báo sau 5 giây
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const data = await petService.getUserPets();
        
        // Kiểm tra và xử lý dữ liệu nhận được
        if (Array.isArray(data)) {
          setPets(data);
          
          // Tải dữ liệu thống kê từ API thực tế
          if (data.length > 0) {
            fetchPetStatistics();
          }
          
          setError(null);
        } else {
          throw new Error("Dữ liệu không hợp lệ");
        }
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError(typeof err === 'string' ? err : 'Không thể tải danh sách thú cưng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPets();
    }
  }, [user]);

  // Thêm hàm lấy thống kê thực từ API
  const fetchPetStatistics = async () => {
    try {
      // Lấy tất cả lịch hẹn của người dùng
      const appointments = await appointmentService.getUserAppointments();
      
      // Đếm tổng số lần khám bệnh (lịch hẹn đã hoàn thành)
      const completedAppointments = appointments.filter(app => app.status === 'Completed');
      
      // Đếm lịch hẹn sắp tới (chưa diễn ra và đã xác nhận hoặc đã lên lịch)
      const now = new Date();
      const upcomingAppointments = appointments.filter(app => {
        const appointmentDate = new Date(app.appointmentDate);
        return appointmentDate > now && (app.status === 'Scheduled' || app.status === 'Confirmed');
      });
      
      // Các nhắc nhở - có thể là các lịch hẹn sắp tới trong 3 ngày
      const threeDaysLater = new Date();
      threeDaysLater.setDate(now.getDate() + 3);
      
      const urgentAppointments = upcomingAppointments.filter(app => {
        const appointmentDate = new Date(app.appointmentDate);
        return appointmentDate <= threeDaysLater;
      });
      
      setStatsData({
        totalVisits: completedAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        reminders: urgentAppointments.length
      });
      
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Nếu có lỗi, không cập nhật statsData để giữ giá trị mặc định
    }
  };

  const handleDeletePet = async (petId) => {
    try {
      await petService.deletePet(petId);
      
      // Cập nhật state UI ngay lập tức sau khi xóa thành công
      setPets(prevPets => prevPets.filter(pet => pet.petId !== petId));
      
      // Hiển thị thông báo thành công
      setSuccessMessage('Đã xóa thú cưng thành công');
      
      // Tự động xóa thông báo sau 5 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(typeof err === 'string' ? err : 'Không thể xóa thú cưng. Vui lòng thử lại sau.');
      
      // Tự động xóa thông báo lỗi sau 5 giây
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Tính toán thống kê thú cưng
  const petStats = {
    total: pets.length,
    dogs: pets.filter(pet => pet.species === 'Chó').length,
    cats: pets.filter(pet => pet.species === 'Mèo').length
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <StyledBadge count={petStats.total} offset={[5, 0]}>
          <span>Tất cả thú cưng</span>
        </StyledBadge>
      ),
    },
    {
      key: 'dogs',
      label: (
        <StyledBadge count={petStats.dogs} offset={[5, 0]}>
          <span>Chó cưng</span>
        </StyledBadge>
      ),
    },
    {
      key: 'cats',
      label: (
        <StyledBadge count={petStats.cats} offset={[5, 0]}>
          <span>Mèo cưng</span>
        </StyledBadge>
      ),
    },
  ];

  // Lọc thú cưng dựa trên tab
  const filteredPets = pets.filter(pet => {
    // Lọc theo tab
    return activeTab === 'all' || 
      (activeTab === 'dogs' && pet.species === 'Chó') || 
      (activeTab === 'cats' && pet.species === 'Mèo');
  });

  const renderStats = () => {
    if (pets.length === 0) return null;
    
    return (
      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Thú cưng" value={petStats.total} suffix="bạn nuôi" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Lần khám bệnh" value={statsData.totalVisits} suffix="lần" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Lịch sắp tới" value={statsData.upcomingAppointments} suffix="cuộc hẹn" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title="Nhắc nhở" value={statsData.reminders} suffix="sự kiện" />
        </Col>
      </Row>
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyContainer bordered={false}>
        <EmptyIconWrapper>
          <HeartOutlined className="empty-icon" />
        </EmptyIconWrapper>
        
        <Title level={2} style={{ fontWeight: 700, marginBottom: 16 }}>
          Bạn chưa có thú cưng nào
        </Title>
        
        <Paragraph style={{ 
          fontSize: 17,
          color: 'rgba(0, 0, 0, 0.65)',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.8
        }}>
          Thêm thú cưng của bạn để dễ dàng quản lý lịch sử khám chữa bệnh, lịch tiêm chủng và nhận các lời khuyên chăm sóc phù hợp cho bé cưng của bạn.
        </Paragraph>
        
        <Space size="large" direction="vertical" style={{ width: '100%' }}>
          <CreatePetButton 
            type="primary" 
            icon={<PlusCircleOutlined />} 
            size="large"
          >
            <Link to="/pets/add" style={{ color: 'white' }}>
              Thêm thú cưng đầu tiên
            </Link>
          </CreatePetButton>
          
          <Divider plain>
            <Text type="secondary" style={{ fontSize: 15, fontWeight: 500 }}>Các lợi ích khi thêm thú cưng</Text>
          </Divider>
        </Space>
        
        <Row gutter={[24, 24]} style={{ marginTop: 40, maxWidth: 900, margin: '40px auto 0' }}>
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>
                <MedicineBoxOutlined />
              </div>
              <div className="feature-title">
                Hồ sơ y tế
              </div>
              <div className="feature-description">
                Lưu trữ lịch sử khám chữa bệnh, tiêm phòng và các chỉ số sức khỏe của thú cưng
              </div>
            </FeatureCard>
          </Col>
          
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }}>
                <BellOutlined />
              </div>
              <div className="feature-title">
                Nhắc nhở thông minh
              </div>
              <div className="feature-description">
                Nhận thông báo tự động về lịch tiêm chủng, tẩy giun và các sự kiện quan trọng
              </div>
            </FeatureCard>
          </Col>
          
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(250, 173, 20, 0.1)', color: '#faad14' }}>
                <ShopOutlined />
              </div>
              <div className="feature-title">
                Đặt dịch vụ dễ dàng
              </div>
              <div className="feature-description">
                Đặt lịch các dịch vụ chăm sóc thú cưng nhanh chóng với thông tin có sẵn
              </div>
            </FeatureCard>
          </Col>
          
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(235, 47, 150, 0.1)', color: '#eb2f96' }}>
                <DashboardOutlined />
              </div>
              <div className="feature-title">
                Theo dõi phát triển
              </div>
              <div className="feature-description">
                Theo dõi sự phát triển của thú cưng theo thời gian với biểu đồ trực quan
              </div>
            </FeatureCard>
          </Col>
          
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' }}>
                <SafetyOutlined />
              </div>
              <div className="feature-title">
                Chăm sóc toàn diện
              </div>
              <div className="feature-description">
                Nhận tư vấn dinh dưỡng và hướng dẫn chăm sóc phù hợp cho từng loại thú cưng
              </div>
            </FeatureCard>
          </Col>
          
          <Col xs={24} md={8}>
            <FeatureCard hoverable>
              <div className="feature-avatar" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: '#000000' }}>
                <GoldOutlined />
              </div>
              <div className="feature-title">
                Ưu đãi độc quyền
              </div>
              <div className="feature-description">
                Tiếp cận các ưu đãi và khuyến mãi độc quyền dành cho chủ nuôi đăng ký thú cưng
              </div>
            </FeatureCard>
          </Col>
        </Row>
      </EmptyContainer>
    );
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <div className="loading-icon">
            <LoadingOutlined />
          </div>
          <Title level={3} style={{ margin: '0 0 12px', fontWeight: 600 }}>
            Đang tải danh sách thú cưng...
          </Title>
          <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)', maxWidth: 500, fontSize: 16 }}>
            Vui lòng đợi trong giây lát để hệ thống tải thông tin thú cưng của bạn.
          </Paragraph>
          <Progress 
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
            percent={75} 
            status="active" 
            style={{ width: 300, marginTop: 24 }} 
          />
        </LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {successMessage && (
        <SuccessAlert
          message={successMessage}
          type="success"
          showIcon
          closable
          icon={<CheckCircleOutlined />}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      <DashboardHeader>
        <HeaderTop>
          <HeaderContent>
            <StyledAvatar icon={<HeartOutlined />} />
            <div>
              <GradientTitle level={2}>
                Thú cưng của tôi
              </GradientTitle>
              <Text style={{ fontSize: 17, color: 'rgba(0, 0, 0, 0.65)', display: 'block', marginBottom: 4 }}>
                Quản lý danh sách thú cưng và thông tin chi tiết của bé cưng
              </Text>
              
              <div>
                <FloatingTag>
                  <FireOutlined />
                  Thú cưng yêu thích
                </FloatingTag>
                <FloatingTag color="#ff7a45" style={{ marginLeft: 12, background: 'linear-gradient(90deg, #ff7a45, #fa541c)' }}>
                  <StarOutlined />
                  Dịch vụ hot
                </FloatingTag>
                <FloatingTag color="#722ed1" style={{ marginLeft: 12, background: 'linear-gradient(90deg, #722ed1, #531dab)' }}>
                  <ThunderboltOutlined />
                  Tư vấn 24/7
                </FloatingTag>
              </div>
            </div>
          </HeaderContent>
          
          {pets.length > 0 && (
            <CreatePetButton 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
            >
              <Link to="/pets/add" style={{ color: 'white' }}>
                Thêm thú cưng
              </Link>
            </CreatePetButton>
          )}
        </HeaderTop>
        
        {renderStats()}
      </DashboardHeader>
      
      <ContentWrapper>
        {error ? (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Đã có lỗi xảy ra"
            description={error}
            action={
              <Button 
                onClick={() => window.location.reload()} 
                icon={<ReloadOutlined />}
                type="primary"
                danger
              >
                Thử lại
              </Button>
            }
            style={{ 
              borderRadius: 16,
              boxShadow: '0 8px 20px rgba(255, 77, 79, 0.15)',
              marginBottom: 32,
              padding: '16px 24px'
            }}
          />
        ) : null}
        
        {pets.length === 0 ? renderEmptyState() : (
          <>
            {/* Thêm thanh lọc */}
            <FilterCard>
              <StyledTabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={tabItems}
              />
            </FilterCard>
            
            {/* Hiển thị danh sách thú cưng đã lọc */}
            <PetList
              pets={filteredPets}
              error={error}
              onDelete={handleDeletePet}
            />
            
            {/* Hiển thị thông báo khi không tìm thấy kết quả */}
            {filteredPets.length === 0 && (
              <EmptyResultsContainer
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ fontSize: 16 }}>
                    Không tìm thấy thú cưng nào phù hợp với bộ lọc hiện tại.
                  </Text>
                }
              >
                <ResetButton 
                  type="primary" 
                  onClick={() => {
                    setSearchText('');
                    setActiveTab('all');
                  }}
                  icon={<ReloadOutlined />}
                >
                  Xóa bộ lọc
                </ResetButton>
              </EmptyResultsContainer>
            )}
          </>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default MyPetsPage;