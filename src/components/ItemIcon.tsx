import { Item } from '../types';

interface ItemIconProps {
  item: Item;
  size?: 'sm' | 'md';
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  
  const isRainbow = item.color && item.color !== 'rainbow' && !item.color.startsWith('#');
  
  // Get color name for title
  const getColorName = () => {
    if (!item.color || item.color === '#9CA3AF') return 'Alu';
    if (item.color === '#191A23' || item.color === '#1F1F1F' || item.color === '#000000') return 'Black';
    if (item.color === 'rainbow' || isRainbow) return 'Other';
    return 'Custom';
  };
  
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
        title={getColorName()}
      />
    );
  }
  
  return (
    <div 
      className={`${sizeClass} rounded-full`}
      style={{ backgroundColor: item.color || '#9CA3AF' }}
      title={getColorName()}
    />
  );
};
