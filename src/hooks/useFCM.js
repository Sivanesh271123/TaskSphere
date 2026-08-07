import { useEffect, useState, useRef, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../utils/firebase';

export default function useFCM(addToast, addNotification) {
  const [fcmToken, setFcmToken] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  
  const tokenRequested = useRef(false);

  const requestPermissionAndToken = useCallback(async () => {
    if (!messaging) return;
    try {
      if (tokenRequested.current) return;
      tokenRequested.current = true;

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        
        if (!vapidKey || vapidKey === 'your_vapid_key_here') {
          console.warn('VAPID key is missing or default. Please add it to your .env file to generate FCM tokens.');
          return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: registration 
        });
        
        if (token) {
          setFcmToken(token);
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
    } finally {
      tokenRequested.current = false;
    }
  }, []);

  useEffect(() => {
    if (!messaging) return;

    if (Notification.permission === 'granted') {
      requestPermissionAndToken();
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const title = payload.notification?.title || 'New Notification';
      const body = payload.notification?.body || 'You have a new update.';
      
      if (addToast) addToast(`${title}: ${body}`, 'info');
      if (addNotification) addNotification(`${title}: ${body}`);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      tokenRequested.current = false;
    };
  }, [addToast, addNotification, requestPermissionAndToken]);

  return { fcmToken, permission, initializeFCM: requestPermissionAndToken };
}
