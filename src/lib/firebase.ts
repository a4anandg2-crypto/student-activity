import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCn28BgpOy0Am9CK-bmiSQzpgwFbpvXpuU",
  authDomain: "student-activity-90a2f.firebaseapp.com",
  projectId: "student-activity-90a2f",
  storageBucket: "student-activity-90a2f.firebasestorage.app",
  messagingSenderId: "640286888398",
  appId: "1:640286888398:web:2419e1a1db2e426abe1b9f",
  measurementId: "G-KEK0V9G7K9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();