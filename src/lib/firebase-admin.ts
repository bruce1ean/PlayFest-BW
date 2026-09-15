// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2igVMfeDfVQOczi4kxsNIgmQV0j9cm_M",
  authDomain: "playfestbw-2301a.firebaseapp.com",
  databaseURL: "https://playfestbw-2301a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "playfestbw-2301a",
  storageBucket: "playfestbw-2301a.firebasestorage.app",
  messagingSenderId: "525377597069",
  appId: "1:525377597069:web:a2053a1d1d0e9117f17cc4",
  measurementId: "G-WCJ0QWY6NG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
