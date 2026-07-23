import CustomSpinner from '../components/common/CustomSpinner';
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ServicesPage.css';
import serviceService from '../services/serviceService';
import BorderBeam from '../components/common/BorderBeam';

import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Empty,
  Image,
  Input,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  AppstoreOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  ScissorOutlined,
  SearchOutlined,
  SunOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Helper function để hiển thị danh mục dịch vụ bằng tiếng Việt
const getCategoryLabel = (category) => {
  const categories = {
    Grooming: 'Chăm sóc & Làm đẹp',
    Healthcare: 'Y tế & Sức khỏe',
    Training: 'Huấn luyện',
    Boarding: 'Trông giữ qua đêm',
    DayCare: 'Trông giữ ban ngày',
    Other: 'Dịch vụ khác',
  };
  return categories[category] || category;
};

// Helper function để lấy màu cho Tag theo danh mục
const getCategoryColor = (category) => {
  const colors = {
    Grooming: '#2196F3', // blue
    Healthcare: '#4CAF50', // green
    Training: '#FF9800', // orange
    Boarding: '#673AB7', // deep purple
    DayCare: '#9C27B0', // purple
    Other: '#607D8B', // blueGrey
  };
  return colors[category] || '#2196F3';
};

// Helper function để lấy icon cho danh mục (Ant Design icons)
const getCategoryIcon = (category) => {
  const icons = {
    Grooming: <ScissorOutlined />,
    Healthcare: <HeartOutlined />,
    Training: <BookOutlined />,
    Boarding: <HomeOutlined />,
    DayCare: <SunOutlined />,
    Other: <AppstoreOutlined />,
  };
  return icons[category] || <AppstoreOutlined />;
};

// Format số phút thành chuỗi thời gian dễ đọc
const formatDuration = (minutes) => {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainingMinutes = minutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);

    if (hours > 0) {
      return `${days} ngày ${hours} giờ`;
    }
    return `${days} ngày`;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes > 0) {
      return `${hours} giờ ${remainingMinutes} phút`;
    }
    return `${hours} giờ`;
  }

  return `${minutes} phút`;
};

