import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Space, Flex, Tag, Alert, Descriptions, Tabs, Statistic, Input, Select, Modal, Form, Radio, Card, Row, Col, Upload, Typography } from 'antd';
import StatusTag from '../common/StatusTag';
import axiosClient from '../../utils/axiosClient';
import serviceService from '../../services/serviceService';
import { BASE_URL } from '../../config/api';
import { 
  PlusOutlined, 
  SearchOutlined, 
  SyncOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  CloseOutlined, 
  UploadOutlined, 
  PictureOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TagsOutlined,
  FileTextOutlined,
  HomeOutlined,
  CustomerServiceOutlined,
  PoweroffOutlined
} from '@ant-design/icons';

// Styled Components
const ServiceManagementContainer = styled.div`
  width: 100%;
  animation: fadeIn 0.5s ease;
  position: relative;

  h1 {
    font-size: 32px;
    font-weight: 600;
    color: #1f1f1f;
    margin: 0 0 35px 0;
    display: flex;
    align-items: center;
    gap: 15px;
    
    .anticon {
      font-size: 30px;
      background: linear-gradient(135deg, #1890ff, #36cfc9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  @keyframes shimmer {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  flex-wrap: wrap;
  gap: 16px;
  background: #f9fafb;
  padding: 16px 20px;
  border-radius: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LegacyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 12px;
  font-size: 14px;
  padding: 14px 24px;

  &.primary {
    background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
    color: white;
    box-shadow: 0 8px 16px rgba(24, 144, 255, 0.25);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(24, 144, 255, 0.4);
    }
    
    &:active {
      transform: translateY(-2px);
    }
    
    .anticon {
      font-size: 16px;
    }
  }

  &.refresh {
    background: white;
    color: #5a5a5a;
    border: 1px solid #e8e8e8;

    &:hover {
      background: #f5f5f5;
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    }

    .anticon-sync {
      font-size: 16px;
      color: #1890ff;
    }
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #8c8c8c;

  .loader {
    width: 60px;
    height: 60px;
    border: 3px solid rgba(24, 144, 255, 0.1);
    border-radius: 50%;
    border-top: 3px solid #1890ff;
    margin-bottom: 20px;
    animation: spin 0.8s linear infinite;
    box-shadow: 0 5px 15px rgba(24, 144, 255, 0.15);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    font-size: 16px;
    font-weight: 500;
    animation: pulse 1.5s ease infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const ErrorMessage = styled.div`
  background-color: #fff2f0;
  border-left: 4px solid #ff4d4f;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: #ff4d4f;

  .anticon {
    font-size: 24px;
  }

  .error-text {
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 0;
  color: #8c8c8c;
  background: #f9fafb;
  border-radius: 16px;

  .anticon {
    font-size: 56px;
    margin-bottom: 20px;
    color: #1890ff;
  }

  p {
    font-size: 18px;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const FilterTagsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const ServiceCategorySection = styled.div`
  margin-bottom: 45px;
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
  
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }

  &:last-child {
    margin-bottom: 0;
  }

  .category-title {
    font-size: 20px;
    font-weight: 600;
    color: #2B3674;
    margin-bottom: 25px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(67, 24, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    
    .anticon {
      color: #304FFE;
      font-size: 18px;
    }
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
`;

const FilterButton = styled.button`
  padding: 10px 16px;
  border-radius: 12px;
  background: ${props => props.active ? 'linear-gradient(135deg, #304FFE 0%, #304FFE 100%)' : '#F4F7FE'};
  color: ${props => props.active ? 'white' : '#707EAE'};
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 8px 20px rgba(67, 24, 255, 0.25)' : 'none'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(67, 24, 255, 0.2);
  }
`;

// Thêm component Stat Cards để hiển thị số lượng dịch vụ
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  
  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.bgColor || 'linear-gradient(135deg, #304FFE 0%, #304FFE 100%)'};
    color: white;
    font-size: 20px;
  }
  
  .content {
    h4 {
      font-size: 13px;
      color: #707EAE;
      margin: 0 0 5px;
    }
    
    .number {
      font-size: 24px;
      font-weight: 700;
      color: #2B3674;
      margin: 0;
    }
  }
