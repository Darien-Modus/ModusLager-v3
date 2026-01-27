import { Item, Booking } from '../types';

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

export const calcAvailable = (
  itemId: string,
  start: string,
  end: string,
  bookings: Booking[],
  items: Item[],
  excludeId?: string
) => {
  const item = items.find(i => i.id === itemId);
  if (!item) return 0;
  
  const overlapping = bookings.filter(b => {
    if (b.id === excludeId) return false;
    return new Date(b.startDate) <= new Date(end) && new Date(b.endDate) >= new Date(start);
  });
  
  let booked = 0;
  overlapping.forEach(b => {
    const bi = b.items.find(i => i.itemId === itemId);
    if (bi) booked += bi.quantity;
  });
  
  return item.totalQuantity - booked;
};
