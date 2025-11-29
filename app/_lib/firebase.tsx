import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAFUP7kEcgDEmE1gCXsZkDJZX4zlnqCC8U",
  authDomain: "bulky-2bb1e.firebaseapp.com",
  projectId: "bulky-2bb1e",
  storageBucket: "bulky-2bb1e.firebasestorage.app",
  messagingSenderId: "485995141761",
  appId: "1:485995141761:web:3564662808f22033de0b80"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);