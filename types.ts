
export type Priority = 'Low' | 'Medium' | 'High';
export type WorkOrderStatus = 'PENDING' | 'IN PROGRESS' | 'COMPLETED';

export interface WorkOrder {
  id: string;
  title: string;
  location: string;
  system: string;
  priority: Priority;
  status: WorkOrderStatus;
  date: string;
  dueDate: string;
  image?: string | null;
  resolution?: string;
}

export interface PMTask {
  id: string;
  title: string;
  location: string;
  system: string;
  frequency: string;
  dueDate: string;
  status: 'Upcoming' | 'Scheduled' | 'Completed';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface CalendarEvent {
  date: string;
  title: string;
  type: 'Event' | 'NoWedding';
}
