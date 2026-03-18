import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, Button, Flex, Tag, Space, Radio, Alert, Checkbox, Dropdown, Drawer, Tabs, Spin, Empty, List, Row, Col, Divider } from 'antd';
import useAuth from '../../hooks/useAuth';
import axiosClient from '../../utils/axiosClient';
import petService from '../../services/petService';
import './UserManagement.css';
// Import Ant Design Icons
import {
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  EditOutlined,
  StopOutlined,
  CheckOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  SafetyOutlined,
  CloseOutlined,
  PoweroffOutlined,
  DownOutlined
} from '@ant-design/icons';

// ============ Animation Keyframes ============
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(1deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
  75% { transform: translateY(-8px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.3); }
  50% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.6); }
  100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.3); }
`;

// ============ Styled Components ============
const UserManagementContainer = styled.div`
  width: 100%;
  max-width: 100%;
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.5s ease;
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #4318FF, #868CFF);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e9f0;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #2B3674;
    margin: 0;
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;

    .anticon {
      font-size: 24px;
      color: #4318FF;
      background: linear-gradient(135deg, #4318FF, #868CFF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: ${pulse} 2s infinite ease-in-out;
    }
  }

  .refresh-button {
    background: linear-gradient(135deg, #4318FF, #868CFF);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 6px 15px rgba(67, 24, 255, 0.3);
    font-weight: 500;
    font-size: 14px;
  }
`;

const FiltersContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  animation: ${slideUp} 0.5s ease;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.div`
  flex: 2;
  position: relative;

  input {
    width: 100%;
    padding: 14px 20px 14px 50px;
    border: 2px solid #e6e9f0;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background: white;

    &:focus {
      outline: none;
      border-color: #4318FF;
      box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.15);
    }
  }

  .search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #4318FF;
    transition: all 0.3s ease;
    font-size: 18px;
  }
