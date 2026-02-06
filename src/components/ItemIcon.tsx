import React from 'react';
import { Item } from '../types';

interface ItemIconProps {
  item: Item;
  size?: 'sm' | 'md';
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const isRainbow = item.color && !item.color.startsWith('#');
  const colorName = item.color === '#9CA3AF' ? 'Alu' : item.color === '#191A23' ? 'Black' : 'Other';
  
  return (
    <div 
      className={`${sizeClass} border-2 flex-shrink-0`}
      style={{ 
        borderColor: '#575F60',
        ...(isRainbow 
          ? { background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }
          : { backgroundColor: item.color || '#9CA3AF' }
        )
      }}
      title={colorName}
    />
  );
};
