export interface Item {
  id: string;
  name: string;
  totalQuantity: number;
  color?: string;
  image?: string;
  groupId?: string | null;
}

export interface Group {
  id: string;
  name: string;
  color?: string;
  sortOrder?: number;
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

export interface Booking {
  id: string;
  items: BookingItem[];
  projectId: string;
  startDate: string;
  endDate: string;
}
