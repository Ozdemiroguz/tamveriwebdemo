// Firebase Configuration - CDN Version
// Firebase config - Tamveri projesi

const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY,
    authDomain: window.FIREBASE_AUTH_DOMAIN,
    projectId: window.FIREBASE_PROJECT_ID,
    storageBucket: window.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.FIREBASE_APP_ID
};

// Firebase'i başlat (CDN'den yüklenen Firebase kullanarak)
const app = firebase.initializeApp(firebaseConfig);

// Firebase servislerini global olarak tanımla
window.auth = firebase.auth();
window.db = firebase.firestore();

// App key for mobile access - Güvenli mobil erişim anahtarı
window.APP_KEY = window.FIREBASE_APP_KEY;
