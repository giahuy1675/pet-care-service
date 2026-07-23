import React, { createContext, useContext, useCallback } from 'react';
import { notification, Button } from 'antd';
import { 
  InfoCircleOutlined,
  CheckCircleFilled,
  FireFilled,
  GiftOutlined,
  RocketOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import './notifications.css'; 

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  const showNotification = useCallback((type, message, description, duration = 6) => {
    const notificationTypes = {
      info: {
        icon: <InfoCircleOutlined className="notification-icon info-icon" />,
        className: "notification-info"
      },
      success: {
        icon: <CheckCircleFilled className="notification-icon success-icon" />,
        className: "notification-success"
      },
      promo: {
        icon: <GiftOutlined className="notification-icon promo-icon" />,
        className: "notification-promo"
      },
      special: {
        icon: <FireFilled className="notification-icon special-icon" />,
        className: "notification-special"
      },
      announcement: {
        icon: <RocketOutlined className="notification-icon announcement-icon" />,
        className: "notification-announcement"
      }
    };
    
    const config = notificationTypes[type] || notificationTypes.info;
    
    api.open({
      message,
      description,
      icon: config.icon,
      duration,
      placement: 'topRight',
      className: `animated-notification ${config.className}`,
      btn: type === 'promo' && (
        <Button type="primary" size="small" className="notification-action-btn">
          <ShoppingOutlined /> Sử dụng ngay
        </Button>
      )
    });
    
  }, [api]);

  const showSuccessNotification = useCallback((message, description) => {
    showNotification('success', message, description);
  }, [showNotification]);
  
  const showPromoNotification = useCallback((message, description) => {
    showNotification('promo', message, description, 10);
  }, [showNotification]);
  
  const showSpecialNotification = useCallback((message, description) => {
    showNotification('special', message, description, 8);
  }, [showNotification]);
  
  const showAnnouncementNotification = useCallback((message, description) => {
    showNotification('announcement', message, description, 10);
  }, [showNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        showNotification, 
        showSuccessNotification, 
        showPromoNotification,
        showSpecialNotification,
        showAnnouncementNotification
      }}
    >
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;