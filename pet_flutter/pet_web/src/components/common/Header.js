import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import cartService from '../../services/cartService';
import { BASE_URL } from '../../config/api';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';

import { 
  Layout, 
  Menu, 
  Button, 
  Drawer, 
  Avatar, 
  Badge, 
  Dropdown, 
  Space, 
  Divider, 
  Typography,
  Tooltip,
  Tag,
  ConfigProvider,
  theme
} from 'antd';
import { HappyProvider } from '@ant-design/happy-work-theme';

import { 
  HomeOutlined, 
  ShoppingOutlined, 
  MedicineBoxOutlined, 
  ReadOutlined, 
  ContactsOutlined, 
  MenuOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  CloseOutlined, 
  RightOutlined,
  CrownOutlined,
  SettingOutlined,
  DownOutlined,
  TeamOutlined,
  FileTextOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';

// Custom Pet Icon since Ant Design doesn't have one
const PetIcon = props => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M4.5,9.5c0,0.8,0.7,1.5,1.5,1.5S7.5,10.3,7.5,9.5S6.8,8,6,8S4.5,8.7,4.5,9.5z M9,6c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1 S9.6,6,9,6z M13,6c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S13.6,6,13,6z M16.5,8c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5 s1.5-0.7,1.5-1.5S17.3,8,16.5,8z M19.5,10c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S20.3,10,19.5,10z M18.5,13 c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5s1.5-0.7,1.5-1.5S19.3,13,18.5,13z M16,16c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1 S16.6,16,16,16z M12,16c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S12.6,16,12,16z M14.5,11c0,1.4-1.1,2.5-2.5,2.5S9.5,12.4,9.5,11 c0-0.3,0-0.5,0.1-0.7c-0.2,0.2-0.3,0.4-0.3,0.7c0,0.6,0.4,1,1,1s1-0.4,1-1c0-0.1,0-0.3-0.1-0.4c0.2,0.3,0.5,0.4,0.8,0.4 c0.3,0,0.5-0.1,0.7-0.3c0,0,0,0,0,0c0.5,0,0.9-0.2,1.3-0.4C14.3,10.3,14.5,10.6,14.5,11z M8,16c-0.6,0-1,0.4-1,1s0.4,1,1,1 s1-0.4,1-1S8.6,16,8,16z M4.5,13c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5S6,15.3,6,14.5S5.3,13,4.5,13z M3,10 c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S3.6,10,3,10z"></path>
  </svg>
);

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;
const { useToken } = theme;

// Animations have been removed for a simpler, cleaner design

// Styled components
const LogoWrapper = styled.div`
  background: transparent;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const LogoTitle = styled(Title)`
  margin: 0 !important;
  font-weight: 700 !important;
  color: ${props => props.theme.colorPrimary} !important;
  letter-spacing: 0.5px !important;
`;

const StyledBadge = styled(Badge)`
  .ant-badge-count {
    box-shadow: 0 0 0 2px #fff;
    padding: 0 6px;
    height: 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 12px;
  }
`;

const GlowButton = styled(Button)`
  &.ant-btn-primary {
    font-weight: 500;
  }
`;

const UserAvatar = styled(Avatar)`
  background: ${props => props.theme.colorPrimary};
  font-size: 14px;
  font-weight: 500;
`;

const UserDropdownWrapper = styled.div`
  cursor: pointer;
  padding: 4px 8px 4px 10px;
  border-radius: 40px;
  border: 1px solid ${props => props.theme.colorBorder};
  background-color: ${props => props.theme.colorBgContainer};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colorPrimary};
    background-color: ${props => props.theme.colorBgTextHover};
  }
  
  .user-name {
    transition: all 0.2s;
  }
  
  &:hover .user-name {
    color: ${props => props.theme.colorPrimary};
  }
`;

const CartButton = styled(Button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${props => props.theme.colorText};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colorBgTextHover};
    color: ${props => props.theme.colorPrimary};
  }
  
  .anticon {
    font-size: 20px;
  }
`;

// Tạo một styled component riêng cho CSS global
const GlobalStyle = styled.div`
  .user-dropdown-menu {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Cải thiện responsive cho màn hình tablet/mobile */
  @media (max-width: 992px) {
    .desktop-menu {
      display: none;
    }
    .mobile-menu-button {
      display: block !important;
    }
    .user-name {
      display: none !important;
    }
    .user-name {
      display: none !important;
    }
  }
  .app-header {
    background: #fff !important;
    transition: box-shadow 0.3s ease !important;
  }
  
  .app-header.scrolled {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  }
`;

