import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Code Crashers Portal - Firebase Web App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPAg6kvdjnc-WxsuWuOqzI2TY9klykl5A",
  authDomain: "portal-of-code-crashers.firebaseapp.com",
  projectId: "portal-of-code-crashers",
  storageBucket: "portal-of-code-crashers.firebasestorage.app",
  messagingSenderId: "245296924280",
  appId: "1:245296924280:web:bebcd5e8bcd0e6c30e4f8d",
  measurementId: "G-J4HRZRDJJ9"
};

let app = null;
let auth = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();
} catch (err) {
  console.warn('[Firebase Init Warning]', err);
}

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber, firebaseConfig };
