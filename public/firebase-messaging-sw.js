// This file must be placed in the public/ folder

// Import scripts from CDN (required for Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Web Push Service Worker configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7b3pSAO-rHHikXTOkKJTd5K-vX6k7MOk",
  authDomain: "tasksphere-601aa.firebaseapp.com",
  projectId: "tasksphere-601aa",
  storageBucket: "tasksphere-601aa.firebasestorage.app",
  messagingSenderId: "777616382245",
  appId: "1:777616382245:web:6d48522da1fd01e463e2cc"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'TaskSphere Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new task update.',
    icon: '/hero_gold.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
