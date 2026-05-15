import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCohGlypElsD0FA5ETbhSJNLCJ896qjd4s',
  authDomain: 'sleepapp-3cefd.firebaseapp.com',
  projectId: 'sleepapp-3cefd',
  storageBucket: 'sleepapp-3cefd.firebasestorage.app',
  messagingSenderId: '726295863277',
  appId: '1:726295863277:android:7601dfc0f39c352d4611e4',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;