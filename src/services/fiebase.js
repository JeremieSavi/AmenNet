// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5T40J3W_GzW7PXyyZExvmfws39pecXWk",
  authDomain: "amennet2-2007e.firebaseapp.com",
  projectId: "amennet2-2007e",
  storageBucket: "amennet2-2007e.firebasestorage.app",
  messagingSenderId: "413590298573",
  appId: "1:413590298573:web:8d5c9e538658bba2ee6e84"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()

export default app;