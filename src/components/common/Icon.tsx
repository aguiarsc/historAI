import React from 'react';
import type { IconType } from 'react-icons';
import './Icon.css';

interface IconProps {
  icon: IconType;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ icon: IconComponent, size = 16, color = 'currentColor', className = '', style = {} }: IconProps) {
  return (
    <span className={`icon ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <IconComponent size={size} color={color} style={{ minWidth: size, minHeight: size }} />
    </span>
  );
} 