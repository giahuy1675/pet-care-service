import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Typography, Row, Col, Card, Button, Space, Avatar, Spin, Empty, Tag, Layout } from 'antd';
import CustomSpinner from '../../components/common/CustomSpinner';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import * as blogService from '../../services/blogService';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

// Dùng styled-components nhẹ để tinh chỉnh một vài chỗ không có sẵn trong Antd
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const MainFeaturedCard = styled(Card)`
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  .ant-card-body {
    padding: 0;
  }
`;

const MainFeaturedImage = styled.div`
  height: 400px;
  background-image: url(${props => props.src || ''});
  background-size: cover;
  background-position: center;
  position: relative;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const MainFeaturedOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 40px 30px 30px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
  color: white;
  pointer-events: none;
`;

const SideFeaturedCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }
  
  .ant-card-body {
    padding: 0;
    display: flex;
    height: 190px;
  }
`;

const StyledBlogCard = styled(Card)`
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  }
  
  .ant-card-cover img {
    height: 200px;
    object-fit: cover;
  }
  
  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

const createExcerpt = (html, maxLength = 120) => {
  const text = html.replace(/<[^>]*>?/gm, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const allPosts = await blogService.getAllPosts();
        
        if (Array.isArray(allPosts)) {
          setPosts(allPosts);
          const uniqueCategories = [...new Set(allPosts.map(post => post.category))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  
  const filteredPosts = currentCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === currentCategory);
  
  const featuredPosts = [...filteredPosts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 3);
  const mainFeatured = featuredPosts[0];
  const sideFeatured = featuredPosts.slice(1, 3);
  
  const regularPosts = filteredPosts
    .filter(post => !featuredPosts.find(fp => fp.postId === post.postId))
    .slice(0, visiblePosts);
  
  const handleLoadMore = () => {
    setVisiblePosts(prev => prev + 6);
  };
  
  const hasMorePosts = regularPosts.length < filteredPosts.length - featuredPosts.length;
  
  return (
    <Layout style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Content>
        <PageContainer>
          <HeaderSection>
            <Title level={1} style={{ fontWeight: 800, fontSize: 42, marginBottom: 16 }}>Blog Thú Cưng</Title>
            <Paragraph style={{ fontSize: 16, color: 'rgba(0,0,0,0.65)', maxWidth: 700, margin: '0 auto' }}>
              Khám phá các bài viết hay về chăm sóc thú cưng, dinh dưỡng, huấn luyện và nhiều thông tin hữu ích khác.
            </Paragraph>
          </HeaderSection>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Space wrap size="middle" style={{ justifyContent: 'center' }}>
              <Button 
                type={currentCategory === 'all' ? 'primary' : 'default'}
                shape="round"
                size="large"
                onClick={() => setCurrentCategory('all')}
              >
                Tất cả
              </Button>
              {categories.map(category => (
                <Button 
                  key={category}
                  type={currentCategory === category ? 'primary' : 'default'}
                  shape="round"
                  size="large"
                  onClick={() => setCurrentCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </Space>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <CustomSpinner size="large" />
              <div style={{ marginTop: 16, color: 'rgba(0,0,0,0.45)' }}>Đang tải bài viết...</div>
            </div>
          ) : error ? (
            <Empty description={error} />
          ) : (
            <>
              {mainFeatured && (
                <div style={{ marginBottom: 48 }}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Link to={`/blog/${mainFeatured.postId}`}>
                        <MainFeaturedCard hoverable>
                          <MainFeaturedImage src={mainFeatured.featuredImage}>
                            <MainFeaturedOverlay>
                              <Tag color="gold" style={{ marginBottom: 12, border: 'none', fontWeight: 600 }}>
                                {mainFeatured.category}
                              </Tag>
                              <Title level={2} style={{ color: 'white', margin: '0 0 16px 0', fontWeight: 700 }}>
                                {mainFeatured.title}
                              </Title>
                              <Space size="large" style={{ opacity: 0.85 }}>
                                <Space>
                                  <Avatar src={mainFeatured.userAvatar} size="small" />
                                  <Text style={{ color: 'white' }}>{mainFeatured.authorName}</Text>
                                </Space>
                                <Space>
                                  <CalendarOutlined />
                                  <Text style={{ color: 'white' }}>
                                    {format(new Date(mainFeatured.publishDate), 'd MMMM, yyyy', { locale: vi })}
                                  </Text>
                                </Space>
                              </Space>
                            </MainFeaturedOverlay>
                          </MainFeaturedImage>
                        </MainFeaturedCard>
                      </Link>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                      {sideFeatured.map(post => (
                        <Link to={`/blog/${post.postId}`} key={post.postId}>
                          <SideFeaturedCard>
                            <div style={{ width: '40%', backgroundImage: `url(${post.featuredImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ padding: 20, width: '60%', display: 'flex', flexDirection: 'column' }}>
                              <Tag color="blue" style={{ width: 'fit-content', marginBottom: 8, border: 'none' }}>
                                {post.category}
                              </Tag>
                              <Title level={4} style={{ marginBottom: 8, fontSize: 16, lineHeight: 1.4 }} ellipsis={{ rows: 3 }}>
                                {post.title}
                              </Title>
                              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                                <CalendarOutlined style={{ marginRight: 6 }} />
                                {format(new Date(post.publishDate), 'd MMMM, yyyy', { locale: vi })}
                              </div>
                            </div>
                          </SideFeaturedCard>
                        </Link>
                      ))}
                    </Col>
                  </Row>
                </div>
              )}
              
              <Row gutter={[24, 24]}>
                {regularPosts.map(post => (
                  <Col xs={24} sm={12} lg={8} key={post.postId}>
                    <Link to={`/blog/${post.postId}`}>
                      <StyledBlogCard 
                        hoverable
                        cover={<img alt={post.title} src={post.featuredImage} />}
                      >
                        <Tag color="blue" style={{ width: 'fit-content', marginBottom: 12, border: 'none' }}>
                          {post.category}
                        </Tag>
                        <Title level={4} style={{ fontSize: 18, marginBottom: 12 }} ellipsis={{ rows: 2 }}>
                          {post.title}
                        </Title>
                        <Paragraph style={{ color: 'rgba(0,0,0,0.65)', flex: 1 }} ellipsis={{ rows: 3 }}>
                          {createExcerpt(post.content)}
                        </Paragraph>
                        
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Avatar src={post.userAvatar} size="small" />
                            <Text type="secondary" style={{ fontSize: 13 }}>{post.authorName}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {format(new Date(post.publishDate), 'd MMM, yyyy', { locale: vi })}
                          </Text>
                        </div>
                      </StyledBlogCard>
                    </Link>
                  </Col>
                ))}
              </Row>
              
              {hasMorePosts && (
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                  <Button type="primary" size="large" shape="round" onClick={handleLoadMore}>
                    Xem thêm bài viết
                  </Button>
                </div>
              )}
            </>
          )}
        </PageContainer>
      </Content>
    </Layout>
  );
};

export default BlogPage;