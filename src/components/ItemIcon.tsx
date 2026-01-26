import React from 'react';
import { Item } from '../types';

interface ItemIconProps {
  item: Item;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item }) => {
  const isRainbow = item.color && !item.color.startsWith('#');
  
  if (isRainbow) {
    return (
      <div 
        className="w-8 h-8 rounded-full" 
        style={{ background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }}
      />
    );
  }
  
  return (
    <div 
      className="w-8 h-8 rounded-full" 
      style={{ backgroundColor: item.color || '#9CA3AF' }} 
    />
  );
};