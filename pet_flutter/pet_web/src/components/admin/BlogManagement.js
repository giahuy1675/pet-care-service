import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Button, Space, Flex, ConfigProvider, Pagination, Modal, Form, Input, Select, Upload, message, Row, Col } from 'antd';
import { HappyProvider } from '@ant-design/happy-work-theme';

import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  FileAddOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SyncOutlined,
  PoweroffOutlined,
  CloseOutlined
} from '@ant-design/icons';
import * as blogService from '../../services/blogService';
import useAuth from '../../hooks/useAuth';

// Styled Components
const BlogManagementContainer = styled.div`
  width: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #edf2f7;
  
  h2 {
    font-size: 1.8rem;
    color: #2d3748;
    margin: 0;
    font-weight: 700;
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 24px;
      background: linear-gradient(180deg, #4299e1 0%, #3182ce 100%);
      margin-right: 12px;
      border-radius: 3px;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const SearchBar = styled.div`
  display: flex;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  overflow: hidden;
  
  input {
    flex: 1;
    padding: 12px 18px;
    border: 1px solid #e2e8f0;
    border-right: none;
    border-radius: 10px 0 0 10px;
    font-size: 15px;
    transition: all 0.3s;
    
    &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }
    
    &::placeholder {
      color: #a0aec0;
    }
  }
  
  button {
    padding: 12px 18px;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    border: none;
    border-radius: 0 10px 10px 0;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
    }
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
  background: white;
  padding: 18px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const StatusFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    font-weight: 600;
    color: #4a5568;
    font-size: 15px;
  }

  select {
    padding: 10px 40px 10px 15px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    background-color: white;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    appearance: none;
    transition: all 0.3s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

    &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }
    
    &:hover {
      border-color: #a0aec0;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  margin-bottom: 25px;
`;

const Th = styled.th`
  background: linear-gradient(to bottom, #f9fafb, #edf2f7);
  color: #2d3748;
  text-align: left;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  transition: all 0.3s;
  
  &:first-child {
    border-top-left-radius: 12px;
  }
  
  &:last-child {
    border-top-right-radius: 12px;
  }
  
  &:hover {
    background: linear-gradient(to bottom, #edf2f7, #e2e8f0);
  }
`;

const Td = styled.td`
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
  color: #4a5568;
  font-size: 15px;
  vertical-align: middle;
  transition: all 0.3s;
  
  &.title {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    color: #2c5282;
  }
  
  &.actions {
    width: 180px;
  }
`;

const Tr = styled.tr`
  background-color: white;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f7fafc;
    transform: scale(1.01);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
    z-index: 1;
    position: relative;
  }
  
  &:last-child td:first-child {
    border-bottom-left-radius: 12px;
  }
  
  &:last-child td:last-child {
    border-bottom-right-radius: 12px;
  }
  
  &:last-child td {
    border-bottom: none;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 10px;
  
  button {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.07);
    
    &.edit {
      background-color: #ebf8ff;
      color: #3182ce;
      
      &:hover {
        background-color: #3182ce;
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 5px 10px rgba(49, 130, 206, 0.35);
      }
    }
    
    &.delete {
      background-color: #fff5f5;
      color: #e53e3e;
      
      &:hover {
        background-color: #e53e3e;
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 5px 10px rgba(229, 62, 62, 0.35);
      }
    }
    
    &.view {
      background-color: #f7fafc;
      color: #4a5568;
      
      &:hover {
        background-color: #4a5568;
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 5px 10px rgba(74, 85, 104, 0.3);
      }
    }

    &.publish {
      background-color: #f0fff4;
      color: #38a169;

      &:hover {
        background-color: #38a169;
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 5px 10px rgba(56, 161, 105, 0.35);
      }
    }
  }
`;


const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.published {
    background-color: #e6fffa;
    color: #38b2ac;
    box-shadow: 0 0 0 1px rgba(56, 178, 172, 0.2);
  }
  
  &.draft {
    background-color: #ebf8ff;
    color: #3182ce;
    box-shadow: 0 0 0 1px rgba(49, 130, 206, 0.2);
  }
  
  &.archived {
    background-color: #edf2f7;
    color: #718096;
    box-shadow: 0 0 0 1px rgba(113, 128, 150, 0.2);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 0;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
  
  div {
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 10px;
  }
  
  p {
    color: #718096;
    font-size: 15px;
    max-width: 400px;
    margin: 10px auto 0;
    line-height: 1.6;
  }
`;

const Loader = styled.div`
  text-align: center;
  padding: 60px 0;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
  
  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3182ce;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }
  
  p {
    color: #718096;
    font-size: 16px;
    font-weight: 500;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Form Components
const Toast = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 12px;
  background-color: ${props => 
    props.type === 'success' ? '#38b2ac' : 
    props.type === 'error' ? '#e53e3e' : '#3182ce'};
  color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  border-left: 5px solid ${props => 
    props.type === 'success' ? '#2c7a7b' : 
    props.type === 'error' ? '#c53030' : '#2b6cb0'};
  
  .icon {
    font-size: 20px;
  }
  
  .message {
    font-size: 15px;
    font-weight: 500;
  }
  
  animation: slideIn 0.3s forwards, fadeOut 0.3s 2.7s forwards;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(10px);
      opacity: 0;
    }
  }
`;

const EditorContainer = styled.div`
  margin-bottom: 25px;
  
  .rdw-editor-wrapper {
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  
  .rdw-editor-toolbar {
    background: #f8fafb;
    border: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .rdw-option-wrapper {
    border: 1px solid #e2e8f0;
  }
  
  .rdw-option-active {
    background: #ebf8ff;
  }
  
  .rdw-dropdown-wrapper {
    border: 1px solid #e2e8f0;
  }
  
  .rdw-editor-main {
    min-height: 300px;
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: #4a5568;
    font-size: 16px;
    
    /* Đảm bảo tất cả ảnh có kích thước đồng bộ */
    img {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      width: 960px;
      height: 539px;
      object-fit: contain;
    }
    
    /* Style cho container chứa video và ảnh */
    .image-container, .video-container {
      margin: 0 auto 20px;
      max-width: 100%;
      text-align: center;
    }
    
    /* Style cho iframe (video) */
    iframe {
      max-width: 100%;
      width: 960px;
      height: 539px;
      margin: 0 auto;
      display: block;
    }
  }
  
  .error-message {
    color: #e53e3e;
    font-size: 13px;
    margin-top: 6px;
  }
`;

const MediaButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const MediaButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
  
  &:hover {
    background-color: #f7fafc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .icon {
    font-size: 16px;
  }
`;

// Helper function để chuẩn hóa thông tin post
const normalizePost = (post) => {
  return {
    postId: post.postId || post.id,
    title: post.title || '',
    content: post.content || '',
    category: post.category || 'general',
    tags: post.tags || '',
    status: post.status || 'Draft',
    featuredImage: post.featuredImage || null,
    publishDate: post.publishDate || post.createdAt || new Date().toISOString()
  };
};

// Tạo một hàm helper để tạo HTML cho ảnh với định dạng nhất quán
const createImageHtml = (imageUrl, altText) => {
  return `<div class="image-container" style="text-align:center; margin:0 auto 20px; max-width:100%;">
    <img src="${imageUrl}" alt="${altText || 'Blog image'}" style="width:960px; height:539px; object-fit:contain; border-radius:8px; max-width:100%;" />
  </div><p></p>`;
};

// Tạo một hàm helper để tạo HTML cho video với định dạng nhất quán
const createVideoHtml = (embedUrl) => {
  return `<div class="video-container" style="position:relative; margin:0 auto 20px; max-width:100%; text-align:center;">
    <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen 
      style="display:block; margin:0 auto; width:960px; height:539px; max-width:100%; border-radius:8px;"></iframe>
  </div><p></p>`;
};

const BlogManagement = () => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoadings, setButtonLoadings] = useState({});
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    status: 'draft',
    featuredImage: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Sau khi lấy được dữ liệu từ API, khởi tạo editorState từ HTML
  useEffect(() => {
    if (formData.content) {
      const contentBlock = htmlToDraft(formData.content);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        const editorState = EditorState.createWithContent(contentState);
        setEditorState(editorState);
      }
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [formData.content]);

  // Lấy danh sách bài viết
  useEffect(() => {
    fetchPosts();
  }, [filter]);
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === 'all') {
        response = await blogService.getAllPosts();
      } else {
        // Truyền filter vào API để lọc theo trạng thái
        response = await blogService.getAllPosts(filter);
      }
      
      if (Array.isArray(response)) {
        setPosts(response);
        setError(null);
      } else {
        console.error('API returned invalid data format:', response);
        setPosts([]);
        setError('Dữ liệu không hợp lệ. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setPosts([]);
      setError('Không thể tải danh sách bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Tìm kiếm bài viết
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }
    
    setLoading(true);
    try {
      const response = await blogService.searchPosts(searchQuery);
      setPosts(response);
    } catch (err) {
      console.error('Error searching blog posts:', err);
      setError('Không thể tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Phân trang
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Xử lý form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, featuredImage: file });
      
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview({
          src: reader.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Nội dung không được để trống';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setToast({
        show: true,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Tạo dữ liệu gửi đi
      const blogData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        status: formData.status
      };
      
      // Nếu có ảnh đại diện dạng base64, gửi luôn base64
      if (formData.featuredImageBase64) {
        blogData.featuredImageBase64 = formData.featuredImageBase64;
      } 
      // Nếu không có base64 nhưng có file, gửi file
      else if (formData.featuredImage) {
        blogData.featuredImage = formData.featuredImage;
      }
      
      let response;
      if (currentPost) {
        const postId = currentPost.postId || currentPost.id;
        console.log(`Updating post ID ${postId} with status: ${blogData.status}`);
        
        response = await blogService.updatePost(postId, blogData);
      } else {
        response = await blogService.createPost(blogData);
      }
      
      setToast({
        show: true,
        message: currentPost ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết mới thành công!',
        type: 'success'
      });
      
      fetchPosts();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving blog post:', err);
      setToast({
        show: true,
        message: `Lỗi: ${err.message || 'Không thể lưu bài viết'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Cập nhật hàm resetForm để reset editorState
  const resetForm = () => {
    form.resetFields();
    setFormData({
      title: '',
      content: '',
      category: 'general',
      tags: '',
      status: 'draft',
      featuredImage: null
    });
    setEditorState(EditorState.createEmpty());
    setImagePreview(null);
    setFormErrors({});
    setCurrentPost(null);
    setShowForm(false);
  };
  
  // Cập nhật hàm openEditForm để xử lý nội dung HTML
  const openEditForm = (post) => {
    console.log("Edit post data:", post);
    
    // Giữ nguyên đường dẫn ảnh hiện tại để hiển thị
    const currentImageUrl = post.featuredImage;
    
    // Lưu toàn bộ thông tin post vào currentPost
    setCurrentPost({
      ...post,
      currentImageUrl
    });
    
    setFormData({
      title: post.title || '',
      content: post.content || '',
      category: post.category || 'general',
      tags: post.tags || '',
      status: post.status || 'draft',
      featuredImage: null
    });
    
    // Chuyển đổi HTML thành EditorState cho Draft.js
    if (post.content) {
      const contentBlock = htmlToDraft(post.content);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        const editorState = EditorState.createWithContent(contentState);
        setEditorState(editorState);
      }
    } else {
      setEditorState(EditorState.createEmpty());
    }
    
    // Kiểm tra và hiển thị ảnh hiện tại
    if (post.featuredImage) {
      setImagePreview({
        src: post.featuredImage,
        name: 'Ảnh hiện tại',
        isExisting: true
      });
    } else {
      setImagePreview(null);
    }
    
    setShowForm(true);
  };
  
  const confirmDelete = (post) => {
    console.log("Confirming delete for post:", post); // Debug
    setCurrentPost(post);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!currentPost) {
      console.error("Cannot delete: currentPost is undefined");
      return;
    }
    
    const postId = currentPost.postId || currentPost.id;
    
    if (!postId) {
      console.error("Cannot delete: post ID is undefined", currentPost);
      setError('Không thể xóa bài viết: ID không hợp lệ');
      return;
    }
    
    console.log(`Deleting post with ID: ${postId}`);
    
    setLoading(true);
    try {
      await blogService.deletePost(postId);
      setShowDeleteConfirm(false);
      setCurrentPost(null);
      fetchPosts();
      setToast({ show: true, message: 'Bài viết đã được xóa thành công!', type: 'success' });
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(`Không thể xóa bài viết: ${err.message || 'Lỗi không xác định'}`);
      setToast({ show: true, message: 'Không thể xóa bài viết. Vui lòng thử lại sau.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePublish = async (post) => {
    // Kiểm tra xem bài viết đã được xuất bản chưa
    if (post.status === 'Published') {
      setToast({
        show: true,
        message: 'Bài viết đã được xuất bản rồi',
        type: 'info'
      });
      return;
    }
    
    try {
      setLoading(true);
      const postId = post.postId || post.id;
      
      if (!postId) {
        throw new Error('ID bài viết không hợp lệ');
      }
      
      // Gọi API xuất bản
      await blogService.publishPost(postId);
      
      setToast({
        show: true,
        message: 'Xuất bản bài viết thành công!',
        type: 'success'
      });
      
      // Cập nhật lại danh sách bài viết
      fetchPosts();
    } catch (error) {
      console.error('Error publishing blog post:', error);
      setToast({
        show: true,
        message: `Không thể xuất bản bài viết: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi nội dung trong Editor
  const handleEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
    
    // Chuyển đổi nội dung editor thành HTML và cập nhật formData
    const htmlContent = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    setFormData({ ...formData, content: htmlContent });
    
    // Xóa lỗi khi người dùng nhập liệu
    if (formErrors.content) {
      setFormErrors({ ...formErrors, content: null });
    }
  };

  const handleInsertVideo = () => {
    // Lấy url video từ người dùng
    const videoUrl = prompt('Nhập URL video YouTube hoặc Vimeo:');
    if (!videoUrl) return;
    
    try {
      // Xử lý URL video từ YouTube
      let embedUrl = '';
      
      // Xử lý YouTube URL
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const youtubeMatch = videoUrl.match(youtubeRegex);
      
      if (youtubeMatch && youtubeMatch[1]) {
        // Đây là link YouTube
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      } else {
        // Xử lý Vimeo URL
        const vimeoRegex = /vimeo\.com\/(?:.*\/)?(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_-]+)?/;
        const vimeoMatch = videoUrl.match(vimeoRegex);
        
        if (vimeoMatch && vimeoMatch[1]) {
          // Đây là link Vimeo
          embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        } else {
          // Không phải YouTube hoặc Vimeo
          throw new Error('URL video không hợp lệ');
        }
      }
      
      // Tạo iframe HTML với kích thước cố định 960x539px
      const videoEmbed = createVideoHtml(embedUrl);
      
      // Chèn HTML vào draft-js
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity('EMBEDDED_LINK', 'IMMUTABLE', { 
        src: embedUrl, 
        html: videoEmbed 
      });
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      
      // Chèn entityKey vào editorState
      const newEditorState = EditorState.set(
        editorState, 
        { currentContent: contentStateWithEntity }
      );
      
      // Cập nhật draft-js
      setEditorState(newEditorState);
      
      // Cập nhật formData với HTML chứa iframe
      const currentHtml = formData.content || '';
      setFormData({
        ...formData,
        content: currentHtml + videoEmbed
      });
      
      setToast({
        show: true, 
        message: 'Đã thêm video vào bài viết',
        type: 'success'
      });
    } catch (error) {
      console.error('Error inserting video:', error);
      setToast({
        show: true, 
        message: 'Lỗi khi chèn video: ' + error.message,
        type: 'error'
      });
    }
  };
  
  // Thêm ảnh vào bài viết
  const uploadImageCallback = async (file) => {
    try {
      // Hiển thị thông báo đang tải lên
      setToast({
        show: true,
        message: 'Đang tải ảnh lên...',
        type: 'info'
      });
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadPath', 'uploads/blogs');
      
      // Gọi API tải ảnh lên
      const response = await blogService.uploadImage(formData);
      
      setToast({
        show: true,
        message: 'Tải ảnh thành công',
        type: 'success'
      });
      
      // Trả về cùng với kích thước cố định
      return { 
        data: { 
          link: response.url,
          height: '539px',
          width: '960px',
          alt: file.name || 'Blog image',
          style: {
            'display': 'block',
            'margin': '0 auto',
            'max-width': '100%',
            'border-radius': '8px',
            'object-fit': 'contain'
          }
        } 
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      setToast({
        show: true,
        message: 'Lỗi khi tải ảnh lên',
        type: 'error'
      });
      return { data: { link: '' } };
    }
  };

  // Thay đổi hàm handleOpenImageTool
  const handleOpenImageTool = () => {
    try {
      // Hiển thị prompt cho người dùng nhập URL ảnh
      const imageUrl = prompt('Nhập URL hình ảnh hoặc đường dẫn local, hoặc nhấn "Cancel" để tải ảnh lên:');
      
      if (imageUrl === null) {
        // Người dùng chọn Cancel - hiển thị dialog chọn file
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          try {
            setToast({
              show: true,
              message: 'Đang xử lý hình ảnh...',
              type: 'info'
            });
            
            // Đọc file và chuyển thành base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = () => {
              const base64Image = reader.result;
              
              // Chèn ảnh base64 vào nội dung với kích thước cố định 960x539px
              const htmlWithImage = `${formData.content || ''}${createImageHtml(base64Image, file.name)}`;
              setFormData({...formData, content: htmlWithImage});
              
              setToast({
                show: true,
                message: 'Đã thêm ảnh vào bài viết',
                type: 'success'
              });
            };
            
            reader.onerror = (error) => {
              console.error('Error reading file:', error);
              setToast({
                show: true,
                message: 'Lỗi khi đọc file hình ảnh',
                type: 'error'
              });
            };
          } catch (error) {
            console.error('Error converting to base64:', error);
            setToast({
              show: true,
              message: 'Lỗi khi xử lý hình ảnh',
              type: 'error'
            });
          }
        };
      } else if (imageUrl && imageUrl.trim() !== '') {
        // Kiểm tra nếu đường dẫn có dạng local (C:/ hoặc /)
        if (imageUrl.match(/^[A-Za-z]:\\/) || imageUrl.match(/^\/[^\/]/)) {
          // Đây là đường dẫn local, thông báo cho người dùng
          setToast({
            show: true,
            message: 'Không thể truy cập trực tiếp đường dẫn local. Vui lòng chọn file qua nút "Cancel"',
            type: 'error'
          });
        } else {
          // Đây là URL online, chèn trực tiếp với kích thước đồng bộ 960x539px
          const htmlWithImage = `${formData.content || ''}${createImageHtml(imageUrl, 'Image')}`;
          setFormData({...formData, content: htmlWithImage});
          
          setToast({
            show: true,
            message: 'Đã thêm ảnh vào bài viết',
            type: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Error handling image:', error);
      setToast({
        show: true,
        message: 'Lỗi khi thêm ảnh',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  return (
    <BlogManagementContainer>
      {/* Toast notification */}
      {toast.show && (
        <Toast type={toast.type}>
          <span className="icon">
            {toast.type === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          </span>
          <span className="message">{toast.message}</span>
        </Toast>
      )}
      
      <Header>
        <h2>Quản lý Blog</h2>
        <ActionButtons>
          <HappyProvider>
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              Tạo bài viết mới
            </Button>
          </HappyProvider>
        </ActionButtons>
      </Header>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Tìm kiếm bài viết..."
          allowClear
          enterButton="Tìm kiếm"
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          style={{ flex: 1 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 500, color: '#4a5568' }}>Trạng thái:</span>
          <Select
            value={filter}
            onChange={(value) => setFilter(value)}
            size="large"
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'Published', label: 'Đã xuất bản' },
              { value: 'Draft', label: 'Bản nháp' },
              { value: 'Archived', label: 'Đã lưu trữ' },
            ]}
          />
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <ExclamationCircleOutlined /> {error}
        </div>
      )}
      
      {loading && posts.length === 0 ? (
        <Loader>
          <div className="loader"></div>
          <p>Đang tải dữ liệu...</p>
        </Loader>
      ) : posts.length === 0 ? (
        <EmptyState>
          <div>Không có bài viết nào</div>
          <p>Hãy tạo bài viết mới hoặc thay đổi bộ lọc để xem kết quả khác</p>
        </EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Tiêu đề</Th>
                <Th>Danh mục</Th>
                <Th>Ngày tạo</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map(post => (
                <Tr key={post.postId || post.id}>
                  <Td className="title">{post.title}</Td>
                  <Td>{post.category}</Td>
                  <Td>{new Date(post.createdAt || post.publishDate).toLocaleDateString('vi-VN')}</Td>
                  <Td>
                    <StatusBadge className={post.status ? post.status.toLowerCase() : 'draft'}>
                      {post.status === 'Published' && 'Đã xuất bản'}
                      {post.status === 'Draft' && 'Bản nháp'}
                      {post.status === 'Archived' && 'Đã lưu trữ'}
                      {!post.status && 'Bản nháp'}
                    </StatusBadge>
                  </Td>
                  <Td className="actions">
                    <Space size="small">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`/blog/${post.postId || post.id}`, '_blank')}
                        title="Xem bài viết"
                      />
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        loading={buttonLoadings[`edit-${post.postId || post.id}`]}
                        onClick={() => {
                          setButtonLoadings(prev => ({ ...prev, [`edit-${post.postId || post.id}`]: true }));
                          openEditForm(post);
                          setTimeout(() => {
                            setButtonLoadings(prev => ({ ...prev, [`edit-${post.postId || post.id}`]: false }));
                          }, 500);
                        }}
                        title="Sửa bài viết"
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={buttonLoadings[`delete-${post.postId || post.id}`]}
                        onClick={() => {
                          setButtonLoadings(prev => ({ ...prev, [`delete-${post.postId || post.id}`]: true }));
                          confirmDelete(post);
                          setTimeout(() => {
                            setButtonLoadings(prev => ({ ...prev, [`delete-${post.postId || post.id}`]: false }));
                          }, 500);
                        }}
                        title="Xóa bài viết"
                      />
                      {post.status !== 'Published' && (
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={buttonLoadings[`publish-${post.postId || post.id}`]}
                          onClick={() => {
                            setButtonLoadings(prev => ({ ...prev, [`publish-${post.postId || post.id}`]: true }));
                            handlePublish(post);
                            setTimeout(() => {
                              setButtonLoadings(prev => ({ ...prev, [`publish-${post.postId || post.id}`]: false }));
                            }, 500);
                          }}
                          title="Xuất bản bài viết"
                        />
                      )}
                    </Space>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
            <Pagination
              current={currentPage}
              onChange={(page) => setCurrentPage(page)}
              total={posts.length}
              pageSize={postsPerPage}
            />
          </div>
        </>
      )}
      
      
      {/* Form Modal */}
      <Modal
        title={<div style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</div>}
        open={showForm}
        onCancel={resetForm}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={1000}
        centered
        okText={currentPost ? 'Cập nhật' : 'Tạo bài viết'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            // Logic form is handled by passing values to the existing handleSubmit logic
            const fakeEvent = { preventDefault: () => {} };
            // We'll sync the values back to formData for handleSubmit
            setFormData(prev => ({ ...prev, ...values }));
            setTimeout(() => handleSubmit(fakeEvent), 0);
          }}
          initialValues={{ category: 'general', status: 'Draft' }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                <Input placeholder="Nhập tiêu đề bài viết" size="large" onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </Form.Item>
              
              <Form.Item label="Nội dung" required>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '10px' }}>
                  <MediaButtons>
                    <MediaButton onClick={handleOpenImageTool} type="button">
                      <PictureOutlined className="icon" /> Thêm ảnh
                    </MediaButton>
                    <MediaButton onClick={handleInsertVideo} type="button">
                      <VideoCameraOutlined className="icon" /> Thêm video
                    </MediaButton>
                  </MediaButtons>
                  
                  <Editor
                    editorState={editorState}
                    onEditorStateChange={handleEditorChange}
                    wrapperClassName="wrapper-class"
                    editorClassName="editor-class"
                    toolbarClassName="toolbar-class"
                    toolbar={{
                      options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'image', 'history'],
                      image: {
                        uploadCallback: uploadImageCallback,
                        alt: { present: true, mandatory: false },
                        previewImage: true,
                        alignmentEnabled: true,
                      },
                    }}
                    placeholder="Nhập nội dung bài viết của bạn tại đây..."
                  />
                </div>
                {formErrors.content && <div style={{ color: '#ff4d4f', marginTop: '5px' }}>{formErrors.content}</div>}
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                <Form.Item name="status" label="Trạng thái">
                  <Select onChange={(val) => setFormData({...formData, status: val})}>
                    <Select.Option value="Draft">Bản nháp</Select.Option>
                    <Select.Option value="Published">Xuất bản</Select.Option>
                    <Select.Option value="Archived">Lưu trữ</Select.Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="category" label="Danh mục">
                  <Select onChange={(val) => setFormData({...formData, category: val})}>
                    <Select.Option value="general">Tổng hợp</Select.Option>
                    <Select.Option value="dogs">Chó</Select.Option>
                    <Select.Option value="cats">Mèo</Select.Option>
                    <Select.Option value="birds">Chim</Select.Option>
                    <Select.Option value="other">Khác</Select.Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="tags" label="Thẻ (tags)">
                  <Input placeholder="phân tách bằng dấu phẩy" onChange={(e) => setFormData({...formData, tags: e.target.value})} />
                </Form.Item>
                
                <Form.Item label="Ảnh đại diện">
                  <Input type="file" onChange={handleFileChange} accept="image/*" />
                  {imagePreview && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img src={imagePreview.src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{imagePreview.isExisting ? 'Ảnh hiện tại' : imagePreview.name}</div>
                    </div>
                  )}
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
      

      {/* Delete Confirmation */}
      <Modal
        title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> Xác nhận xóa</>}
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onOk={handleDelete}
        confirmLoading={loading}
        okText="Xóa"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        centered
      >
        <p>Bạn có chắc chắn muốn xóa bài viết <strong>"{currentPost?.title}"</strong>? Hành động này không thể khôi phục.</p>
      </Modal>
      
</BlogManagementContainer>
  );
};

export default BlogManagement;
