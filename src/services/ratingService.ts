import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Rating } from '../types/Rating';

// Generate a simple anonymous user ID based on browser fingerprint
const getAnonymousUserId = (): string => {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    // Create a simple ID based on screen resolution, timezone, and random string
    const fingerprint = [
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
      Math.random().toString(36).substring(2, 15)
    ].join('-');
    userId = btoa(fingerprint).substring(0, 20);
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
};

// Check if user has already rated this professor
export const hasUserRatedProfessor = (professorName: string, university: string): boolean => {
  const ratedProfessors = JSON.parse(localStorage.getItem('rated_professors') || '[]');
  const professorKey = `${professorName}-${university}`;
  return ratedProfessors.includes(professorKey);
};

// Mark professor as rated by this user
const markProfessorAsRated = (professorName: string, university: string): void => {
  const ratedProfessors = JSON.parse(localStorage.getItem('rated_professors') || '[]');
  const professorKey = `${professorName}-${university}`;
  if (!ratedProfessors.includes(professorKey)) {
    ratedProfessors.push(professorKey);
    localStorage.setItem('rated_professors', JSON.stringify(ratedProfessors));
  }
};

export const addRating = async (rating: Omit<Rating, 'id' | 'createdAt'>): Promise<void> => {
  try {
    // Check if user has already rated this professor
    if (hasUserRatedProfessor(rating.professorName, rating.university)) {
      throw new Error('You have already rated this professor. Each person can only rate once per professor.');
    }

    const anonymousUserId = getAnonymousUserId();

    const ratingData = {
      ...rating,
      userId: anonymousUserId,
      createdAt: Timestamp.now()
    };

    console.log('Attempting to save rating data:', ratingData);
    
    const docRef = await addDoc(collection(db, 'rate'), ratingData);
    console.log('Rating saved successfully with ID:', docRef.id);
    
    // Mark this professor as rated by this user
    markProfessorAsRated(rating.professorName, rating.university);
    
  } catch (error: any) {
    console.error('Detailed error in addRating:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    if (error.message.includes('already rated')) {
      throw error; // Re-throw our custom duplicate rating error
    } else if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please try again.');
    } else {
      throw new Error(`Failed to save rating: ${error.message}`);
    }
  }
};

export const getRatings = async (): Promise<Rating[]> => {
  try {
    const ratingsQuery = query(
      collection(db, 'rate'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ratingsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Rating[];
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw new Error('Failed to fetch ratings');
  }
};

export const getRatingsByProfessor = async (professorName: string, university: string): Promise<Rating[]> => {
  try {
    const ratingsQuery = query(
      collection(db, 'rate'),
      where('professorName', '==', professorName),
      where('university', '==', university),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ratingsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Rating[];
  } catch (error) {
    console.error('Error fetching professor ratings:', error);
    throw new Error('Failed to fetch professor ratings');
  }
}; 