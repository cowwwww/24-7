import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Canteen, WaitTimeEntry, CanteenRating, WaitTimePrediction } from '../types/Canteen';

const CANTEENS_COLLECTION = 'canteens';
const WAIT_TIME_ENTRIES_COLLECTION = 'waitTimeEntries';
const CANTEEN_RATINGS_COLLECTION = 'canteenRatings';

// Canteen CRUD operations
export const getCanteens = async (): Promise<Canteen[]> => {
  try {
    const canteensRef = collection(db, CANTEENS_COLLECTION);
    const snapshot = await getDocs(canteensRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Canteen[];
  } catch (error) {
    console.error('Error fetching canteens:', error);
    throw error;
  }
};

export const getCanteenById = async (id: string): Promise<Canteen | null> => {
  try {
    const canteenRef = doc(db, CANTEENS_COLLECTION, id);
    const snapshot = await getDoc(canteenRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate() || new Date(),
        updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
      } as Canteen;
    }
    return null;
  } catch (error) {
    console.error('Error fetching canteen:', error);
    throw error;
  }
};

export const addCanteen = async (canteen: Omit<Canteen, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const canteensRef = collection(db, CANTEENS_COLLECTION);
    const docRef = await addDoc(canteensRef, {
      ...canteen,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding canteen:', error);
    throw error;
  }
};

// Wait time entry operations
export const addWaitTimeEntry = async (entry: Omit<WaitTimeEntry, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const entriesRef = collection(db, WAIT_TIME_ENTRIES_COLLECTION);
    const docRef = await addDoc(entriesRef, {
      ...entry,
      timestamp: serverTimestamp(),
    });
    
    // Update canteen's current wait time
    await updateCanteenWaitTime(entry.canteenId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding wait time entry:', error);
    throw error;
  }
};

export const getWaitTimeEntries = async (canteenId?: string, limitCount: number = 50): Promise<WaitTimeEntry[]> => {
  try {
    let q = query(
      collection(db, WAIT_TIME_ENTRIES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    if (canteenId) {
      q = query(
        collection(db, WAIT_TIME_ENTRIES_COLLECTION),
        where('canteenId', '==', canteenId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as WaitTimeEntry[];
  } catch (error) {
    console.error('Error fetching wait time entries:', error);
    throw error;
  }
};

// Canteen rating operations
export const addCanteenRating = async (rating: Omit<CanteenRating, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const ratingsRef = collection(db, CANTEEN_RATINGS_COLLECTION);
    const docRef = await addDoc(ratingsRef, {
      ...rating,
      timestamp: serverTimestamp(),
    });
    
    // Update canteen's average rating
    await updateCanteenRating(rating.canteenId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding canteen rating:', error);
    throw error;
  }
};

export const getCanteenRatings = async (canteenId: string): Promise<CanteenRating[]> => {
  try {
    const q = query(
      collection(db, CANTEEN_RATINGS_COLLECTION),
      where('canteenId', '==', canteenId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as CanteenRating[];
  } catch (error) {
    console.error('Error fetching canteen ratings:', error);
    throw error;
  }
};

// Helper functions
const updateCanteenWaitTime = async (canteenId: string): Promise<void> => {
  try {
    // Get recent wait time entries for this canteen (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const q = query(
      collection(db, WAIT_TIME_ENTRIES_COLLECTION),
      where('canteenId', '==', canteenId),
      where('timestamp', '>=', Timestamp.fromDate(twoHoursAgo)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data().waitTime as number);
    
    if (entries.length > 0) {
      const averageWaitTime = entries.reduce((sum, time) => sum + time, 0) / entries.length;
      const currentWaitTime = entries[0]; // Most recent entry
      
      const canteenRef = doc(db, CANTEENS_COLLECTION, canteenId);
      await updateDoc(canteenRef, {
        averageWaitTime: Math.round(averageWaitTime * 10) / 10,
        currentWaitTime: Math.round(currentWaitTime * 10) / 10,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating canteen wait time:', error);
  }
};

const updateCanteenRating = async (canteenId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, CANTEEN_RATINGS_COLLECTION),
      where('canteenId', '==', canteenId)
    );
    
    const snapshot = await getDocs(q);
    const ratings = snapshot.docs.map(doc => doc.data().rating as number);
    
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      
      const canteenRef = doc(db, CANTEENS_COLLECTION, canteenId);
      await updateDoc(canteenRef, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating canteen rating:', error);
  }
};

// Prediction functions
export const getWaitTimePrediction = async (canteenId: string, timeOfDay: string, dayOfWeek: string): Promise<WaitTimePrediction | null> => {
  try {
    // Get historical data for similar time periods
    const q = query(
      collection(db, WAIT_TIME_ENTRIES_COLLECTION),
      where('canteenId', '==', canteenId),
      where('timeOfDay', '==', timeOfDay),
      where('dayOfWeek', '==', dayOfWeek),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data().waitTime as number);
    
    if (entries.length === 0) {
      return null;
    }
    
    // Calculate prediction based on historical data
    const averageWaitTime = entries.reduce((sum, time) => sum + time, 0) / entries.length;
    const variance = entries.reduce((sum, time) => sum + Math.pow(time - averageWaitTime, 2), 0) / entries.length;
    const confidence = Math.max(0, Math.min(1, 1 - (Math.sqrt(variance) / averageWaitTime)));
    
    return {
      canteenId,
      predictedWaitTime: Math.round(averageWaitTime * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      basedOnEntries: entries.length,
      timeOfDay,
      dayOfWeek,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error getting wait time prediction:', error);
    return null;
  }
};

// Utility functions
export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'closed';
};

export const getDayOfWeek = (): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

export const isCanteenOpen = (operatingHours: { open: string; close: string }): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [openHour, openMin] = operatingHours.open.split(':').map(Number);
  const [closeHour, closeMin] = operatingHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
};
