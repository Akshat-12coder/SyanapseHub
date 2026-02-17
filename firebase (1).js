import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,  // ADD THIS
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";


/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyBU0zX7DwX62l62JYpo7u9OvVGcyAfqCmI",
  authDomain: "hackthon-e6cfb.firebaseapp.com",
  projectId: "hackthon-e6cfb",
  storageBucket: "hackthon-e6cfb.firebasestorage.app",
  messagingSenderId: "579837778239",
  appId: "1:579837778239:web:ba3352f7859f87992adb8a"
};

/* ================= INITIALIZE ================= */

const app = initializeApp(firebaseConfig);

/* ================= SERVICES ================= */

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* ================= EXPORT AUTH ================= */

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
};

/* ================= EXPORT FIRESTORE ================= */

export {
  doc,
  setDoc,
  getDoc,
  getDocs,  // ADD THIS
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
};


/* ================= EXPORT STORAGE ================= */

export {
  ref,
  uploadBytes,
  getDownloadURL
};
