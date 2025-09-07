import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Time interval in minutes (30 minutes)
export const TIME_INTERVAL_MINUTES = 30;
export const INTERVALS_PER_DAY = 48; // 24 hours * 2 (30-min intervals)

export interface OccupancyData {
  id?: string;
  canteenId: string;
  canteenName: string;
  timestamp: Timestamp;
  occupancyLevel: 'low' | 'medium' | 'high';
  waitTime: number; // in minutes
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  timeInterval: number; // 0-47 (30-minute intervals)
  userId: string;
}

export interface PredictionData {
  canteenId: string;
  canteenName: string;
  dayOfWeek: number;
  timeInterval: number;
  predictedOccupancy: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  lastUpdated: Timestamp;
  historicalDataCount: number;
}

export interface TimeSlotPrediction {
  timeSlot: string; // e.g., "12:00-12:30"
  predictedOccupancy: 'low' | 'medium' | 'high';
  confidence: number;
  color: string;
}

// Simple ML algorithm for occupancy prediction
class OccupancyPredictor {
  private data: OccupancyData[] = [];
  
  // Train the model with historical data
  train(data: OccupancyData[]): void {
    this.data = data;
  }
  
  // Predict occupancy for a specific canteen, day, and time interval
  predict(canteenId: string, dayOfWeek: number, timeInterval: number): { occupancy: 'low' | 'medium' | 'high', confidence: number } {
    // Filter data for this canteen, day, and time interval
    const relevantData = this.data.filter(d => 
      d.canteenId === canteenId && 
      d.dayOfWeek === dayOfWeek && 
      d.timeInterval === timeInterval
    );
    
    if (relevantData.length === 0) {
      // No data available, return medium with low confidence
      return { occupancy: 'medium', confidence: 0.1 };
    }
    
    // Calculate occupancy distribution
    const occupancyCounts = {
      low: relevantData.filter(d => d.occupancyLevel === 'low').length,
      medium: relevantData.filter(d => d.occupancyLevel === 'medium').length,
      high: relevantData.filter(d => d.occupancyLevel === 'high').length
    };
    
    const total = relevantData.length;
    
    // Find the most common occupancy level
    const maxCount = Math.max(occupancyCounts.low, occupancyCounts.medium, occupancyCounts.high);
    let predictedOccupancy: 'low' | 'medium' | 'high' = 'medium';
    
    if (occupancyCounts.high === maxCount) {
      predictedOccupancy = 'high';
    } else if (occupancyCounts.low === maxCount) {
      predictedOccupancy = 'low';
    }
    
    // Calculate confidence based on data consistency and amount
    const consistency = maxCount / total;
    const dataAmount = Math.min(total / 10, 1); // More data = higher confidence, capped at 1
    const confidence = (consistency * 0.7 + dataAmount * 0.3);
    
    return { occupancy: predictedOccupancy, confidence };
  }
  
  // Get predictions for all time slots of a day
  getDayPredictions(canteenId: string, dayOfWeek: number): TimeSlotPrediction[] {
    const predictions: TimeSlotPrediction[] = [];
    
    for (let interval = 0; interval < INTERVALS_PER_DAY; interval++) {
      const { occupancy, confidence } = this.predict(canteenId, dayOfWeek, interval);
      const timeSlot = this.getTimeSlotString(interval);
      const color = this.getOccupancyColor(occupancy, confidence);
      
      predictions.push({
        timeSlot,
        predictedOccupancy: occupancy,
        confidence,
        color
      });
    }
    
    return predictions;
  }
  
  private getTimeSlotString(interval: number): string {
    const hours = Math.floor(interval / 2);
    const minutes = (interval % 2) * 30;
    const nextHours = Math.floor((interval + 1) / 2);
    const nextMinutes = ((interval + 1) % 2) * 30;
    
    const formatTime = (h: number, m: number) => 
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    
    return `${formatTime(hours, minutes)}-${formatTime(nextHours, nextMinutes)}`;
  }
  
  private getOccupancyColor(occupancy: 'low' | 'medium' | 'high', confidence: number): string {
    const alpha = Math.max(0.3, confidence);
    
    switch (occupancy) {
      case 'low':
        return `rgba(76, 175, 80, ${alpha})`; // Green
      case 'medium':
        return `rgba(255, 152, 0, ${alpha})`; // Orange
      case 'high':
        return `rgba(244, 67, 54, ${alpha})`; // Red
      default:
        return `rgba(158, 158, 158, ${alpha})`; // Gray
    }
  }
}

