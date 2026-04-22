import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAe1xX20eBj2Zb5HVZR3jsh7Aa1fp-mu_A",
  authDomain: "pharmai-38907.firebaseapp.com",
  projectId: "pharmai-38907",
  storageBucket: "pharmai-38907.firebasestorage.app",
  messagingSenderId: "1052723358649",
  appId: "1:1052723358649:web:612e0220af490ff6982468"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence as originally done
setPersistence(auth, browserSessionPersistence).catch(e => console.warn('Persistence error:', e));
