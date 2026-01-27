import React from 'react';
import { Item } from '../types';

interface ItemIconProps {
  item: Item;
  size?: 'sm' | 'md' | 'lg';
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (item.image) {
    return (
      <img 
        src={item.image} 
        alt={item.name} 
        className={`${sizeClasses[size]} object-cover sharp`}
      />
    );
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} sharp`}
      style={{ backgroundColor: item.color || '#9CA3AF' }} 
    />
  );
};
