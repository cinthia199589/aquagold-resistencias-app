import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB3DC17qeItdOfnl1r7kl_WzS61MMTDu6g',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studio-6276322063-5d9d6.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-6276322063-5d9d6',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-6276322063-5d9d6.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '725463781946',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:725463781946:web:57b8c03f42060ec4eb5b03'
};

// Debug: Log Firebase config en desarrollo
if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
}

// Verificar si Firebase está configurado correctamente
const isFirebaseConfigured = 
  firebaseConfig.apiKey !== 'demo-api-key' && 
  firebaseConfig.projectId !== 'demo-project';

// Inicializar Firebase solo si no existe una instancia y está configurado
let app: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.log('✅ Firebase Firestore inicializado correctamente');
    console.log('📊 Proyecto:', firebaseConfig.projectId);
    console.log('📝 Nota: Las fotos se guardan en OneDrive, no en Firebase Storage');
  } catch (error) {
    console.error('❌ Firebase no pudo inicializarse:', error);
    console.warn('⚠️ La app funcionará sin base de datos.');
  }
} else {
  console.error('❌ Firebase NO está configurado. Configura las variables de entorno en .env.local');
}

// Solo exportamos db - storage ya no se usa
export { db };