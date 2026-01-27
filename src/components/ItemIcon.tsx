import React from 'react';
import { Item } from '../types';

interface ItemIconProps {
  item: Item;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item }) => {
  if (item.image) {
    return <img src={item.image} alt={item.name} className="w-6 h-6 rounded object-cover" />;
  }
  
  return (
    <div 
      className="w-6 h-6 rounded" 
      style={{ backgroundColor: item.color || '#9CA3AF' }} 
    />
  );
};
