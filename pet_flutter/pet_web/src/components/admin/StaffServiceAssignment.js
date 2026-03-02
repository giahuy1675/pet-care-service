import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HappyProvider } from '@ant-design/happy-work-theme';
import { CheckOutlined, CloseOutlined, UserOutlined, ToolOutlined, LoadingOutlined, PlusOutlined, MinusOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { Button, Card, ConfigProvider, Input, Modal, Space, Table } from 'antd';
import staffService from '../../services/staffService';
import serviceService from '../../services/serviceService';

const themeToken = {
  colorPrimary: '#304FFE',
  borderRadius: 12,
};

const Select = ({ value, onChange, children, className, placeholder }) => (
  <select 
    value={value} 
    onChange={onChange} 
    className={`form-control ${className}`}
  >
    <option value="" disabled>{placeholder}</option>
    {children}
  </select>
);

const Toast = ({ show, message, type, onClose }) => {
  if (!show) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span>{message}</span>
        <button onClick={onClose} className="toast-close">×</button>
      </div>
    </div>
  );
};

const StaffServiceAssignment = () => {
  const navigate = useNavigate();
  const [modal, modalContextHolder] = Modal.useModal();
  const [staffList, setStaffList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Tìm ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Xóa
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Lọc
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Đóng
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#304FFE' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const staff = await staffService.getAllStaff();
      setStaffList(staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('Lỗi khi lấy danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch services list
  const fetchServices = async () => {
    try {
      const services = await serviceService.getAllServices();
      setServiceList(services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Lỗi khi lấy danh sách dịch vụ', 'error');
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  // Get selected staff data
  const getSelectedStaffData = () => {
    return staffList.find(staff => staff.staffId?.toString() === selectedStaff);
  };

  // Check if staff has a service
  const hasService = (serviceId) => {
    const staffData = getSelectedStaffData();
    if (!staffData || !staffData.services) return false;
    return staffData.services.some(service => service.serviceId === serviceId);
  };

  // Assign service to staff
  const assignService = async (serviceId) => {
    if (!selectedStaff) {
      showToast('Vui lòng chọn nhân viên', 'error');
      return;
    }

    try {
      setAssignLoading(prev => ({ ...prev, [serviceId]: true }));
      await staffService.assignServiceToStaff(selectedStaff, serviceId);
      showToast('Gán dịch vụ thành công!', 'success');
      
      // Refresh staff data
      await fetchStaff();
    } catch (error) {
      console.error('Error assigning service:', error);
      const msg = typeof error === 'string' ? error : (error?.message || 'Lỗi khi gán dịch vụ cho nhân viên');
      showToast(msg, 'error');
    } finally {
      setAssignLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  // Remove service from staff
  const removeService = async (serviceId) => {
    if (!selectedStaff) {
      showToast('Vui lòng chọn nhân viên', 'error');
      return;
    }

    try {
      setAssignLoading(prev => ({ ...prev, [serviceId]: true }));
      await staffService.removeServiceFromStaff(selectedStaff, serviceId);
      showToast('Bỏ gán dịch vụ thành công!', 'success');
      
      // Refresh staff data
      await fetchStaff();
    } catch (error) {
      console.error('Error removing service:', error);
      const msg = typeof error === 'string' ? error : (error?.message || 'Lỗi khi bỏ gán dịch vụ khỏi nhân viên');
      const hasActiveAppointments = typeof msg === 'string' && msg.includes('lịch hẹn hoạt động');
      if (hasActiveAppointments) {
        modal.confirm({
          title: 'Không thể bỏ gán dịch vụ',
          width: 520,
          content: (
            <div>
              <p style={{ marginBottom: 12 }}>{msg}</p>
              <p style={{ color: '#707EAE', fontSize: 13 }}>
                <strong>Lý do:</strong> Nhân viên này đang có lịch hẹn chưa hoàn thành (Đã đặt lịch, Đã xác nhận...) với dịch vụ này.
              </p>
              <p style={{ color: '#707EAE', fontSize: 13, marginTop: 8 }}>
                <strong>Cách xử lý:</strong> Vào <strong>Quản lý lịch hẹn</strong> để hoàn thành hoặc hủy các lịch hẹn đó trước, sau đó mới bỏ gán được.
              </p>
            </div>
          ),
          okText: 'Đến Quản lý lịch hẹn',
          cancelText: 'Đóng',
          okButtonProps: { icon: <CalendarOutlined /> },
          onOk: () => navigate('/admin', { state: { openTab: 'appointments' } }),
        });
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setAssignLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  // Group services by category
  const groupedServices = serviceList.reduce((acc, service) => {
    const category = service.category || 'Khác';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  const selectedStaffData = getSelectedStaffData();

  return (
    <ConfigProvider theme={{ token: themeToken }}>
    <div className="staff-service-assignment">
      {modalContextHolder}
      <style jsx>{`
        .staff-service-assignment {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        .assignment-header {
          background: white;
          padding: 24px 28px;
          border-radius: 20px;
          margin-bottom: 24px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .assignment-header h1 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          color: #2B3674;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assignment-header h1 .header-icon {
          color: #304FFE;
          font-size: 1.2rem;
        }

        .assignment-header p {
          margin: 8px 0 0 34px;
          color: #707EAE;
          font-size: 14px;
        }

        .staff-table {
          margin-bottom: 24px;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .staff-table :global(.ant-table-thead > tr > th) {
          background: #F4F7FE !important;
          font-weight: 600;
          color: #2B3674;
          border-bottom: 2px solid #e1e5ef;
        }

        .staff-table :global(.ant-table-tbody > tr > td) {
          color: #707EAE;
        }

        .staff-table :global(.selected-row) {
          background: rgba(48, 79, 254, 0.08) !important;
        }

        .staff-table :global(.ant-table-tbody > tr) {
          cursor: pointer;
        }

        .staff-table :global(.ant-table-tbody > tr:hover) {
          background: #f8faff !important;
        }

        .staff-selector {
          margin-bottom: 30px;
        }

        .staff-selector label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: #2B3674;
        }

        .form-control {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #e1e5ef;
          border-radius: 12px;
          font-size: 14px;
          color: #2B3674;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: #304FFE;
          box-shadow: 0 0 0 3px rgba(48, 79, 254, 0.1);
        }

        .staff-info {
          background: white;
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          border-left: 4px solid #304FFE;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .staff-info h3 {
          margin: 0 0 10px 0;
          color: #2B3674;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .staff-info p {
          margin: 5px 0;
          color: #707EAE;
        }

        .current-services {
          margin-top: 15px;
        }

        .service-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .service-tag {
          background: #F4F7FE;
          color: #304FFE;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .services-grid {
          display: grid;
          gap: 24px;
        }

        .category-section {
          background: white;
          border-radius: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .category-header {
          background: #F4F7FE;
          color: #2B3674;
          padding: 16px 24px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #e1e5ef;
          border-left: 4px solid #304FFE;
        }

        .category-header .cat-icon {
          color: #304FFE;
          font-size: 16px;
        }

        .category-services {
          padding: 24px;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .service-item {
          border: 1px solid #e1e5ef;
          border-radius: 12px;
          padding: 15px;
          transition: all 0.3s ease;
          position: relative;
        }

        .service-item:hover {
          border-color: #304FFE;
          box-shadow: 0 4px 12px rgba(48, 79, 254, 0.1);
        }

        .service-item.assigned {
          border-color: #52c41a;
          background: #f6ffed;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .service-name {
          font-weight: 600;
          color: #2B3674;
          margin: 0;
        }

        .service-details {
          font-size: 14px;
          color: #707EAE;
          margin: 5px 0;
        }

        .service-price {
          font-weight: 600;
          color: #2B3674;
          font-size: 16px;
        }

        .service-actions {
          margin-top: 15px;
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn.primary {
          background: #304FFE;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #2541e8;
          box-shadow: 0 4px 12px rgba(48, 79, 254, 0.3);
        }

        .btn.danger {
          background: #ff4d4f;
          color: white;
        }

        .btn.danger:hover:not(:disabled) {
          background: #ff7875;
          box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
        }

        .loading-state {
          text-align: center;
          padding: 60px 40px;
          color: #707EAE;
          background: white;
          border-radius: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .no-selection {
          text-align: center;
          padding: 60px 40px;
          color: #707EAE;
          background: white;
          border-radius: 20px;
          border: 2px dashed #e1e5ef;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .no-selection h3 {
          color: #2B3674;
          margin-bottom: 8px;
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          padding: 15px 20px;
          border-radius: 12px;
          color: white;
          font-weight: 500;
          max-width: 400px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }

        .toast-success {
          background: #52c41a;
        }

        .toast-error {
          background: #ff4d4f;
        }

        .toast-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toast-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 40px;
          color: #707EAE;
          background: white;
          border-radius: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-assigned {
          background: #f6ffed;
          color: #52c41a;
        }

        .status-available {
          background: #F4F7FE;
          color: #707EAE;
        }
      `}</style>

      <div className="assignment-header">
        <h1>
          <ToolOutlined className="header-icon" /> Gán Dịch Vụ Cho Nhân Viên
        </h1>
        <p>Quản lý việc gán dịch vụ cho từng nhân viên</p>
      </div>

      <div className="staff-table">
        <Table
          columns={[
            {
              title: 'Họ và tên',
              dataIndex: 'fullName',
              key: 'fullName',
              width: '30%',
              ...getColumnSearchProps('fullName'),
            },
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
              width: '30%',
              ...getColumnSearchProps('email'),
            },
            {
              title: 'Chuyên môn',
              dataIndex: 'specialization',
              key: 'specialization',
              width: '25%',
              ...getColumnSearchProps('specialization'),
            },
            {
              title: 'Kinh nghiệm (năm)',
              dataIndex: 'experience',
              key: 'experience',
              sorter: (a, b) => (a.experience || 0) - (b.experience || 0),
              width: '15%',
            },
          ]}
          dataSource={staffList.map(staff => ({
            key: staff.staffId?.toString(),
            ...staff,
          }))}
          size="middle"
          pagination={{ pageSize: 5 }}
          rowKey="key"
          onRow={(record) => ({
            onClick: () => setSelectedStaff(record.key),
          })}
          rowClassName={(record) =>
            record.key === selectedStaff ? 'selected-row' : ''
          }
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <LoadingOutlined style={{ fontSize: '32px', color: '#304FFE', marginBottom: 16 }} spin />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : !selectedStaff ? (
        <div className="no-selection">
          <UserOutlined style={{ fontSize: '48px', marginBottom: '15px', color: '#304FFE', opacity: 0.6 }} />
          <h3>Chưa chọn nhân viên</h3>
          <p>Vui lòng chọn nhân viên để xem và quản lý dịch vụ</p>
        </div>
      ) : (
        <div className="services-grid">
          {Object.keys(groupedServices).length === 0 ? (
            <div className="empty-state">
              <p>Không có dịch vụ nào</p>
            </div>
          ) : (
            Object.entries(groupedServices).map(([category, services]) => (
              <div key={category} className="category-section">
                <div className="category-header">
                  <ToolOutlined className="cat-icon" />
                  {category}
                </div>
                <div className="category-services">
                  <div className="service-grid">
                    {services.map(service => {
                      const isAssigned = hasService(service.serviceId);
                      const isLoading = assignLoading[service.serviceId];

                      const badgeStyle = {
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: isAssigned ? '#f6ffed' : '#F4F7FE',
                        color: isAssigned ? '#52c41a' : '#304FFE',
                        border: isAssigned ? '1px solid rgba(82, 196, 26, 0.3)' : '1px solid rgba(48, 79, 254, 0.2)',
                      };
                      
                      return (
                        <Card
                          key={service.serviceId}
                          title={service.name}
                          extra={<span style={badgeStyle}>{isAssigned ? 'Đã gán' : 'Chưa gán'}</span>}
                          styles={{
                            root: {
                              borderRadius: 16,
                              boxShadow: isAssigned
                                ? '0 4px 12px rgba(82, 196, 26, 0.12)'
                                : '0 5px 15px rgba(0,0,0,0.05)',
                              border: isAssigned ? '1px solid rgba(82, 196, 26, 0.3)' : '1px solid #e1e5ef',
                            },
                            body: {
                              paddingTop: 12,
                            },
                            title: {
                              fontSize: 16,
                              fontWeight: 600,
                              color: '#2B3674',
                            },
                          }}
                        >
                          <p style={{ color: '#707EAE', marginBottom: 4 }}>Thời gian: {service.duration} phút</p>
                          <p style={{ fontWeight: 600, color: '#2B3674', marginBottom: 16 }}>
                            Giá: {service.price?.toLocaleString('vi-VN')} VND
                          </p>
                          {isAssigned ? (
                            <Button
                              type="primary"
                              danger
                              block
                              onClick={() => removeService(service.serviceId)}
                              disabled={isLoading}
                            >
                              {isLoading ? <LoadingOutlined /> : <MinusOutlined />}
                              {isLoading ? 'Đang bỏ gán...' : 'Bỏ gán'}
                            </Button>
                          ) : (
                            <HappyProvider>
                              <Button
                                type="primary"
                                block
                                onClick={() => assignService(service.serviceId)}
                                disabled={isLoading}
                              >
                                {isLoading ? <LoadingOutlined /> : <PlusOutlined />}
                                {isLoading ? 'Đang gán...' : 'Gán dịch vụ'}
                              </Button>
                            </HappyProvider>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
    </ConfigProvider>
  );
};

export default StaffServiceAssignment; 
