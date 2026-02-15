import { Item, Booking } from '../types';

// Format date to European format: dd-mm-yyyy
export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Short format for calendar views
export const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(2);
  return `${day}-${month}-${year}`;
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
