import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let messaging = null;

// Initialize Firebase
try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging and get a reference to the service
  // only if supported in the browser (e.g. not in Safari incognito)
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, messaging };
