export interface Canteen {
  id: string;
  name: string;
  location: string;
  description?: string;
  imageUrl?: string;
  averageWaitTime: number; // in minutes
  currentWaitTime: number; // in minutes
  totalRatings: number;
  averageRating: number;
  operatingHours: {
    open: string; // "08:00"
    close: string; // "20:00"
  };
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitTimeEntry {
  id: string;
  canteenId: string;
  userId: string;
  waitTime: number; // in minutes
  timestamp: Date;
  timeOfDay: string; // "breakfast", "lunch", "dinner", "snack"
  dayOfWeek: string; // "monday", "tuesday", etc.
  queueLength?: number; // estimated number of people in queue
  notes?: string;
}

export interface CanteenRating {
  id: string;
  canteenId: string;
  userId: string;
  rating: number; // 1-5 stars
  waitTime: number; // in minutes
  timestamp: Date;
  timeOfDay: string;
  dayOfWeek: string;
  foodQuality?: number; // 1-5 stars
  serviceQuality?: number; // 1-5 stars
  cleanliness?: number; // 1-5 stars
  valueForMoney?: number; // 1-5 stars
  comment?: string;
}
