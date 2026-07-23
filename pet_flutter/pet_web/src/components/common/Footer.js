import React from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { 
  FacebookFilled, 
  TwitterSquareFilled, 
  InstagramFilled, 
  LinkedinFilled 
} from '@ant-design/icons';
import styled from 'styled-components';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const StyledFooter = styled(AntFooter)`
  background-color: #ffffff;
  padding: 60px 40px 20px;
  border-top: 1px solid #f0f0f0;
`;

const FooterLink = styled(Link)`
  color: #595959;
  font-size: 14px;
  display: block;
  margin-bottom: 12px;
  transition: color 0.3s;

  &:hover {
    color: #1890ff;
  }
`;

const ColumnTitle = styled(Title)`
  && {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 24px;
    color: #262626;
  }
`;

const SocialIcon = styled.a`
  color: #595959;
  font-size: 20px;
  transition: color 0.3s;

  &:hover {
    color: #1890ff;
  }
`;

const Footer = () => {
  return (
    <StyledFooter>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <ColumnTitle level={5}>Pet Web</ColumnTitle>
            <FooterLink to="/">Trang chủ</FooterLink>
            <FooterLink to="/about">Về chúng tôi</FooterLink>
            <FooterLink to="/careers">Tuyển dụng</FooterLink>
            <FooterLink to="/contact">Liên hệ</FooterLink>
            <FooterLink to="/blog">Blog</FooterLink>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <ColumnTitle level={5}>Hỗ trợ</ColumnTitle>
            <FooterLink to="/help">Trung tâm trợ giúp</FooterLink>
            <FooterLink to="/faq">Câu hỏi thường gặp</FooterLink>
            <FooterLink to="/terms">Điều khoản & Dịch vụ</FooterLink>
            <FooterLink to="/privacy">Chính sách bảo mật</FooterLink>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <ColumnTitle level={5}>Dịch vụ</ColumnTitle>
            <FooterLink to="/services">Khám sức khỏe</FooterLink>
            <FooterLink to="/services">Tắm gội & Cắt tỉa</FooterLink>
            <FooterLink to="/services">Khách sạn thú cưng</FooterLink>
            <FooterLink to="/services">Dịch vụ tại nhà</FooterLink>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <ColumnTitle level={5}>Tài nguyên</ColumnTitle>
            <FooterLink to="/resources">Cẩm nang nuôi dưỡng</FooterLink>
            <FooterLink to="/resources">Sổ tay thú y</FooterLink>
            <FooterLink to="/resources">Khuyến mãi</FooterLink>
            <FooterLink to="/resources">Cộng đồng</FooterLink>
          </Col>
        </Row>

        <Divider style={{ margin: '40px 0 20px', borderColor: '#f0f0f0' }} />

        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: '#8c8c8c' }}>
              © 2026 Pet Web. Tất cả các quyền được bảo lưu.
            </Text>
          </Col>
          <Col>
            <Space size={16}>
              <SocialIcon href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FacebookFilled />
              </SocialIcon>
              <SocialIcon href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <TwitterSquareFilled />
              </SocialIcon>
              <SocialIcon href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <InstagramFilled />
              </SocialIcon>
              <SocialIcon href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <LinkedinFilled />
              </SocialIcon>
            </Space>
          </Col>
        </Row>
      </div>
    </StyledFooter>
  );
};

export default Footer;