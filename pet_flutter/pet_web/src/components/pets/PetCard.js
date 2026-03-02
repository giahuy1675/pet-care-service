import React from 'react';
import { Card, Tooltip, Avatar } from 'antd';
import { Link } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axiosClient from '../../utils/axiosClient';
const { Meta } = Card;

const PetCard = ({ pet, onDelete }) => {
  const defaultImage = 'https://via.placeholder.com/300?text=No+Image';
  
  // Hàm lấy URL đầy đủ của hình ảnh
  const getImageUrl = (photoPath) => {
    if (!photoPath) return defaultImage;
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // Lấy phần baseURL từ axiosClient và loại bỏ phần "/api"
    const baseURL = axiosClient.defaults.baseURL;
    const serverBaseURL = baseURL.substring(0, baseURL.lastIndexOf('/api'));
    
    return `${serverBaseURL}${photoPath}`;
  };
  
  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${pet.name}?`)) {
      onDelete(pet.petId);
    }
  };

  const imageUrl = getImageUrl(pet.photo);
  const descriptionParts = [];
  if (pet.species) descriptionParts.push(pet.species);
  if (pet.breed) descriptionParts.push(pet.breed);
  if (pet.gender || pet.age) {
    const genderAge = `${pet.gender || 'Không rõ giới tính'}${pet.age ? `, ${pet.age}` : ''}`;
    descriptionParts.push(genderAge);
  }
  const description = descriptionParts.join(' • ');

  return (
    <Card
      hoverable
      style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}
      cover={
        <img
          draggable={false}
          alt={pet.name}
          src={imageUrl}
        />
      }
      actions={[
        <Tooltip title="Xem chi tiết" key="view">
          <Link to={`/pets/${pet.petId}`}>
            <EyeOutlined />
          </Link>
        </Tooltip>,
        <Tooltip title="Chỉnh sửa" key="edit">
          <Link to={`/pets/edit/${pet.petId}`}>
            <EditOutlined />
          </Link>
        </Tooltip>,
        <Tooltip title="Xóa" key="delete">
          <DeleteOutlined
            style={{ color: '#ff4d4f' }}
            onClick={handleDelete}
          />
        </Tooltip>
      ]}
    >
      <Meta
        avatar={
          <Avatar>
            {pet.name ? pet.name.charAt(0).toUpperCase() : 'P'}
          </Avatar>
        }
        title={pet.name}
        description={description || 'Chưa có mô tả'}
      />
    </Card>
  );
};

export default PetCard;