// ============================================================
//  HAPPYBAND — FIREBASE CONFIG
//  Replace the values below with YOUR Firebase project keys.
//  See README.txt for step-by-step instructions.
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBfB27aO5ilefkxrfia9lrliIAbpO0Dt8A",
  authDomain: "happyband-28987.firebaseapp.com",
  projectId: "happyband-28987",
  storageBucket: "happyband-28987.firebasestorage.app",
  messagingSenderId: "759420274898",
  appId: "1:759420274898:web:caefd6ac4e775a87f4850b"
};

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
