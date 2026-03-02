import React from 'react';
import { Tag, theme } from 'antd';

const { useToken } = theme;

const isPresetStatus = (v) =>
  v === 'success' || v === 'processing' || v === 'warning' || v === 'error' || v === 'default';

const hexToRgb = (hex) => {
  const normalized = (hex || '').replace('#', '').trim();
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
};

const withAlpha = (color, a) => {
  if (!color) return color;
  if (color.startsWith('rgba(')) return color;
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${a})`);
  }
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }
  return color;
};

const getBaseColor = (token, color) => {
  if (!color) return token.colorTextSecondary;
  if (!isPresetStatus(color)) return color;

  switch (color) {
    case 'success':
      return token.colorSuccess;
    case 'processing':
      return token.colorInfo;
    case 'warning':
      return token.colorWarning;
    case 'error':
      return token.colorError;
    case 'default':
    default:
      return token.colorTextSecondary;
  }
};

/**
 * AntD v5 không có prop `variant` trên Tag như demo AntD v6.
 * Component này giả lập đúng 3 kiểu: `filled | solid | outlined`.
 */
const StatusTag = ({
  color = 'default',
  variant = 'filled',
  icon,
  children,
  style,
  ...rest
}) => {
  const { token } = useToken();
  const baseColor = getBaseColor(token, color);

  const computedStyle = {
    borderRadius: 999,
    padding: '4px 12px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    lineHeight: 1.4,
    ...(variant === 'solid'
      ? {
          backgroundColor: baseColor,
          borderColor: baseColor,
          color: '#fff',
        }
      : variant === 'outlined'
        ? {
            backgroundColor: 'transparent',
            borderColor: baseColor,
            color: baseColor,
          }
        : {
            backgroundColor: withAlpha(baseColor, 0.12),
            borderColor: withAlpha(baseColor, 0.25),
            color: baseColor,
          }),
    ...style,
  };

  // Nếu dùng preset status, không truyền trực tiếp để tránh AntD override style (bg/border)
  const tagColorProp = isPresetStatus(color) ? undefined : color;

  return (
    <Tag color={tagColorProp} icon={icon} style={computedStyle} {...rest}>
      {children}
    </Tag>
  );
};

export default StatusTag;

