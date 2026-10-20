import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Reemplazar con las credenciales de tu proyecto Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyBqAhKXhei1d_SYmhnbxMSWCNYZ6gSZPV0",
  authDomain: "lavadero-klin.firebaseapp.com",
  projectId: "lavadero-klin",
  storageBucket: "lavadero-klin.firebasestorage.app",
  messagingSenderId: "641958724084",
  appId: "1:641958724084:web:e283d0f6f4617266d5f9a1"
};

let app = null;
let db = null;

if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
export default app;