const Header = () => {
  const { token } = useToken();
  const auth = useAuth();
  const [user, setUser] = useState(null);
  const logout = auth?.logout;
  const [cartItemCount, setCartItemCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State to track current active path
  const [activePath, setActivePath] = useState('/');
  
  // State for scroll position to add shadow effect
  const [scrolled, setScrolled] = useState(false);
  
  // Định nghĩa handleUserUpdate ở đây, bên ngoài các useEffect
  const handleUserUpdate = () => {
    // Đảm bảo đọc dữ liệu mới nhất từ localStorage khi có sự kiện userProfileUpdated
    console.log('User profile updated event received in Header');
    
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        console.log('Updated user from localStorage:', storedUser);
        console.log('Avatar from localStorage:', storedUser.avatar);
        
        // Force re-render bằng cách tạo object mới
        setUser({...storedUser});
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };
  
  // Listen for changes from localStorage and auth
  useEffect(() => {
    const updateUserData = () => {
      if (auth?.user) {
        setUser(auth.user);
        return;
      }
      
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    updateUserData();
    
    const handleStorageChange = () => {
      updateUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Add scroll listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [auth?.user]);
  
  // Tách riêng useEffect cho sự kiện userProfileUpdated
  useEffect(() => {
    window.addEventListener('userProfileUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleUserUpdate);
    };
  }, []);  // Empty dependency array to ensure it only runs once
  
  // Update active path when location changes
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  // Load cart count for authenticated users
  useEffect(() => {
    const loadCartCount = async () => {
      if (user) {
        try {
          const count = await cartService.getCartItemCount();
          setCartItemCount(count);
        } catch (error) {
          console.error('Error loading cart count:', error);
          setCartItemCount(0);
        }
      } else {
        setCartItemCount(0);
      }
    };

    loadCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (user) {
        loadCartCount();
      }
    };

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [user?.userId]);
  
  // Handle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle logout
  const handleLogout = () => {
    if (logout) {
      setUser(null);
      logout();
      navigate('/');
    }
  };
  
  // Check if in admin section
  const isInAdminSection = location.pathname.startsWith('/admin');
  
  // Check if user is admin
  const isAdmin = user && user.role === 'Admin';
  
  // Don't show header for Admin when in Admin section
  if (isAdmin && isInAdminSection) {
    return null;
  }
  
  // Menu items
  const menuItems = [
    { label: 'Trang chủ', path: '/', icon: <HomeOutlined /> },
    { label: 'Sản phẩm', path: '/products', icon: <ShoppingOutlined /> },
    { label: 'Dịch vụ', path: '/services', icon: <MedicineBoxOutlined /> },
    { label: 'Blog', path: '/blog', icon: <ReadOutlined /> },
    { label: 'Liên hệ', path: '/contact', icon: <ContactsOutlined /> }
  ];
  
  // User menu items
  const userMenuItems = [
    ...(isAdmin ? [{ key: 'admin', label: 'Quản trị', path: '/admin', icon: <CrownOutlined style={{ color: token.colorPrimary }} /> }] : []),
    { key: 'profile', label: 'Hồ sơ', path: '/profile', icon: <UserOutlined style={{ color: token.colorPrimary }} /> },
    { key: 'pets', label: 'Thú cưng', path: '/pets', icon: <PetIcon style={{ color: token.colorSuccess }} /> },
    { key: 'orders', label: 'Đơn hàng', path: '/orders', icon: <ShoppingOutlined style={{ color: token.colorWarning }} /> },
    { key: 'appointments', label: 'Lịch hẹn', path: '/appointments', icon: <CalendarOutlined style={{ color: token.colorInfo }} /> },
    { 
      key: 'divider', 
      type: 'divider' 
    },
    { 
      key: 'logout', 
      danger: true,
      label: (
        <Space>
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </Space>
      )
    }
  ];

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Check if path is active
  const isActive = (path) => {
    return activePath === path || 
      (path !== '/' && activePath.startsWith(path));
  };
  
  // Handle user menu click
  const handleUserMenuClick = (e) => {
    if (e.key === 'logout') {
      handleLogout();
    }
  };
  
  // Create user menu dropdown items
  const userDropdownItems = {
    items: userMenuItems.map(item => {
      if (item.type === 'divider') {
        return {
          type: 'divider'
        };
      }
      return {
        key: item.key,
        danger: item.danger || false,
        label: item.path ? (
          <Link to={item.path}>
            <Space>
              {item.icon}
              <span>{item.label}</span>
            </Space>
          </Link>
        ) : (
          item.label
        )
      };
    }),
    onClick: handleUserMenuClick
  };
  
  // Get user avatar URL
  const getUserAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    
    // URL tương đối (từ server)
    return `${BASE_URL}${avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath}`;
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            horizontalItemSelectedColor: token.colorPrimary,
            horizontalItemHoverColor: token.colorPrimary,
            itemSelectedColor: token.colorPrimary,
            itemHoverColor: token.colorPrimary,
          },
        },
      }}
    >
      <GlobalStyle />
      <AntHeader
        className={`app-header ${scrolled ? 'scrolled' : ''}`}
        style={{
          background: 'white',
          padding: '0',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: scrolled 
            ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          borderBottom: `1px solid ${token.colorBorderDivider}`,
          height: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            height: 72,
          }}
        >
          {/* Mobile Menu Button */}
          <div className="mobile-menu-button" style={{ display: 'none' }}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: '20px' }} />}
              onClick={toggleDrawer}
              style={{ color: token.colorPrimary }}
            />
          </div>
          
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: '0 0 auto'
            }}
          >
            <LogoWrapper theme={token}>
              <img 
                src="/animal-care.png" 
                alt="Pet Web Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  borderRadius: '12px'
                }} 
              />
            </LogoWrapper>
            
            <Link to="/" style={{ textDecoration: 'none' }}>
              <LogoTitle
                level={4}
                theme={token}
              >
                Pet Web
              </LogoTitle>
            </Link>
            
            {isAdmin && (
              <Tag 
                color={token.colorPrimaryActive} 
                style={{ 
                  marginLeft: 10, 
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Admin
              </Tag>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <div className="desktop-menu" style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', justifyContent: 'flex-start', padding: '0 32px' }}>
            <Menu 
              mode="horizontal" 
              selectedKeys={menuItems.filter(item => isActive(item.path)).map(item => item.path)}
              style={{ 
                border: 'none', 
                backgroundColor: 'transparent',
                fontWeight: 500,
                fontSize: '15px',
                width: '100%',
                justifyContent: 'flex-start'
              }}
              items={
                menuItems.map(item => ({
                  key: item.path,
                  label: (
                    <Link to={item.path}>
                      {item.label}
                    </Link>
                  )
                }))
              }
            />
          </div>
          
          {/* Right Section (Cart & User) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: '0 0 auto'
            }}
          >
            {/* Cart */}
            <Tooltip title="Giỏ hàng" placement="bottom">
              <a onClick={(e) => { e.preventDefault(); navigate('/cart'); }} style={{ display: 'flex', alignItems: 'center' }}>
                <Badge count={cartItemCount || 0}>
                  <Avatar 
                    shape="square" 
                    size="large" 
                    icon={<ShoppingCartOutlined />} 
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: token.colorText,
                      fontSize: '22px'
                    }} 
                  />
                </Badge>
              </a>
            </Tooltip>
            
            {/* User section */}
            {user ? (
              <Dropdown 
                menu={userDropdownItems} 
                placement="bottomRight"
                trigger={['click']}
              >
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <UserAvatar
                    size={32}
                    src={getUserAvatarUrl(user.avatar)}
                    theme={token}
                  >
                    {!user.avatar && getInitials(user.fullName || user.username)}
                  </UserAvatar>
                </div>
              </Dropdown>
            ) : (
              <Space size={16}>
                <HappyProvider>
                  <Button onClick={() => navigate('/login')}>
                    Đăng nhập
                  </Button>
                </HappyProvider>
                <HappyProvider>
                  <Button
                    type="primary"
                    onClick={() => navigate('/register')}
                  >
                    Đăng ký
                  </Button>
                </HappyProvider>
              </Space>
            )}
          </div>
        </div>
        
        {/* Mobile Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  background: 'transparent',
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img 
                  src="/animal-care.png" 
                  alt="Pet Web Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    borderRadius: '12px'
                  }} 
                />
              </div>
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                Pet Web
              </Title>
            </div>
          }
          placement="left"
          onClose={toggleDrawer}
          open={drawerOpen}
          width={280}
          closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
          headerStyle={{ borderBottom: `1px solid ${token.colorBorderDivider}` }}
          bodyStyle={{ padding: 0 }}
        >
          {user && (
            <div
              style={{
                padding: '16px 20px',
                textAlign: 'center',
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderDivider}`,
              }}
            >
              <Avatar
                size={64}
                src={getUserAvatarUrl(user.avatar)}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: 24,
                  fontWeight: 500,
                  margin: '0 auto 12px',
                }}
              >
                {!user.avatar && getInitials(user.fullName || user.username)}
              </Avatar>
              <Title level={5} style={{ margin: '0 0 4px', fontWeight: 600 }}>
                {user.fullName || user.username}
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {user.email}
              </Text>
              {isAdmin && (
                <div style={{ marginTop: 8 }}>
                  <Tag 
                    color={token.colorPrimaryActive}
                    icon={<CrownOutlined />}
                    style={{ 
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Quản trị viên
                  </Tag>
                </div>
              )}
            </div>
          )}
          
          <div style={{ padding: '12px 0' }}>
            <Text 
              type="secondary" 
              style={{ 
                padding: '0 24px', 
                fontSize: 12, 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: 8
              }}
            >
              Trang chính
            </Text>
            
            <Menu
              mode="inline"
              selectedKeys={[...menuItems.filter(item => isActive(item.path)).map(item => item.path), isActive('/cart') && '/cart']}
              style={{ 
                border: 'none', 
                backgroundColor: 'transparent'
              }}
              items={[
                ...menuItems.map(item => ({
                  key: item.path,
                  icon: item.icon,
                  label: (
                    <Link to={item.path} onClick={toggleDrawer}>
                      {item.label}
                    </Link>
                  )
                })),
                {
                  key: '/cart',
                  icon: (
                    <Badge count={cartItemCount || 0} size="small" offset={[0, 0]}>
                      <ShoppingCartOutlined />
                    </Badge>
                  ),
                  label: (
                    <Link to="/cart" onClick={toggleDrawer}>
                      Giỏ hàng
                    </Link>
                  )
                }
              ]}
            />
            
            {user && (
              <div style={{ marginTop: 16 }}>
                <Divider style={{ margin: '12px 0' }} />
                
                <Text 
                  type="secondary" 
                  style={{ 
                    padding: '0 24px', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: 8,
                    marginTop: 16
                  }}
                >
                  Tài khoản
                </Text>
                
                <Menu
                  mode="inline"
                  selectedKeys={[...userMenuItems.filter(item => item.path && isActive(item.path)).map(item => item.key)]}
                  style={{ 
                    border: 'none', 
                    backgroundColor: 'transparent'
                  }}
                  items={
                    userMenuItems
                      .filter(item => item.type !== 'divider' && item.key !== 'logout')
                      .map(item => ({
                        key: item.key,
                        icon: item.icon,
                        label: (
                          <Link to={item.path} onClick={toggleDrawer}>
                            {item.label}
                          </Link>
                        )
                      }))
                  }
                />
              </div>
            )}
          </div>
          
          <div 
            style={{ 
              padding: '16px 20px',
              borderTop: `1px solid ${token.colorBorderDivider}`,
              position: 'absolute',
              bottom: 0,
              width: '100%',
              background: token.colorBgContainer
            }}
          >
            {user ? (
              <Button 
                type="primary" 
                danger 
                block 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                shape="round"
                size="large"
              >
                Đăng xuất
              </Button>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <HappyProvider>
                  <Button 
                    block
                    size="large"
                    onClick={() => {
                      navigate('/login');
                      toggleDrawer();
                    }}
                  >
                    Đăng nhập
                  </Button>
                </HappyProvider>
                <HappyProvider>
                  <Button 
                    type="primary"
                    block 
                    size="large"
                    onClick={() => {
                      navigate('/register');
                      toggleDrawer();
                    }}
                  >
                    Đăng ký
                  </Button>
                </HappyProvider>
              </Space>
            )}
          </div>
        </Drawer>
      </AntHeader>
    </ConfigProvider>
  );
};

export default Header;