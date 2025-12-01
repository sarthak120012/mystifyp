import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDLp5DAqWN4CSFDT9sQSPI6VoHEAJyl39Y",
    authDomain: "mystify-1ef42.firebaseapp.com",
    projectId: "mystify-1ef42",
    storageBucket: "mystify-1ef42.firebasestorage.app",
    messagingSenderId: "1069368875140",
    appId: "1:1069368875140:web:e0797ae936e4dc9d920ad1"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: 'YOUR_VAPID_KEY_HERE' // You'll need to generate this in Firebase Console
            });
            console.log('Notification token:', token);
            return token;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
