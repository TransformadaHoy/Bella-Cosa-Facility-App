
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-D5GsMpJ6fFkCtSymae23JLLWslXyal4",
  authDomain: "bella-cosa-facility-9a1dc.firebaseapp.com",
  projectId: "bella-cosa-facility-9a1dc",
  storageBucket: "bella-cosa-facility-9a1dc.firebasestorage.app",
  messagingSenderId: "784965539190",
  appId: "1:784965539190:web:84c6c82a62e5012a081657",
  measurementId: "G-MXDBMRT3KN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
