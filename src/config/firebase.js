// src/config/firebase.js
import { Platform } from 'react-native';
import '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import ReactNativeFirebase from '@react-native-firebase/app';
import androidGoogleServices from '../../google-services.json';

const androidProjectInfo = androidGoogleServices.project_info || {};
const androidClient = androidGoogleServices.client?.[0] || {};
const androidApiKey = androidClient.api_key?.[0]?.current_key || '';
const androidAppId = androidClient.client_info?.mobilesdk_app_id || '';

const androidFirebaseConfig = {
  apiKey: androidApiKey,
  authDomain: `${androidProjectInfo.project_id}.firebaseapp.com`,
  projectId: androidProjectInfo.project_id,
  storageBucket: androidProjectInfo.storage_bucket,
  messagingSenderId: androidProjectInfo.project_number,
  appId: androidAppId,
};

const iosFirebaseConfig = {
  apiKey: 'AIzaSyAdeA_ajVV9k9JlypC2pXAZJFhQfEfF5IQ',
  authDomain: 'sleepapp-3cefd.firebaseapp.com',
  projectId: 'sleepapp-3cefd',
  storageBucket: 'sleepapp-3cefd.firebasestorage.app',
  messagingSenderId: '726295863277',
  appId: '1:726295863277:ios:32ef87826d62effc4611e4',
};

const firebaseConfig = Platform.OS === 'ios' ? iosFirebaseConfig : androidFirebaseConfig;

let firebase;

try {
  firebase = ReactNativeFirebase.initializeApp(firebaseConfig);
} catch (err) {
  // Firebase ya inicializado
}

export const auth = ReactNativeFirebase.auth();
export const db = ReactNativeFirebase.firestore();

export default firebase;
