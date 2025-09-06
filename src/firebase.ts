import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAxztUAD816Iq9ALznA175QuPgib8kWA3U",
  authDomain: "team24-7.firebaseapp.com",
  projectId: "team24-7",
  storageBucket: "team24-7.firebasestorage.app",
  messagingSenderId: "433461983643",
  appId: "1:433461983643:web:f281e9d75bf5ccc38dc93e"
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