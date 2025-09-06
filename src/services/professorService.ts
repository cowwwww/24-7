import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Professor } from '../types/Professor';

// Generate a simple anonymous user ID for tracking who added professors
const getAnonymousUserId = (): string => {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
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

export const addProfessor = async (professor: Omit<Professor, 'id' | 'createdAt' | 'addedBy'>): Promise<void> => {
  try {
    const anonymousUserId = getAnonymousUserId();

    const professorData = {
      ...professor,
      addedBy: anonymousUserId,
      createdAt: Timestamp.now(),
      isVerified: false
    };

    console.log('Adding professor:', professorData);
    
    const docRef = await addDoc(collection(db, 'professors'), professorData);
    console.log('Professor added successfully with ID:', docRef.id);
  } catch (error: any) {
    console.error('Error adding professor:', error);
    
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please try again.');
    } else {
      throw new Error(`Failed to add: ${error.message}`);
    }
  }
};

export const getProfessors = async (): Promise<Professor[]> => {
  try {
    const professorsQuery = query(
      collection(db, 'professors'),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(professorsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Professor[];
  } catch (error) {
    console.error('Error fetching professors:', error);
    throw new Error('Failed to fetch professors');
  }
};

export const getProfessorsByUniversity = async (university: string): Promise<Professor[]> => {
  try {
    const professorsQuery = query(
      collection(db, 'professors'),
      where('university', '==', university),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(professorsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Professor[];
  } catch (error) {
    console.error('Error fetching professors by university:', error);
    throw new Error('Failed to fetch professors');
  }
};

export const getProfessorById = async (professorId: string): Promise<Professor | null> => {
  try {
    const docRef = doc(db, 'professors', professorId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate()
      } as Professor;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching professor:', error);
    throw new Error('Failed to fetch professor details');
  }
}; 