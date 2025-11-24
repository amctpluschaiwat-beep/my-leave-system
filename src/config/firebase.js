// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDD34CApVBxPrIWyYD86cxKxvK7Db7VnUw",
  authDomain: "tplus-leave-final.firebaseapp.com",
  databaseURL: "https://tplus-leave-final-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tplus-leave-final",
  storageBucket: "tplus-leave-final.firebasestorage.app",
  messagingSenderId: "408063107897",
  appId: "1:408063107897:web:6c5f693872fa05daad7ee8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;