import { Item } from '../types';

interface ItemIconProps {
  item: Item;
  size?: 'sm' | 'md';
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  
  const isRainbow = item.color && !item.color.startsWith('#');
  
  if (item.image) {
    return (
      <img 
        src={item.image} 
        alt={item.name} 
        className={`${sizeClass} rounded-full object-cover`} 
      />
    );
  }
  
  if (isRainbow) {
    return (
      <div 
        className={`${sizeClass} rounded-full`}
        style={{ background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)' }}
      />
    );
  }
  
  return (
    <div 
      className={`${sizeClass} rounded-full`}
      style={{ backgroundColor: item.color || '#9CA3AF' }} 
    />
  );
};
