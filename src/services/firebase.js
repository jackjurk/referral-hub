import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAn9rVga5ba3iIiXwZGvaVCFdOLPHG7L18",
  authDomain: "referralboys.firebaseapp.com",
  projectId: "referralboys",
  storageBucket: "referralboys.appspot.com",
  messagingSenderId: "99752458579",
  appId: "1:99752458579:web:1f2da7ceca57507d0709a6",
  measurementId: "G-S0C3MNQ5N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Log initialization
console.log('Firebase initialized with project:', firebaseConfig.projectId);

export { auth, db };
