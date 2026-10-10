import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBc9m8-RstJj8fuLLyYJkVPOlQbSlmm4Dw",
  authDomain: "smart-enose97.firebaseapp.com",
  databaseURL:
    "https://smart-enose97-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-enose97",
  storageBucket: "smart-enose97.firebasestorage.app",
  messagingSenderId: "991446243691",
  appId: "1:991446243691:web:fe16048a19f47013cdd42e",
  measurementId: "G-FMBPZP08QX",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;