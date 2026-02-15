export interface Item {
  id: string;
  name: string;
  totalQuantity: number;
  color?: string;
  groupId?: string;
  images?: string[];  // Array of up to 5 images
  iconIndex?: number;  // Which image is the icon (0-4)
  dimensions?: string;
  description?: string;
}

export interface Group {
  id: string;
  name: string;
  color?: string;
  sortOrder?: number;
  displayMode?: 'color' | 'image';
}

export interface Project {
  id: string;
  name: string;
  number: string;
  client: string;
}

export interface BookingItem {
  itemId: string;
  quantity: number;
}

export type BookingStatus = 'potential' | 'confirmed';

export interface Booking {
  id: string;
  items: BookingItem[];
  projectId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
}
