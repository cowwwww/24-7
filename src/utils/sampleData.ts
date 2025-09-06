import { addCanteen } from '../services/canteenService';
import type { Canteen } from '../types/Canteen';

export const sampleCanteens: Omit<Canteen, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Main Campus Canteen',
    location: 'Building A, Ground Floor',
    description: 'The main canteen serving a variety of local and international dishes. Features both halal and vegetarian options.',
    averageWaitTime: 8.5,
    currentWaitTime: 12,
    totalRatings: 45,
    averageRating: 4.2,
    operatingHours: {
      open: '07:00',
      close: '20:00',
    },
    isOpen: true,
  },
  {
    name: 'Express Food Court',
    location: 'Student Center, Level 2',
    description: 'Quick service food court with fast food options, coffee, and snacks. Perfect for busy students.',
    averageWaitTime: 5.2,
    currentWaitTime: 3,
    totalRatings: 32,
    averageRating: 3.8,
    operatingHours: {
      open: '08:00',
      close: '22:00',
    },
    isOpen: true,
  },
  {
    name: 'Healthy Bites',
    location: 'Library Building, Basement',
    description: 'Health-focused canteen offering salads, smoothies, and organic meals. Great for health-conscious students.',
    averageWaitTime: 6.8,
    currentWaitTime: 8,
    totalRatings: 28,
    averageRating: 4.5,
    operatingHours: {
      open: '08:30',
      close: '18:00',
    },
    isOpen: true,
  },
  {
    name: 'International Cuisine',
    location: 'International Student Center',
    description: 'Diverse international menu featuring Asian, Middle Eastern, and European dishes.',
    averageWaitTime: 10.3,
    currentWaitTime: 15,
    totalRatings: 38,
    averageRating: 4.1,
    operatingHours: {
      open: '11:00',
      close: '19:00',
    },
    isOpen: true,
  },
  {
    name: 'Coffee Corner',
    location: 'Engineering Building, Lobby',
    description: 'Small coffee shop with light snacks, sandwiches, and beverages. Quick service for coffee breaks.',
    averageWaitTime: 3.5,
    currentWaitTime: 2,
    totalRatings: 67,
    averageRating: 4.3,
    operatingHours: {
      open: '07:30',
      close: '17:30',
    },
    isOpen: true,
  },
  {
    name: 'Night Owl Diner',
    location: 'Residence Hall, Ground Floor',
    description: 'Late-night dining option for students studying late. Open until midnight with comfort food.',
    averageWaitTime: 7.2,
    currentWaitTime: 5,
    totalRatings: 23,
    averageRating: 3.9,
    operatingHours: {
      open: '18:00',
      close: '00:00',
    },
    isOpen: true,
  },
];

export const initializeSampleCanteens = async (): Promise<void> => {
  try {
    console.log('Initializing sample canteens...');
    
    for (const canteen of sampleCanteens) {
      try {
        await addCanteen(canteen);
        console.log(`Added canteen: ${canteen.name}`);
      } catch (error) {
        console.error(`Error adding canteen ${canteen.name}:`, error);
      }
    }
    
    console.log('Sample canteens initialization completed!');
  } catch (error) {
    console.error('Error initializing sample canteens:', error);
  }
};
