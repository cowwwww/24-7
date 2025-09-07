import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserRating {
  id?: string;
  profileId: string; // ID of the profile being rated
  profileName: string; // Name of the user being rated
  raterId: string; // ID of the user giving the rating
  raterName: string; // Name of the user giving the rating
  rating: number; // 1-5 stars
  comment: string; // Required comment
  timestamp: Timestamp;
}

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

// Get a simple anonymous user name
const getAnonymousUserName = (): string => {
  let userName = localStorage.getItem('anonymous_user_name');
  if (!userName) {
    // Generate a random anonymous name
    const adjectives = ['Smart', 'Helpful', 'Kind', 'Friendly', 'Brilliant', 'Amazing', 'Cool', 'Awesome'];
    const nouns = ['Student', 'Learner', 'Scholar', 'Peer', 'Buddy', 'Friend', 'Helper', 'Tutor'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    userName = `${randomAdjective}${randomNoun}${randomNumber}`;
    localStorage.setItem('anonymous_user_name', userName);
  }
  return userName;
};

// Check if user has already rated this profile
export const hasUserRatedProfile = async (profileId: string): Promise<boolean> => {
  try {
    const raterId = getAnonymousUserId();
    const ratingsQuery = query(
      collection(db, 'userRatings'),
      where('profileId', '==', profileId),
      where('raterId', '==', raterId)
    );
    
    const querySnapshot = await getDocs(ratingsQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if user has rated profile:', error);
    return false;
  }
};

// Add a rating for a user profile
export const addUserRating = async (
  profileId: string, 
  profileName: string, 
  rating: number, 
  comment: string
): Promise<void> => {
  try {
    // Check if user has already rated this profile
    const hasRated = await hasUserRatedProfile(profileId);
    if (hasRated) {
      throw new Error('You have already rated this user. Each person can only rate once per user.');
    }

    const raterId = getAnonymousUserId();
    const raterName = getAnonymousUserName();

    const ratingData: Omit<UserRating, 'id'> = {
      profileId,
      profileName,
      raterId,
      raterName,
      rating,
      comment: comment.trim(),
      timestamp: Timestamp.now()
    };

    console.log('Attempting to save user rating:', ratingData);
    
    const docRef = await addDoc(collection(db, 'userRatings'), ratingData);
    console.log('User rating saved successfully with ID:', docRef.id);
    
  } catch (error: any) {
    console.error('Detailed error in addUserRating:', error);
    
    if (error.message.includes('already rated')) {
      throw error; // Re-throw our custom duplicate rating error
    } else if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please try again.');
    } else {
      throw new Error(`Failed to save rating: ${error.message}`);
    }
  }
};

// Get all ratings for a specific profile
export const getRatingsByProfile = async (profileId: string): Promise<UserRating[]> => {
  try {
    const ratingsQuery = query(
      collection(db, 'userRatings'),
      where('profileId', '==', profileId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(ratingsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserRating[];
  } catch (error) {
    console.error('Error fetching profile ratings:', error);
    return []; // Return empty array on error
  }
};

// Get all ratings (for admin purposes or global display)
export const getAllUserRatings = async (): Promise<UserRating[]> => {
  try {
    const ratingsQuery = query(
      collection(db, 'userRatings'),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(ratingsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserRating[];
  } catch (error) {
    console.error('Error fetching all user ratings:', error);
    return [];
  }
};

// Calculate average rating for a profile
export const getProfileAverageRating = async (profileId: string): Promise<{ averageRating: number, totalRatings: number }> => {
  try {
    const ratings = await getRatingsByProfile(profileId);
    
    if (ratings.length === 0) {
      return { averageRating: 0, totalRatings: 0 };
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length
    };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return { averageRating: 0, totalRatings: 0 };
  }
};

// Update a student profile with the latest ratings
export const updateProfileWithRatings = async (profileId: string): Promise<void> => {
  try {
    const ratings = await getRatingsByProfile(profileId);
    const { averageRating, totalRatings } = await getProfileAverageRating(profileId);

    // Update the profile document with current ratings
    const profileRef = doc(db, 'studentProfiles', profileId);
    await updateDoc(profileRef, {
      ratings: ratings,
      averageRating: averageRating,
      totalRatings: totalRatings
    });

    console.log('Profile updated with latest ratings');
  } catch (error) {
    console.error('Error updating profile with ratings:', error);
  }
};

// Get current user info
export const getCurrentUserInfo = () => {
  return {
    id: getAnonymousUserId(),
    name: getAnonymousUserName()
  };
};
