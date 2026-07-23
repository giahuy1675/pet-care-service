import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const BeamContainer = styled.div`
  position: relative;
  border-radius: ${props => props.borderRadius || '18px'};
  overflow: hidden;
  height: 100%;
  width: 100%;
  z-index: 1;

  /* Lớp phủ quay tròn tạo hiệu ứng viền sáng */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      transparent,
      transparent,
      transparent,
      ${props => props.color || '#1677ff'}
    );
    animation: ${spin} ${props => props.duration || 3}s linear infinite;
    z-index: -2;
  }

  /* Nền đè lên trên để che đi phần ở giữa, chỉ lộ viền */
  &::after {
    content: '';
    position: absolute;
    inset: ${props => props.borderWidth || '2px'};
    background: ${props => props.background || 'white'};
    border-radius: ${props => props.innerRadius || '16px'};
    z-index: -1;
  }
`;

const BorderBeam = ({ 
  children, 
  duration = 3, 
  color = '#1677ff', 
  borderWidth = '2px',
  borderRadius = '18px',
  innerRadius = '16px',
  background = 'white',
  className, 
  style 
}) => {
  return (
    <BeamContainer 
      duration={duration} 
      color={color}
      borderWidth={borderWidth}
      borderRadius={borderRadius}
      innerRadius={innerRadius}
      background={background}
      className={className} 
      style={style}
    >
      {children}
    </BeamContainer>
  );
};

export default BorderBeam;