`;



const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 40px;
  
  button {
    min-width: 120px;
  }
  
  .cancel {
    background: #F4F7FE;
    color: #707EAE;
    border: 1px solid #e6e9f0;
    
    &:hover {
      background: #E5ECF6;
    }
  }
  
  .danger {
    background: linear-gradient(135deg, #FF5252, #FF7676);
    color: white;
    box-shadow: 0 8px 20px rgba(255, 82, 82, 0.25);
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(255, 82, 82, 0.4);
    }
  }
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 2px solid ${props => props.active ? '#304FFE' : '#e6e9f0'};
  background: ${props => props.active ? 'rgba(67, 24, 255, 0.1)' : '#F9FAFC'};
  color: ${props => props.active ? '#304FFE' : '#707EAE'};
  border-radius: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  .anticon {
    font-size: 16px;
  }
  
  &:hover {
    background: ${props => props.active ? 'rgba(67, 24, 255, 0.15)' : '#F4F7FE'};
  }
`;



const ToastContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 2000;
  max-width: 420px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  thead tr {
    background: #f5f7fa;
    height: 60px;
  }

  th {
    font-weight: 600;
    color: #262626;
    text-align: left;
    padding: 20px 24px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 20%;
      height: 60%;
      width: 1px;
      background-color: #f0f0f0;
    }
  }

  tr {
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.2s ease;
  }

  tbody tr {
    &:hover {
      background-color: #f5f7fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
  }

  td {
    padding: 18px 24px;
    color: #595959;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
  }

  .title-cell {
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 15px;

    img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
      background-color: #f5f5f5;
      border: 1px solid #f0f0f0;
    }

    .title-details {
      display: flex;
      flex-direction: column;
      
      small {
        font-weight: normal;
        color: #8c8c8c;
        margin-top: 4px;
      }
    }
  }

  .price-cell {
    font-weight: 600;
    color: #52c41a;
  }

  .actions-cell {
    display: flex;
    gap: 15px;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.danger ? 'rgba(255, 77, 79, 0.1)' : 'rgba(24, 144, 255, 0.1)'};
  color: ${props => props.danger ? '#ff4d4f' : '#1890ff'};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'};
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(0);
  }

  .anticon {
    font-size: 16px;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;

  .pagination-info {
    color: #8c8c8c;
    font-size: 14px;
  }

  .pagination-controls {
    display: flex;
    gap: 10px;
  }
`;

const PageButton = styled.button`
  min-width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 14px;
  background: ${props => props.active ? '#1890ff' : 'white'};
  color: ${props => props.active ? 'white' : '#595959'};
  border: 1px solid ${props => props.active ? '#1890ff' : '#e8e8e8'};

  &:hover:not(:disabled) {
    border-color: #1890ff;
    color: ${props => props.active ? 'white' : '#1890ff'};
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.icon-button {
    width: 40px;
  }

  .anticon {
    font-size: 14px;
  }
`;

// Thêm hàm formatCurrency ngay trước hoặc sau các hàm helper khác
const formatCurrency = (value) => {
  if (!value) return '';
  // Loại bỏ tất cả ký tự không phải số
  const numericValue = value.toString().replace(/[^0-9]/g, '');
  // Định dạng số với dấu phân cách hàng nghìn
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Thêm hàm parseCurrency để chuyển chuỗi định dạng về số
const parseCurrency = (formattedValue) => {
  if (!formattedValue) return '';
  // Loại bỏ tất cả ký tự không phải số
  return formattedValue.toString().replace(/[^0-9]/g, '');
};

// Định nghĩa component ServiceManagement
const ServiceManagement = () => {
  const [form] = Form.useForm();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const fileInputRef = useRef(null);
  const [newImage, setNewImage] = useState(null);
  const [buttonLoadings, setButtonLoadings] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    isActive: true
  });
  
  // Thêm state mới
  const [filterCategory, setFilterCategory] = useState('All');
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    inactive: 0
  });

  // Thêm useEffect để tính toán stats
  useEffect(() => {
    if (services.length) {
      const activeServices = services.filter(s => s.isActive).length;
      setStats({
        all: services.length,
        active: activeServices,
        inactive: services.length - activeServices
      });
    }
  }, [services]);

  useEffect(() => {
    fetchServices();
  }, []);

  // Cập nhật fetchServices để xử lý URL ảnh đúng cách
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const servicesData = await serviceService.getAllServices();
      console.log("Services fetched:", servicesData);
      
      // Đảm bảo URL ảnh đúng định dạng
      const processedServices = servicesData.map(service => {
        if (service.photo && !service.photo.startsWith('http') && !service.photo.startsWith('data:')) {
          // Thêm tiền tố cho URL ảnh
          const photoPath = service.photo.startsWith('/') ? service.photo : `/${service.photo}`;
          return {
            ...service,
            photo: `${BASE_URL}${photoPath}`
          };
        }
        return service;
      });
      
      setServices(processedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Các xử lý khác
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      duration: '',
      isActive: true
    });
    setNewImage(null);
  };

  const handleAddNew = () => {
    resetForm();
    setEditMode(false);
    setCurrentService(null);
    setShowForm(true);
  
    form.resetFields();
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Cập nhật handleSubmit để xử lý ảnh đúng cách
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.description.trim() || !formData.category || !formData.price || !formData.duration) {
      showToast('Vui lòng điền đầy đủ thông tin dịch vụ', 'error');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Submitting form:", formData);
      
      // Prepare service data
      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(parseCurrency(formData.price)), // Chuyển đổi từ chuỗi định dạng về số
        duration: parseInt(formData.duration),
        isActive: formData.isActive
      };
      
      // Chỉ thêm ảnh vào formData nếu có ảnh mới được chọn
      if (newImage) {
        serviceData.photo = newImage;
      }
      
      let response;
      
      // Trong phần handleSubmit, cập nhật cách xử lý ảnh
      if (editMode) {
        // Update existing service
        response = await serviceService.updateService(currentService.serviceId, serviceData);
        
        // Nếu response không có ảnh nhưng service hiện tại có, giữ lại ảnh cũ
        if (!response.photo && currentService.photo) {
          response.photo = currentService.photo;
        } else if (response.photo && !response.photo.startsWith('http') && !response.photo.startsWith('data:')) {
          // Đảm bảo URL ảnh trả về từ API có tiền tố đúng
          const photoPath = response.photo.startsWith('/') ? response.photo : `/${response.photo}`;
          response.photo = `${BASE_URL}${photoPath}`;
        }
        
        // Update state
        setServices(services.map(service => 
          service.serviceId === currentService.serviceId ? 
          { ...response, serviceId: currentService.serviceId } : service
        ));
        
        showToast('Cập nhật dịch vụ thành công', 'success');
      } else {
        // Create new service
        response = await serviceService.createService(serviceData);
        
        // Đảm bảo URL ảnh trả về từ API có tiền tố đúng
        if (response.photo && !response.photo.startsWith('http') && !response.photo.startsWith('data:')) {
          const photoPath = response.photo.startsWith('/') ? response.photo : `/${response.photo}`;
          response.photo = `${BASE_URL}${photoPath}`;
        }
        
        // Add to state
        setServices([...services, response]);
        showToast('Thêm dịch vụ mới thành công', 'success');
      }
      
      // Reset form and close modal
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting service:', err);
      showToast(`Không thể ${editMode ? 'cập nhật' : 'thêm'} dịch vụ: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật handleDelete để sử dụng serviceService
  const confirmDeleteService = async () => {
    if (!confirmDelete) return;
    
    try {
      await serviceService.deleteService(confirmDelete);
      
      // Update local state after successful deletion
      setServices(services.filter(service => service.serviceId !== confirmDelete));
      showToast('Đã xóa dịch vụ thành công', 'success');
    } catch (err) {
      console.error('Error deleting service:', err);
      showToast('Không thể xóa dịch vụ. Vui lòng thử lại sau.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  // Helper functions
  const getCategoryLabel = (category) => {
    const categories = {
      'Grooming': 'Chăm sóc & Làm đẹp',
      'Healthcare': 'Y tế & Sức khỏe',
      'Training': 'Huấn luyện',
      'Boarding': 'Trông giữ qua đêm',
      'DayCare': 'Trông giữ ban ngày',
      'Other': 'Dịch vụ khác'
    };
    return categories[category] || category;
  };

  // Helper function to get the appropriate icon for a category
  const getCategoryIcon = (category) => {
    const icons = {
      'Grooming': <TagsOutlined />,
      'Healthcare': <InfoCircleOutlined />,
      'Training': <TagsOutlined />,
      'Boarding': <HomeOutlined />,
      'DayCare': <ClockCircleOutlined />,
      'Other': <FileTextOutlined />
    };
    return icons[category] || <FileTextOutlined />;
  };

  // Filter services based on selected category
  const filteredServicesByCategory = filterCategory === 'All' 
    ? services
    : services.filter(service => service.category === filterCategory);
  
  // Filter further by search term
  const filteredServices = filteredServicesByCategory.filter(service => 
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {});

  // Thêm hàm handleEdit trong component ServiceManagement
  const handleEdit = (service) => {
    const currentService = { ...service };
    if (currentService.photo && !currentService.photo.startsWith('http') && !currentService.photo.startsWith('data:')) {
      const photoPath = currentService.photo.startsWith('/') ? currentService.photo : `/${currentService.photo}`;
      currentService.photo = `${BASE_URL}${photoPath}`;
    }

    setCurrentService(currentService);
    setEditMode(true);
    setShowForm(true);

    form.setFieldsValue({
      name: currentService.name,
      description: currentService.description,
      category: currentService.category,
      price: currentService.price ? currentService.price.toString() : '',
      duration: currentService.duration,
      isActive: currentService.isActive
    });
  };

  // Thêm hàm handleDelete trong component ServiceManagement
  const handleDelete = (serviceId) => {
    setConfirmDelete(serviceId);
  };

  // Cập nhật phần render của component
  return (
    <ServiceManagementContainer>
      {/* Header kiểu PageHeader cho quản lý dịch vụ */}
      <div
        style={{
          border: '1px solid #ebedf0',
          borderRadius: 16,
          padding: 16,
          background: '#fff',
          marginBottom: 24,
        }}
      >
        {/* Title + extra */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              <CustomerServiceOutlined />
              <span>Quản lý dịch vụ</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 13 }}>
              Quản lý danh sách dịch vụ, giá và trạng thái hoạt động
            </div>
          </div>

          <Space>
            <Button
              icon={<SyncOutlined />}
              loading={loading}
              onClick={fetchServices}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              Thêm dịch vụ mới
            </Button>
          </Space>
        </div>

        {/* Nội dung mô tả + extra thống kê */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Tổng dịch vụ">{stats.all}</Descriptions.Item>
              <Descriptions.Item label="Đang hoạt động">{stats.active}</Descriptions.Item>
              <Descriptions.Item label="Ngừng hoạt động">{stats.inactive}</Descriptions.Item>
            </Descriptions>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              minWidth: 220,
            }}
          >
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              style={{ marginRight: 32 }}
            />
            <Statistic title="Ngừng hoạt động" value={stats.inactive} />
          </div>
        </div>

        {/* Tabs giống footer của PageHeader */}
        <Tabs 
          defaultActiveKey="all" 
          size="small" 
          style={{ marginTop: 16 }}
          items={[
            { key: 'all', label: 'Tất cả dịch vụ' },
            { key: 'active', label: 'Dịch vụ đang hoạt động' }
          ]}
        />
      </div>
      
      <ActionBar>
        <Flex gap="small" align="center" wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
          >
            Thêm dịch vụ mới
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={loading}
            onClick={fetchServices}
          >
            Làm mới
          </Button>
        </Flex>
        
        <SearchContainer>
          <Input
            placeholder="Tìm kiếm dịch vụ..."
            value={searchTerm}
            onChange={handleSearchChange}
            prefix={<SearchOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />}
            size="large"
            style={{ borderRadius: '12px' }}
          />
        </SearchContainer>
      </ActionBar>
      
      {/* Filter Tabs */}
      <Tabs
        activeKey={filterCategory}
        onChange={(key) => setFilterCategory(key)}
        style={{ marginBottom: 24 }}
        indicator={{ size: (origin) => origin - 20, align: 'center' }}
        items={[
          { key: 'All', label: 'Tất cả' },
          { key: 'Grooming', label: 'Chăm sóc & Làm đẹp' },
          { key: 'Healthcare', label: 'Y tế & Sức khỏe' },
          { key: 'Training', label: 'Huấn luyện' },
          { key: 'Boarding', label: 'Trông giữ qua đêm' },
        ]}
      />
      
      {/* Loading và error states */}
      {loading && (
        <LoadingContainer>
          <div className="loader"></div>
          <p>Đang tải danh sách dịch vụ...</p>
        </LoadingContainer>
      )}
      
      {error && !loading && (
        <ErrorMessage>
          <ExclamationCircleOutlined />
          <p className="error-text">{error}</p>
        </ErrorMessage>
      )}
      
      {/* Danh sách dịch vụ */}
      {!loading && !error && filteredServices.length === 0 && (
        <EmptyState>
          <InfoCircleOutlined />
          <p>Không tìm thấy dịch vụ nào. Hãy thêm dịch vụ mới.</p>
        </EmptyState>
      )}
      
      {!loading && !error && Object.keys(servicesByCategory).length > 0 && (
        <>
          {Object.keys(servicesByCategory).map(category => (
            <ServiceCategorySection key={category}>
              <h2 className="category-title">
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </h2>
              <Row gutter={[24, 24]}>
                {servicesByCategory[category].map(service => (
                  <Col xs={24} sm={12} md={8} lg={6} key={service.serviceId}>
                    <Card
                      hoverable
                      bordered={false}
                      style={{ 
                        height: '100%', 
                        borderRadius: 20, 
                        overflow: 'hidden', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease'
                      }}
                      bodyStyle={{ padding: 24 }}
                      cover={
                        <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f8f9fa' }}>
                          {service.photo ? (
                            <img draggable={false} alt={service.name} src={service.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
                              <PictureOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                              <div>Không có ảnh</div>
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: 12, right: 12 }}>
                            <Tag 
                              color={service.isActive ? '#52c41a' : '#ff4d4f'} 
                              style={{ 
                                margin: 0, 
                                borderRadius: 12, 
                                padding: '4px 12px', 
                                fontWeight: 600,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                border: 'none'
                              }}
                            >
                              {service.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                            </Tag>
                          </div>
                        </div>
                      }
                      actions={[
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          loading={buttonLoadings[`edit-${service.serviceId}`]}
                          onClick={() => {
                            setButtonLoadings(prev => ({ ...prev, [`edit-${service.serviceId}`]: true }));
                            handleEdit(service);
                            setTimeout(() => {
                              setButtonLoadings(prev => ({ ...prev, [`edit-${service.serviceId}`]: false }));
                            }, 500);
                          }}
                          style={{ color: '#1890ff', fontWeight: 500 }}
                        >
                          Sửa
                        </Button>,
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          loading={buttonLoadings[`delete-${service.serviceId}`]}
                          onClick={() => {
                            setButtonLoadings(prev => ({ ...prev, [`delete-${service.serviceId}`]: true }));
                            handleDelete(service.serviceId);
                            setTimeout(() => {
                              setButtonLoadings(prev => ({ ...prev, [`delete-${service.serviceId}`]: false }));
                            }, 500);
                          }}
                          style={{ fontWeight: 500 }}
                        >
                          Xóa
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Typography.Title level={4} style={{ color: '#2B3674', margin: 0, fontWeight: 700 }}>
                            {service.name}
                          </Typography.Title>
                        }
                        description={
                          <Flex vertical gap="middle" style={{ marginTop: 12 }}>
                            <Typography.Paragraph 
                              ellipsis={{ rows: 2 }} 
                              style={{ color: '#707EAE', margin: 0, minHeight: 44, fontSize: 15 }}
                            >
                              {service.description}
                            </Typography.Paragraph>
                            <Flex justify="space-between" align="center" style={{ padding: '12px 16px', background: '#f5f7ff', borderRadius: 12 }}>
                              <Typography.Text style={{ color: '#305CFF', fontWeight: 700, fontSize: 16 }}>
                                <DollarOutlined /> {service.price?.toLocaleString('vi-VN')} đ
                              </Typography.Text>
                              <Typography.Text style={{ color: '#707EAE', fontWeight: 500 }}>
                                <ClockCircleOutlined /> {service.duration}'
                              </Typography.Text>
                            </Flex>
                          </Flex>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </ServiceCategorySection>
          ))}
        </>
      )}

      {/* Modal form thêm/sửa dịch vụ */}
      <Modal
        title={editMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
        open={showForm}
        onCancel={() => setShowForm(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText={editMode ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={900}
        destroyOnClose
      >
        <Form 
          form={form}
          layout="vertical" 
          onFinish={(values) => {
            // Update formData state to be compatible with existing handleSubmit logic
            setFormData({
              name: values.name,
              description: values.description,
              category: values.category,
              price: values.price,
              duration: values.duration,
              isActive: values.isActive
            });
            // Fake event to bypass e.preventDefault
            setTimeout(() => handleSubmit({ preventDefault: () => {} }), 0);
          }}
          initialValues={{ isActive: true, category: '' }}
        >
          <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}>
            <Input placeholder="Nhập tên dịch vụ" size="large" />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
            <Input.TextArea placeholder="Nhập mô tả dịch vụ" rows={4} size="large" />
          </Form.Item>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                <Select
                  style={{ width: '100%', height: '40px' }}
                  options={[
                    { value: '', label: '-- Chọn danh mục --', disabled: true },
                    { value: 'Grooming', label: 'Chăm sóc & Làm đẹp' },
                    { value: 'Healthcare', label: 'Y tế & Sức khỏe' },
                    { value: 'Training', label: 'Huấn luyện' },
                    { value: 'Boarding', label: 'Trông giữ qua đêm' },
                    { value: 'DayCare', label: 'Trông giữ ban ngày' },
                    { value: 'Other', label: 'Dịch vụ khác' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Trạng thái">
                <Radio.Group
                  block
                  options={[
                    { label: <><CheckCircleOutlined /> Hoạt động</>, value: true },
                    { label: <><CloseCircleOutlined /> Không hoạt động</>, value: false },
                  ]}
                  optionType="button"
                  buttonStyle="solid"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
                <Input placeholder="Nhập giá dịch vụ (VNĐ)" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Thời gian (phút)" rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}>
                <Input type="number" placeholder="Nhập thời gian thực hiện" min="0" size="large" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="Hình ảnh">
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={(file) => {
                setNewImage(file);
                return false;
              }}
            >
              {newImage || (editMode && currentService?.photo) ? (
                <img 
                  id="img-preview"
                  src={newImage ? URL.createObjectURL(newImage) : currentService.photo} 
                  alt="preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div>
                  <UploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal
        title="Xác nhận xóa"
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div className="confirm-icon">
            <ExclamationCircleOutlined style={{ fontSize: '60px', color: '#FF5252' }} />
          </div>
          <p style={{ fontSize: '16px', margin: '20px 0' }}>
            Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.
          </p>
          <Flex gap="small" justify="flex-end" style={{ marginTop: 24 }}>
            <Button onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button
              danger
              icon={loading ? <SyncOutlined spin /> : null}
              loading={loading}
              onClick={() => {
                handleDelete(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Xác nhận xóa
            </Button>
          </Flex>
        </div>
      </Modal>

      {/* Toast notification - dùng Ant Design Alert giống UserManagement */}
      <AnimatePresence>
        {toast.show && (
          <ToastContainer>
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <Alert
                type={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}
                message={toast.type === 'success'
                  ? 'Thành công'
                  : toast.type === 'error'
                    ? 'Lỗi'
                    : 'Thông báo'}
                description={toast.message}
                showIcon
                closable
                onClose={() => setToast({ show: false, message: '', type: '' })}
              />
            </motion.div>
          </ToastContainer>
        )}
      </AnimatePresence>
    </ServiceManagementContainer>
  );
};

export default ServiceManagement;