// Global predictor instance
const predictor = new OccupancyPredictor();

// Store occupancy data
export const storeOccupancyData = async (data: Omit<OccupancyData, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'occupancyData'), data);
    console.log('Occupancy data stored successfully');
  } catch (error) {
    console.error('Error storing occupancy data:', error);
    throw new Error('Failed to store occupancy data');
  }
};

// Get historical occupancy data
export const getHistoricalOccupancyData = async (canteenId?: string, daysBack: number = 30): Promise<OccupancyData[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    let q = query(
      collection(db, 'occupancyData'),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc')
    );
    
    if (canteenId) {
      q = query(
        collection(db, 'occupancyData'),
        where('canteenId', '==', canteenId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
        orderBy('timestamp', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OccupancyData[];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Failed to fetch historical data');
  }
};

// Train the model and get predictions
export const getCanteenPredictions = async (canteenId: string, dayOfWeek: number): Promise<TimeSlotPrediction[]> => {
  try {
    // Get historical data for this canteen
    const historicalData = await getHistoricalOccupancyData(canteenId, 30);
    
    // Train the model
    predictor.train(historicalData);
    
    // Get predictions for the day
    return predictor.getDayPredictions(canteenId, dayOfWeek);
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw new Error('Failed to get predictions');
  }
};

// Get predictions for all canteens
export const getAllCanteenPredictions = async (dayOfWeek: number): Promise<{ [canteenId: string]: TimeSlotPrediction[] }> => {
  try {
    const historicalData = await getHistoricalOccupancyData(undefined, 30);
    
    // Train the model with all data
    predictor.train(historicalData);
    
    // Get unique canteen IDs
    const canteenIds = [...new Set(historicalData.map(d => d.canteenId))];
    
    const predictions: { [canteenId: string]: TimeSlotPrediction[] } = {};
    
    for (const canteenId of canteenIds) {
      predictions[canteenId] = predictor.getDayPredictions(canteenId, dayOfWeek);
    }
    
    return predictions;
  } catch (error) {
    console.error('Error getting all predictions:', error);
    throw new Error('Failed to get all predictions');
  }
};

// Store prediction results for caching
export const storePredictionCache = async (canteenId: string, dayOfWeek: number, predictions: TimeSlotPrediction[]): Promise<void> => {
  try {
    const cacheData = {
      canteenId,
      dayOfWeek,
      predictions,
      lastUpdated: Timestamp.now(),
      historicalDataCount: (await getHistoricalOccupancyData(canteenId, 30)).length
    };
    
    await setDoc(doc(db, 'predictionCache', `${canteenId}_${dayOfWeek}`), cacheData);
  } catch (error) {
    console.error('Error storing prediction cache:', error);
  }
};

// Get cached predictions
export const getCachedPredictions = async (canteenId: string, dayOfWeek: number): Promise<TimeSlotPrediction[] | null> => {
  try {
    const docRef = doc(db, 'predictionCache', `${canteenId}_${dayOfWeek}`);
    const docSnap = await getDocs(query(collection(db, 'predictionCache'), where('__name__', '==', `${canteenId}_${dayOfWeek}`)));
    
    if (!docSnap.empty) {
      const data = docSnap.docs[0].data();
      const lastUpdated = data.lastUpdated.toDate();
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      // Cache is valid for 6 hours
      if (hoursSinceUpdate < 6) {
        return data.predictions;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached predictions:', error);
    return null;
  }
};

// Helper function to get current time interval
export const getCurrentTimeInterval = (): number => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours * 2 + Math.floor(minutes / 30);
};

// Helper function to get day of week
export const getCurrentDayOfWeek = (): number => {
  return new Date().getDay();
};

// Helper function to get time slot string from interval
export const getTimeSlotString = (interval: number): string => {
  const hours = Math.floor(interval / 2);
  const minutes = (interval % 2) * 30;
  const nextHours = Math.floor((interval + 1) / 2);
  const nextMinutes = ((interval + 1) % 2) * 30;
  
  const formatTime = (h: number, m: number) => 
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  
  return `${formatTime(hours, minutes)}-${formatTime(nextHours, nextMinutes)}`;
};
