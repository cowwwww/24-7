import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBeY8Ilf8qQJ7XtaiRmO2oO4jOcs4alveY",
  authDomain: "edurate-2b89a.firebaseapp.com",
  projectId: "edurate-2b89a",
  storageBucket: "edurate-2b89a.firebasestorage.app",
  messagingSenderId: "165836154723",
  appId: "1:165836154723:web:65e52808348b962bff5556",
  measurementId: "G-5DW4F4PGJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

export default app; 