// Format giá tiền
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ServicesPage = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await serviceService.getActiveServices();
        setServices(data);
        setFilteredServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(
          typeof err === 'string' ? err : 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    // Lọc dịch vụ dựa trên từ khóa tìm kiếm và danh mục
    const normalizedSearch = (searchTerm || '').trim().toLowerCase();
    const filtered = services.filter((service) => {
      const name = (service?.name || '').toLowerCase();
      const desc = (service?.description || '').toLowerCase();
      const matchesSearch =
        !normalizedSearch || name.includes(normalizedSearch) || desc.includes(normalizedSearch);
      const matchesCategory = categoryFilter ? service.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
    setFilteredServices(filtered);
  }, [searchTerm, categoryFilter, services]);

  // Handle mở modal chi tiết
  const handleOpenDetails = (service) => {
    setSelectedService(service);
    setOpen(true);
  };

  // Handle đóng modal
  const handleClose = () => {
    setOpen(false);
  };

  // Handle đặt lịch
  const handleBooking = (serviceId) => {
    navigate(`/appointments/add?serviceId=${serviceId}`);
  };

  // Lấy danh sách các danh mục duy nhất từ dịch vụ
  const uniqueCategories = useMemo(() => {
    return [...new Set((services || []).map((service) => service?.category).filter(Boolean))];
  }, [services]);

  const categoryItems = useMemo(() => {
    const allKey = '__all__';
    const items = [
      {
        key: allKey,
        label: 'Tất cả danh mục',
        icon: <AppstoreOutlined />,
      },
      { type: 'divider' },
      ...uniqueCategories.map((category) => ({
        key: category,
        label: getCategoryLabel(category),
        icon: getCategoryIcon(category),
        extra: `${services.filter((s) => s?.category === category).length}`,
      })),
    ];
    return { items, allKey };
  }, [uniqueCategories, services]);

  const selectedCategoryLabel = categoryFilter ? getCategoryLabel(categoryFilter) : 'Tất cả danh mục';

  return (
    <div className="services-page">
      <div className="services-page__container">
        <Card className="services-hero" bordered={false}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24}>              <Title level={2} className="services-hero__title">
                Dịch vụ chăm sóc thú cưng
              </Title>
              <Paragraph className="services-hero__desc">
                Chúng tôi cung cấp đa dạng các dịch vụ chăm sóc toàn diện cho thú cưng của bạn. Từ cắt
                tỉa lông, khám sức khỏe đến huấn luyện chuyên nghiệp với đội ngũ bác sĩ và nhân viên
                giàu kinh nghiệm.
              </Paragraph>

              <div className="services-toolbar">
                <div className="services-toolbar__search">
                  <Typography.Text strong>Tìm kiếm</Typography.Text>
                  <div style={{ height: 6 }} />
                  <Typography.Text type="secondary" className="services-toolbar__hint">
                    Theo tên hoặc mô tả
                  </Typography.Text>
                </div>

                <div className="services-toolbar__row services-toolbar__row--controls">
                  <div className="services-toolbar__control services-toolbar__control--search">
                    <Input
                      size="large"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Tìm kiếm dịch vụ..."
                    />
                  </div>

                  <div className="services-toolbar__control services-toolbar__control--category">
                    {/* Dropdown danh mục theo mẫu bạn chọn */}
                    <Dropdown
                      menu={{
                        items: categoryItems.items,
                        onClick: ({ key }) => {
                          if (key === categoryItems.allKey) setCategoryFilter('');
                          else setCategoryFilter(key);
                        },
                      }}
                      trigger={['hover', 'click']}
                    >
                      <a
                        onClick={(e) => e.preventDefault()}
                        className="services-categoryDropdown"
                        aria-label="Chọn danh mục"
                      >
                        <Space>
                          Danh mục: <Text strong>{selectedCategoryLabel}</Text>
                          <DownOutlined />
                        </Space>
                      </a>
                    </Dropdown>
                  </div>

                  <div className="services-toolbar__control services-toolbar__control--reset">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('');
                      }}
                    >
                      Xóa lọc
                    </Button>
                  </div>
                </div>
              </div>
            </Col>

          </Row>
        </Card>

        {error && (
          <div className="services-block">
            <Alert type="error" showIcon message="Có lỗi xảy ra" description={error} />
          </div>
        )}

        {loading ? (
          <div className="services-loading">
            <CustomSpinner size="large" tip="Đang tải danh sách dịch vụ..." />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="services-empty">
            <Empty description="Không tìm thấy dịch vụ nào phù hợp" />
            <div style={{ marginTop: 12 }}>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          </div>
        ) : (
          <div className="services-sections">
            {(categoryFilter ? [categoryFilter] : uniqueCategories).map((category) => {
              const categoryServices = filteredServices.filter(
                (service) => service?.category === category
              );
              if (categoryServices.length === 0) return null;
              const categoryColor = getCategoryColor(category);

              return (
                <div className="services-section" key={category}>
                  <div className="services-section__header">
                    <Space size={10} align="center">
                      <span className="services-section__icon" style={{ color: categoryColor }}>
                        {getCategoryIcon(category)}
                      </span>
                      <Title level={4} style={{ margin: 0 }}>
                        {getCategoryLabel(category)}
                      </Title>
                      <Tag style={{ marginLeft: 8 }}>{categoryServices.length}</Tag>
                    </Space>
                  </div>
                  <Divider style={{ margin: '12px 0 18px' }} />

                  <List
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 2,
                      md: 3,
                      lg: 4,
                      xl: 4,
                      xxl: 4,
                    }}
                    dataSource={categoryServices}
                    renderItem={(service) => (
                      <List.Item key={service?.serviceId}>
                        <BorderBeam duration={3} borderRadius="18px" innerRadius="18px" className="service-card-wrapper">
                        <Card
                          hoverable
                          className="service-card"
                          cover={
                            <div className="service-card__cover">
                              <Image
                                preview={false}
                                alt={service?.name}
                                src={
                                  service?.photo ||
                                  'https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png'
                                }
                                className="service-card__img"
                                fallback="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
                              />
                              <Tag
                                className="service-card__categoryTag"
                                style={{
                                  background: categoryColor,
                                  borderColor: categoryColor,
                                  color: '#fff',
                                }}
                                icon={getCategoryIcon(category)}
                              >
                                {getCategoryLabel(category)}
                              </Tag>
                            </div>
                          }
                        >
                          <Title level={5} className="service-card__title">
                            {service?.name}
                          </Title>
                          <Paragraph className="service-card__desc" ellipsis={{ rows: 3 }}>
                            {service?.description ||
                              `${formatDuration(service?.duration)} • ${formatPrice(
                                service?.price
                              )}`}
                          </Paragraph>

                          <Space size={[8, 8]} wrap>
                            <Tag icon={<ClockCircleOutlined />}>{formatDuration(service?.duration)}</Tag>
                            <Tag icon={<DollarOutlined />} color="gold">
                              {formatPrice(service?.price)}
                            </Tag>
                          </Space>

                          <Divider style={{ margin: '14px 0' }} />

                          <Space>
                            <Button icon={<InfoCircleOutlined />} onClick={() => handleOpenDetails(service)}>
                              Chi tiết
                            </Button>
                            <Button
                              type="primary"
                              icon={<CalendarOutlined />}
                              onClick={() => handleBooking(service?.serviceId)}
                            >
                              Đặt lịch
                            </Button>
                          </Space>
                        </Card>
                        </BorderBeam>
                      </List.Item>
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={open}
          onCancel={handleClose}
          width={960}
          footer={
            <Space>
              <Button onClick={handleClose}>Đóng</Button>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => selectedService && handleBooking(selectedService.serviceId)}
                disabled={!selectedService}
              >
                Đặt lịch ngay
              </Button>
            </Space>
          }
          title={selectedService?.name || 'Chi tiết dịch vụ'}
        >
          {selectedService && (
            <div className="service-modal">
              <Row gutter={[24, 24]}>
                <Col xs={24} md={11}>
                  <Image
                    alt={selectedService?.name}
                    src={
                      selectedService?.photo ||
                      'https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png'
                    }
                    fallback="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
                    style={{ borderRadius: 12 }}
                  />
                </Col>
                <Col xs={24} md={13}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag
                        icon={getCategoryIcon(selectedService?.category)}
                        style={{
                          background: getCategoryColor(selectedService?.category),
                          borderColor: getCategoryColor(selectedService?.category),
                          color: '#fff',
                        }}
                      >
                        {getCategoryLabel(selectedService?.category)}
                      </Tag>
                      <Tag icon={<ClockCircleOutlined />}>{formatDuration(selectedService?.duration)}</Tag>
                      <Tag icon={<DollarOutlined />} color="gold">
                        {formatPrice(selectedService?.price)}
                      </Tag>
                    </Space>

                    <Divider style={{ margin: '8px 0' }} />

                    <Title level={5} style={{ margin: 0 }}>
                      Mô tả
                    </Title>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {selectedService?.description || 'Chưa có mô tả.'}
                    </Paragraph>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ServicesPage;