import { Item } from '../types';
import { Package } from 'lucide-react';

interface ItemIconProps {
  item: Item;
  size?: number | 'sm' | 'md'; // Fixed: Now accepts numbers
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md' }) => {
  // Determine pixel size
  let pxSize = 32; // default md
  if (typeof size === 'number') {
    pxSize = size;
  } else if (size === 'sm') {
    pxSize = 16;
  }

  const hasImages = item.images && item.images.length > 0;
  const iconIndex = item.iconIndex !== undefined ? item.iconIndex : -1;

  // Case 1: Image exists and an icon is selected
  if (iconIndex !== -1 && hasImages) {
    return (
      <img 
        src={item.images![iconIndex]} // Fixed: uses images array
        alt={item.name} 
        style={{ width: `${pxSize}px`, height: `${pxSize}px`, objectFit: 'cover' }} 
      />
    );
  }

  // Case 2: No image, but Color exists
  if (item.color) {
    return (
      <div 
        style={{ width: `${pxSize}px`, height: `${pxSize}px`, backgroundColor: item.color }} 
      />
    );
  }

  // Case 3: Placeholder (No Image, No Color)
  return (
    <div 
      style={{ 
        width: `${pxSize}px`, 
        height: `${pxSize}px`, 
        backgroundColor: '#F3F4F6', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #E5E7EB'
      }}
    >
      <Package size={pxSize * 0.7} className="text-gray-400" />
    </div>
  );
};