`;

const RoleFilter = styled.div`
  flex: 1;
  max-width: 250px;
  position: relative;

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    width: 100%;
    background: white;
    border: 2px solid #e6e9f0;
    border-radius: 12px;
    font-size: 15px;
    color: #2B3674;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    text-decoration: none;

    &:hover {
      border-color: #4318FF;
      box-shadow: 0 0 0 4px rgba(67, 24, 255, 0.12);
      color: #4318FF;
    }
  }

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(231, 76, 60, 0.1);
  color: #c0392b;
  padding: 18px 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-left: 5px solid #e74c3c;
  animation: ${slideUp} 0.4s ease;
  transform-origin: center;
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.1);

  .anticon {
    font-size: 24px;
    color: #e74c3c;
  }

  .error-text {
    font-weight: 500;
    line-height: 1.5;
    flex: 1;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #7f8c8d;

  .loader-icon {
    font-size: 50px;
    color: #3498db;
    margin-bottom: 20px;
    animation: ${rotate} 1.5s linear infinite;
    filter: drop-shadow(0 4px 10px rgba(52, 152, 219, 0.3));
  }

  p {
    font-size: 18px;
    font-weight: 500;
    animation: ${pulse} 2s infinite;
    color: #34495e;
  }
`;

const EditFormOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const EditForm = styled(motion.div)`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  padding: 30px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  h2 {
    color: #2B3674;
    margin-top: 0;
    margin-bottom: 25px;
    font-weight: 600;
    position: relative;
    padding-bottom: 15px;
    text-align: center;
    font-size: 22px;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #4318FF, #868CFF);
      border-radius: 3px;
    }
  }

  .close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    background: #F4F7FE;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #707EAE;

    .anticon {
      font-size: 16px;
    }

    &:hover {
      background: #FF5252;
      color: white;
      transform: rotate(90deg);
    }
  }

  .username-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #E9F3FF;
    border-radius: 20px;
    color: #4318FF;
    font-weight: 500;
    margin-left: 10px;
    font-size: 14px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }

  .form-group {
    margin-bottom: 15px;
    position: relative;

    label {
      display: block;
      margin-bottom: 10px;
      font-weight: 500;
      color: #34495e;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;

      .anticon {
        color: #3498db;
        font-size: 16px;
      }
    }

    input, select {
      width: 100%;
      padding: 14px 15px;
      border: 2px solid #e6e9f0;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: white;

      &:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.15);
      }

      &:disabled {
        background: #f8fafc;
        color: #7f8c8d;
        cursor: not-allowed;
        border-color: #e6e9f0;
      }
    }

    &.checkbox {
      display: flex;
      align-items: center;
      margin-top: 15px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        background: #f1f9fe;
      }

      label {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-bottom: 0;
        font-weight: 500;
        color: #34495e;
        width: 100%;
      }

      input {
        width: 20px;
        height: 20px;
        margin-right: 15px;
        accent-color: #3498db;
        cursor: pointer;
      }
    }
  }

  .full-width {
    grid-column: 1 / -1;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;

  button {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    .anticon {
      font-size: 16px;
    }

    &.save {
      background: linear-gradient(135deg, #4318FF, #868CFF);
      color: white;
      box-shadow: 0 6px 15px rgba(67, 24, 255, 0.3);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(67, 24, 255, 0.4);
      }
    }

    &.cancel {
      background: #F4F7FE;
      color: #707EAE;

      &:hover {
        background: #E5ECF6;
        transform: translateY(-3px);
      }
    }
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.6s ease;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  .anticon {
    font-size: 14px;
  }
  
  &.admin {
    background-color: #FFF9E6;
    color: #FFB547;
    
    &:hover {
      background-color: #FFF5D8;
      transform: translateY(-2px);
    }
  }
  
  &.customer {
    background-color: #E9F3FF;
    color: #4318FF;
    
    &:hover {
      background-color: #DCE9FB;
      transform: translateY(-2px);
    }
  }
  
  &.staff {
    background-color: #E6FFF4;
    color: #05CD99;
    
    &:hover {
      background-color: #D7F7E9;
      transform: translateY(-2px);
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  
  .anticon {
    font-size: 14px;
  }
  
  &.active {
    background-color: #E6FFF4;
    color: #05CD99;
  }
  
  &.inactive {
    background-color: #FFE5E5;
    color: #FF5252;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 5px;

    .anticon {
      font-size: 13px;
    }

    &.edit {
      background-color: #E9F3FF;
      color: #4318FF;

      &:hover:not(:disabled) {
        background-color: #4318FF;
        color: white;
      }
    }

    &.toggle-status {
      background-color: #F4F7FE;
      color: #2B3674;

      &:hover:not(:disabled) {
        background-color: #707EAE;
        color: white;
      }
    }

    &.delete {
      background-color: #FFE5E5;
      color: #FF5252;

      &:hover:not(:disabled) {
        background-color: #FF5252;
        color: white;
      }
    }
  }
`;

const NoData = styled.td`
  text-align: center;
  padding: 40px !important;
  color: #7f8c8d;

  .no-data-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .anticon {
      font-size: 40px;
      color: #3498db;
      margin-bottom: 20px;
      animation: ${rotate} 2s linear infinite;
    }

    p {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  max-width: 400px;
`;

const EmptyStateCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  margin: 30px 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233498db' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    z-index: 0;
  }

  .icon-container {
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 25px;
    box-shadow: 0 10px 30px rgba(52, 152, 219, 0.2);
    position: relative;
    z-index: 1;
    animation: ${float} 3s infinite ease-in-out;
  }

  .icon {
    font-size: 50px;
    color: #3498db;
    background: linear-gradient(135deg, #3498db, #1890ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  h3 {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 24px;
    font-weight: 600;
    position: relative;
    z-index: 1;
  }

  p {
    color: #7f8c8d;
    max-width: 450px;
    margin: 0 auto 30px;
    line-height: 1.7;
    font-size: 16px;
    position: relative;
    z-index: 1;
  }

  .empty-button {
    margin-top: 10px;
    background: linear-gradient(135deg, #3498db, #1890ff);
    color: white;
    border: none;
    padding: 14px 30px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 6px 15px rgba(52, 152, 219, 0.3);
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 1;

    .anticon {
      font-size: 18px;
    }

    &:hover {
      transform: translateY(-5px) scale(1.03);
      box-shadow: 0 10px 25px rgba(52, 152, 219, 0.4);
    }

    &:active {
      transform: translateY(-2px);
    }
  }
`;

// Ant Design Checkbox custom styles (icon bo tròn, label màu xanh)
const checkboxStyles = {
  icon: {
    borderRadius: 6,
  },
  label: {
    fontWeight: 500,
  },
};

const DescriptionItem = ({ title, content }) => (
  <div style={{ marginBottom: 14 }}>
    <p style={{ marginBottom: 6, color: '#707EAE', fontWeight: 600 }}>{title}:</p>
    <div>{content}</div>
  </div>
);

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info' // 'info', 'success', 'error'
  });
  // State cho pagination placement
  const [topPagination, setTopPagination] = useState('topStart');
  const [bottomPagination, setBottomPagination] = useState('bottomEnd');
  // State cho button loading
  const [buttonLoadings, setButtonLoadings] = useState({});
  
  // State cho create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    role: 'Customer'
  });
  const [createLoading, setCreateLoading] = useState(false);

  // State form cho việc chỉnh sửa người dùng
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    role: '',
    isActive: true
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailAppointments, setDetailAppointments] = useState([]);
  const [detailPets, setDetailPets] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTabKey, setDetailTabKey] = useState('1');

  // Tải danh sách người dùng khi component được mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Hàm đóng toast
  const closeToast = () => {
    setToast({...toast, show: false});
  };

  // Hiển thị toast
  const showToast = (message, type = 'info') => {
    setToast({
      show: true,
      message,
      type
    });

    // Tự động đóng toast sau 5 giây
    setTimeout(() => {
      closeToast();
    }, 5000);
  };

  // Lấy danh sách người dùng từ API với xử lý lỗi chi tiết
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Đang tải danh sách người dùng...');
      
      // Kiểm tra token
      const token = localStorage.getItem('token');
      console.log('Token khả dụng:', !!token);
      if (!token) {
        console.error('Không tìm thấy token trong localStorage');
        setError('Lỗi xác thực: Vui lòng đăng nhập lại.');
        return;
      }
      
      // Hiển thị vài ký tự đầu của token để debug (không hiển thị toàn bộ token vì lý do bảo mật)
      console.log('Token preview:', token.substring(0, 15) + '...');
      
      // Kiểm tra user
      const userData = localStorage.getItem('user');
      console.log('Dữ liệu người dùng trong localStorage:', userData ? 'tồn tại' : 'không tìm thấy');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Vai trò người dùng:', user.role);
      }
      
      // Thử lần lượt các đường dẫn API khác nhau
      let response;
      try {
        // Đường dẫn 1: /Users
        console.log('Đang thử đường dẫn: /Users');
        response = await axiosClient.get('/Users');
      } catch (apiError) {
        console.log('Lần thử đầu tiên thất bại, đang thử đường dẫn thay thế');
        try {
          // Đường dẫn 2: /Users
          console.log('Đang thử đường dẫn: /Users');
          response = await axiosClient.get('/Users');
        } catch (apiError2) {
          // Nếu cả hai đều thất bại, thử đường dẫn 3: /admin/Users
          console.log('Lần thử thứ hai thất bại, đang thử đường dẫn cuối cùng');
          console.log('Đang thử đường dẫn: /admin/Users');
          response = await axiosClient.get('/admin/Users');
        }
      }
      
      console.log('Dữ liệu người dùng đã nhận:', response.data);
      setUsers(response.data);
      setError(null);
      showToast('Đã tải danh sách người dùng thành công', 'success');
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      
      if (err.response) {
        // Lỗi từ server
        console.error('Mã trạng thái:', err.response.status);
        console.error('Dữ liệu phản hồi:', err.response.data);
        
        // Xử lý lỗi dựa trên status code
        if (err.response.status === 401) {
          setError('Xác thực thất bại: Vui lòng đăng nhập lại.');
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
          console.log('Token có thể không hợp lệ hoặc đã hết hạn. Đang chuyển hướng đến trang đăng nhập...');
          setTimeout(() => {
            // Redirect sau 2s để người dùng kịp đọc thông báo
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 2000);
        } else if (err.response.status === 403) {
          setError('Truy cập bị từ chối: Bạn không có quyền xem dữ liệu này.');
          showToast('Bạn không có quyền xem dữ liệu này', 'error');
        } else if (err.response.status === 404) {
          setError('Không tìm thấy tài nguyên: Điểm cuối API có thể đã thay đổi. Vui lòng kiểm tra cấu hình máy chủ.');
          showToast('Không tìm thấy nguồn dữ liệu', 'error');
        } else {
          setError(`Lỗi máy chủ (${err.response.status}): ${
            typeof err.response.data === 'string' 
              ? err.response.data 
              : err.response.data.message || 'Lỗi không xác định'
          }`);
          showToast('Đã xảy ra lỗi khi tải dữ liệu', 'error');
        }
      } else if (err.request) {
        // Lỗi không nhận được phản hồi từ server
        console.error('Không nhận được phản hồi từ máy chủ');
        setError('Lỗi mạng: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn.');
        showToast('Không thể kết nối đến máy chủ', 'error');
      } else {
        // Lỗi khác
        setError(`Lỗi: ${err.message}`);
        showToast('Đã xảy ra lỗi không xác định', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi input trong form chỉnh sửa
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openDetailDrawer = async (selectedUser) => {
    try {
      setDetailOpen(true);
      setDetailUser(selectedUser);
      setDetailTabKey('1');
      setDetailLoading(true);

      let appointments = [];
      try {
        const response = await axiosClient.get('/Appointments');
        const list = Array.isArray(response.data) ? response.data : [];
        appointments = list.filter((a) => Number(a.userId) === Number(selectedUser.userId));
      } catch (e) {
        appointments = [];
      }

      let pets = [];
      try {
        const petList = await petService.getPetsByUserId(selectedUser.userId);
        pets = Array.isArray(petList) ? petList : [];
      } catch (e) {
        pets = [];
      }

      setDetailAppointments(appointments);
      setDetailPets(pets);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailOpen(false);
    setDetailUser(null);
    setDetailAppointments([]);
    setDetailPets([]);
    setDetailTabKey('1');
  };

  // Bắt đầu chỉnh sửa người dùng
  const handleEdit = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      isActive: user.isActive
    });
    setEditMode(true);
  };

  // Hủy chỉnh sửa
  const handleCancel = () => {
    setEditMode(false);
    setCurrentUser(null);
  };

  // Lưu thay đổi người dùng - Cập nhật để khớp với DTO backend
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Cập nhật để khớp với UpdateUserDto trong backend
      const updatedData = {
        UserId: currentUser.userId,
        Email: formData.email,
        FullName: formData.fullName,
        Phone: formData.phone,
        Address: formData.address,
        Role: formData.role,
        IsActive: formData.isActive
      };
      
      console.log('Gửi dữ liệu cập nhật:', updatedData);
      // Sử dụng đường dẫn đã xác định là hoạt động từ fetchUsers
      await axiosClient.put(`/Users/${currentUser.userId}`, updatedData);
      fetchUsers();
      setEditMode(false);
      setCurrentUser(null);
      showToast('Cập nhật người dùng thành công', 'success');
    } catch (err) {
      console.error('Lỗi khi cập nhật người dùng:', err);
      if (err.response) {
        setError(`Không thể cập nhật người dùng: ${err.response.data}`);
        showToast('Không thể cập nhật người dùng: ' + err.response.data, 'error');
      } else {
        setError('Không thể cập nhật người dùng. Vui lòng thử lại.');
        showToast('Không thể cập nhật người dùng. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Tạo người dùng mới
  const handleCreateUser = async () => {
    try {
      // Validate
      if (!createFormData.username || !createFormData.password || !createFormData.email || !createFormData.fullName) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
      }
      
      if (createFormData.password !== createFormData.confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
      }
      
      if (createFormData.password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
      }
      
      setCreateLoading(true);
      
      const newUserData = {
        username: createFormData.username,
        password: createFormData.password,
        email: createFormData.email,
        fullName: createFormData.fullName,
        phone: createFormData.phone || '',
        address: createFormData.address || '',
        role: createFormData.role
      };
      
      console.log('Tạo người dùng mới:', newUserData);
      await axiosClient.post('/Auth/register', newUserData);
      
      showToast('Tạo người dùng thành công!', 'success');
      setShowCreateModal(false);
      setCreateFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        fullName: '',
        phone: '',
        address: '',
        role: 'Customer'
      });
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi tạo người dùng:', err);
      if (err.response && err.response.data) {
        showToast('Không thể tạo người dùng: ' + err.response.data, 'error');
      } else {
        showToast('Không thể tạo người dùng. Vui lòng thử lại.', 'error');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Chuyển đổi trạng thái hoạt động của người dùng - Cập nhật để khớp với DTO backend
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      await axiosClient.patch(`/Users/${userId}/status`, {
        IsActive: !currentStatus
      });
      fetchUsers();
      showToast(`Người dùng đã được ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} thành công`, 'success');
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái người dùng:', err);
      if (err.response) {
        setError(`Không thể cập nhật trạng thái người dùng: ${err.response.data}`);
        showToast('Không thể cập nhật trạng thái người dùng', 'error');
      } else {
        setError('Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.');
        showToast('Không thể cập nhật trạng thái. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa người dùng
  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn vô hiệu hóa người dùng này?')) {
      try {
        setLoading(true);
        // Thay vì xóa, chúng ta sẽ vô hiệu hóa người dùng
        await axiosClient.patch(`/Users/${userId}/status`, {
          IsActive: false
        });
        fetchUsers();
        showToast('Đã vô hiệu hóa người dùng thành công', 'success');
      } catch (err) {
        console.error('Lỗi khi vô hiệu hóa người dùng:', err);
        if (err.response) {
          setError(`Không thể vô hiệu hóa người dùng: ${err.response.data}`);
          showToast('Không thể vô hiệu hóa người dùng', 'error');
        } else {
          setError('Không thể vô hiệu hóa người dùng. Vui lòng thử lại.');
          showToast('Không thể vô hiệu hóa người dùng. Vui lòng thử lại.', 'error');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Lọc người dùng dựa trên từ khóa tìm kiếm và vai trò
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Chuyển đổi tên vai trò sang tiếng Việt
  const translateRole = (role) => {
    switch(role) {
      case 'Admin': return 'Quản trị viên';
      case 'Customer': return 'Khách hàng';
      case 'Staff': return 'Nhân viên';
      default: return role;
    }
  };

  // Render role icon dựa trên vai trò
  const getRoleIcon = (role) => {
    switch(role.toLowerCase()) {
      case 'admin': return <SafetyOutlined />;
      case 'customer': return <UserOutlined />;
      case 'staff': return <TeamOutlined />;
      default: return <UserOutlined />;
    }
  };

  // Helper function để set button loading state
  const enterButtonLoading = (index) => {
    setButtonLoadings((prevLoadings) => {
      const newLoadings = { ...prevLoadings };
      newLoadings[index] = true;
      return newLoadings;
    });
  };

  const exitButtonLoading = (index) => {
    setButtonLoadings((prevLoadings) => {
      const newLoadings = { ...prevLoadings };
      newLoadings[index] = false;
      return newLoadings;
    });
  };

  // Định nghĩa columns cho Ant Design Table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Vai trò',
      key: 'role',
      dataIndex: 'role',
      render: (role) => {
        const roleColors = {
          'Admin': 'gold',
          'Customer': 'blue',
          'Staff': 'green'
        };
        return (
          <Tag color={roleColors[role] || 'default'} icon={getRoleIcon(role)}>
            {translateRole(role)}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Đang hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            loading={buttonLoadings[`edit-${record.userId}`]}
            onClick={() => {
              enterButtonLoading(`edit-${record.userId}`);
              handleEdit(record);
              setTimeout(() => exitButtonLoading(`edit-${record.userId}`), 500);
            }}
          >
            Sửa
          </Button>
          <Button
            icon={record.isActive ? <StopOutlined /> : <CheckOutlined />}
            loading={buttonLoadings[`toggle-${record.userId}`]}
            onClick={async () => {
              enterButtonLoading(`toggle-${record.userId}`);
              await toggleUserStatus(record.userId, record.isActive);
              exitButtonLoading(`toggle-${record.userId}`);
            }}
          >
            {record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={buttonLoadings[`delete-${record.userId}`]}
            onClick={async () => {
              enterButtonLoading(`delete-${record.userId}`);
              await handleDelete(record.userId);
              exitButtonLoading(`delete-${record.userId}`);
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <UserManagementContainer>
        <LoadingWrapper>
          <LoadingOutlined className="loader-icon" />
          <p>Đang tải dữ liệu người dùng...</p>
        </LoadingWrapper>
      </UserManagementContainer>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <UserManagementContainer>
        <Header>
          <h1>
            <TeamOutlined />
            Quản lý người dùng
          </h1>
          <Flex gap="small" align="center" wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(82, 196, 26, 0.4)'
              }}
            >
              Tạo người dùng
            </Button>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              loading={loading}
              onClick={fetchUsers}
            >
              Làm mới dữ liệu
            </Button>
          </Flex>
        </Header>
        
        {error && (
          <ErrorMessage>
            <ExclamationCircleOutlined />
            <div className="error-text">{error}</div>
          </ErrorMessage>
        )}
        
        <FiltersContainer>
          <SearchInput>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc tên đăng nhập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchOutlined className="search-icon" />
          </SearchInput>
          
          <RoleFilter>
            <Dropdown
              menu={{
                items: [
                  { key: '', label: 'Tất cả vai trò' },
                  { key: 'Admin', label: 'Quản trị viên' },
                  { key: 'Customer', label: 'Khách hàng' },
                  { key: 'Staff', label: 'Nhân viên' },
                ],
                onClick: ({ key }) => setFilterRole(key),
              }}
            >
              <a onClick={e => e.preventDefault()}>
                <Space>
                  {filterRole === ''
                    ? 'Tất cả vai trò'
                    : filterRole === 'Admin'
                      ? 'Quản trị viên'
                      : filterRole === 'Customer'
                        ? 'Khách hàng'
                        : 'Nhân viên'}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
          </RoleFilter>
        </FiltersContainer>

        <AnimatePresence>
          {editMode && currentUser && (
            <EditFormOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EditForm
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30 
                }}
              >
                <button className="close-button" onClick={handleCancel}>
                  <CloseOutlined />
                </button>
                <h2>
                  Chỉnh sửa người dùng
                  <span className="username-badge">{currentUser.username}</span>
                </h2>
                <FormGrid>
                  <div className="form-group">
                    <label>
                      <UserOutlined /> Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <MailOutlined /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <UserOutlined /> Họ và tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <PhoneOutlined /> Điện thoại
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>
                      <HomeOutlined /> Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <SafetyOutlined /> Vai trò
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="Customer">Khách hàng</option>
                      <option value="Admin">Quản trị viên</option>
                      <option value="Staff">Nhân viên</option>
                    </select>
                  </div>
                  
                  <div className="form-group checkbox">
                    <Flex align="center">
                      <Checkbox
                        name="isActive"
                        checked={formData.isActive}
                        styles={checkboxStyles}
                        onChange={(e) =>
                          handleChange({
                            target: {
                              name: 'isActive',
                              type: 'checkbox',
                              checked: e.target.checked,
                            },
                          })
                        }
                      >
                        Đang hoạt động
                      </Checkbox>
                    </Flex>
                  </div>
                </FormGrid>
                
                <FormActions>
                  <Button onClick={handleCancel} icon={<CloseOutlined />}>
                    Hủy bỏ
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={loading}
                    onClick={handleSave}
                    style={{
                      background: 'linear-gradient(135deg, #4318FF, #868CFF)',
                      border: 'none'
                    }}
                  >
                    Lưu thay đổi
                  </Button>
                </FormActions>
              </EditForm>
            </EditFormOverlay>
          )}
        </AnimatePresence>

        {filteredUsers.length === 0 && !loading ? (
          <EmptyStateCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="icon-container">
              <TeamOutlined className="icon" />
            </div>
            <h3>Không tìm thấy người dùng nào</h3>
            <p>
              {searchTerm || filterRole 
                ? 'Không tìm thấy người dùng nào khớp với bộ lọc của bạn. Vui lòng thử các tiêu chí tìm kiếm khác.'
                : 'Hiện chưa có người dùng nào trong hệ thống. Hãy thêm người dùng mới để bắt đầu.'}
            </p>
            {(searchTerm || filterRole) && (
              <button 
                className="empty-button" 
                onClick={() => {setSearchTerm(''); setFilterRole('');}}>
                <FilterOutlined /> Xóa bộ lọc
              </button>
            )}
          </EmptyStateCard>
        ) : (
          <TableContainer>
            <Table
              columns={columns}
              dataSource={filteredUsers.map(user => ({ ...user, key: user.userId }))}
              loading={loading}
              onRow={(record) => ({
                onClick: () => openDetailDrawer(record),
                style: { cursor: 'pointer' },
              })}
              pagination={{
                placement: [topPagination, bottomPagination],
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
              }}
              rowClassName={(record) => !record.isActive ? 'inactive-user' : ''}
            />
          </TableContainer>
        )}

        <Drawer
          width={720}
          placement="right"
          onClose={closeDetailDrawer}
          open={detailOpen}
          title=""
          styles={{ body: { paddingBottom: 24, paddingTop: 8 } }}
        >
          {detailUser && (
            <>
              <p style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>User Profile</p>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}><DescriptionItem title="Họ và tên" content={detailUser.fullName || 'N/A'} /></Col>
                <Col span={12}><DescriptionItem title="Tài khoản" content={detailUser.username || 'N/A'} /></Col>
              </Row>

              <Tabs
                activeKey={detailTabKey}
                onChange={setDetailTabKey}
                items={[
                  {
                    key: '1',
                    label: 'Thông tin',
                    children: detailLoading ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
                    ) : (
                      <>
                        <Row gutter={16}>
                          <Col span={12}><DescriptionItem title="Email" content={detailUser.email || 'N/A'} /></Col>
                          <Col span={12}><DescriptionItem title="Điện thoại" content={detailUser.phone || 'N/A'} /></Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={24}><DescriptionItem title="Địa chỉ" content={detailUser.address || 'N/A'} /></Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}><DescriptionItem title="Vai trò" content={translateRole(detailUser.role || '')} /></Col>
                          <Col span={12}><DescriptionItem title="Trạng thái" content={detailUser.isActive ? 'Đang hoạt động' : 'Không hoạt động'} /></Col>
                        </Row>
                      </>
                    ),
                  },
                  {
                    key: '2',
                    label: `Lịch hẹn (${detailAppointments.length})`,
                    children: detailLoading ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
                    ) : detailAppointments.length === 0 ? (
                      <Empty description="Chưa có lịch hẹn" />
                    ) : (
                      <>
                        <Row gutter={16} style={{ marginBottom: 12 }}>
                          <Col span={8}><DescriptionItem title="Tổng lịch hẹn" content={detailAppointments.length} /></Col>
                          <Col span={8}><DescriptionItem title="Hoàn thành" content={detailAppointments.filter((a) => (a.status || '').toLowerCase() === 'completed').length} /></Col>
                          <Col span={8}><DescriptionItem title="Đã hủy" content={detailAppointments.filter((a) => (a.status || '').toLowerCase() === 'cancelled').length} /></Col>
                        </Row>

                        <Divider style={{ margin: '10px 0 14px' }} />

                        <Table
                          size="small"
                          rowSelection={{
                            type: 'checkbox',
                            onChange: (selectedRowKeys, selectedRows) => {
                              console.log('selectedRowKeys:', selectedRowKeys, 'selectedRows:', selectedRows);
                            },
                          }}
                          columns={[
                            {
                              title: 'Mã lịch',
                              dataIndex: 'appointmentId',
                              key: 'appointmentId',
                              width: 90,
                              render: (value) => `#${value || 'N/A'}`,
                            },
                            {
                              title: 'Dịch vụ',
                              dataIndex: 'serviceName',
                              key: 'serviceName',
                              render: (text) => <a>{text || 'N/A'}</a>,
                            },
                            {
                              title: 'Trạng thái',
                              dataIndex: 'status',
                              key: 'status',
                              render: (status) => {
                                const s = (status || '').toLowerCase();
                                const color = s === 'completed' ? 'success' : s === 'cancelled' ? 'error' : 'processing';
                                const label = s === 'completed' ? 'Hoàn thành' : s === 'cancelled' ? 'Đã hủy' : status || 'Chờ xử lý';
                                return <Tag color={color}>{label}</Tag>;
                              },
                            },
                            {
                              title: 'Ngày hẹn',
                              dataIndex: 'appointmentDate',
                              key: 'appointmentDate',
                              render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
                            },
                            {
                              title: 'Giờ',
                              key: 'timeSlot',
                              render: (_, record) => {
                                const directTime = record.timeSlot || record.appointmentTime || record.startTimeString;
                                if (directTime) return directTime;

                                if (record.appointmentDate) {
                                  const d = new Date(record.appointmentDate);
                                  if (!Number.isNaN(d.getTime())) {
                                    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                  }
                                }

                                return 'N/A';
                              },
                            },
                            {
                              title: 'Ghi chú',
                              dataIndex: 'notes',
                              key: 'notes',
                              render: (notes) => notes || '-',
                            },
                          ]}
                          dataSource={detailAppointments.map((appt) => ({ ...appt, key: appt.appointmentId || `${appt.serviceName}-${appt.timeSlot}` }))}
                          pagination={{ pageSize: 6, showSizeChanger: false }}
                        />
                      </>
                    ),
                  },
                  {
                    key: '3',
                    label: `Thú cưng (${detailPets.length})`,
                    children: detailLoading ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
                    ) : detailPets.length === 0 ? (
                      <Empty description="Chưa có thú cưng" />
                    ) : (
                      <Table
                        size="small"
                        rowSelection={{
                          type: 'checkbox',
                          onChange: (selectedRowKeys, selectedRows) => {
                            console.log('selectedPetKeys:', selectedRowKeys, 'selectedPets:', selectedRows);
                          },
                        }}
                        columns={[
                          {
                            title: 'Mã thú cưng',
                            dataIndex: 'petId',
                            key: 'petId',
                            width: 110,
                            render: (value) => `#${value || 'N/A'}`,
                          },
                          {
                            title: 'Tên thú cưng',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text) => <a>{text || 'Không tên'}</a>,
                          },
                          {
                            title: 'Loài',
                            dataIndex: 'species',
                            key: 'species',
                            render: (value) => value || 'N/A',
                          },
                          {
                            title: 'Giống',
                            dataIndex: 'breed',
                            key: 'breed',
                            render: (value) => value || 'N/A',
                          },
                          {
                            title: 'Tuổi',
                            key: 'age',
                            width: 90,
                            render: (_, record) => {
                              if (record.age !== undefined && record.age !== null) return record.age;

                              const dob = record.dateOfBirth || record.DateOfBirth || record.birthdate;
                              if (dob) {
                                const birthDate = new Date(dob);
                                if (!Number.isNaN(birthDate.getTime())) {
                                  const now = new Date();
                                  let age = now.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = now.getMonth() - birthDate.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
                                    age -= 1;
                                  }
                                  return age >= 0 ? age : 'N/A';
                                }
                              }

                              return 'N/A';
                            },
                          },
                          {
                            title: 'Giới tính',
                            dataIndex: 'gender',
                            key: 'gender',
                            render: (value) => value || 'N/A',
                          },
                        ]}
                        dataSource={detailPets.map((pet) => ({ ...pet, key: pet.petId || pet.id || pet.name }))}
                        pagination={{ pageSize: 6, showSizeChanger: false }}
                      />
                    ),
                  },
                ]}
              />
            </>
          )}
        </Drawer>

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
                  onClose={closeToast}
                />
              </motion.div>
            </ToastContainer>
          )}
        </AnimatePresence>
      </UserManagementContainer>
      
      {/* Modal tạo người dùng mới */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <h2 style={{ margin: 0, color: '#52c41a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PlusOutlined /> Tạo người dùng mới
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    email: '',
                    fullName: '',
                    phone: '',
                    address: '',
                    role: 'Customer'
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '16px' }}>
                  Thông tin tài khoản
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Tên đăng nhập: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    placeholder="Nhập tên đăng nhập"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Mật khẩu: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Xác nhận mật khẩu: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={createFormData.confirmPassword}
                    onChange={(e) => setCreateFormData({ ...createFormData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '16px' }}>
                  Thông tin cá nhân
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Họ và tên: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Email: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="Nhập địa chỉ email"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Số điện thoại:
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Địa chỉ:
                  </label>
                  <textarea
                    value={createFormData.address}
                    onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                    placeholder="Nhập địa chỉ"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Vai trò: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Customer">Khách hàng</option>
                    <option value="Staff">Nhân viên</option>
                    <option value="Admin">Quản trị viên</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <Flex gap="small" justify="flex-end">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      username: '',
                      password: '',
                      confirmPassword: '',
                      email: '',
                      fullName: '',
                      phone: '',
                      address: '',
                      role: 'Customer'
                    });
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  icon={createLoading ? <SyncOutlined spin /> : <CheckOutlined />}
                  loading={createLoading}
                  onClick={handleCreateUser}
                  style={{
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    border: 'none'
                  }}
                >
                  {createLoading ? 'Đang tạo...' : 'Tạo người dùng'}
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal và các thành phần khác */}
    </div>
  );
};

export default UserManagement;