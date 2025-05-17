
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration as provided
const firebaseConfig = {
  apiKey: "AIzaSyA1ro1aav-8QGVAJ0TAcKSnai5BRf-QZpE",
  authDomain: "trivimaster-k8of6.firebaseapp.com",
  projectId: "trivimaster-k8of6",
  storageBucket: "trivimaster-k8of6.firebasestorage.app", // Used as provided
  messagingSenderId: "489367812869",
  appId: "1:489367812869:web:2db4b786b3d183ea7dd56c",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // You might want to add this if you have it
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
// const firestore = getFirestore(app);
// const storage = getStorage(app);

export { app, auth /*, firestore, storage */ };
