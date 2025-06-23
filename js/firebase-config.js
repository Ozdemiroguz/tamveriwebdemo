// Firebase Configuration - CDN Version
// Firebase config - Tamveri projesi

const firebaseConfig = {
    apiKey: "AIzaSyDw0lZEHtTVIKXauFMHuBPa42M2vaq54QU",
    authDomain: "tamveri.firebaseapp.com",
    projectId: "tamveri",
    storageBucket: "tamveri.firebasestorage.app",
    messagingSenderId: "1093568528912",
    appId: "1:1093568528912:web:5a1733ad1e0356055a8095"
};

// Firebase'i başlat (CDN'den yüklenen Firebase kullanarak)
const app = firebase.initializeApp(firebaseConfig);

// Firebase servislerini global olarak tanımla
window.auth = firebase.auth();
window.db = firebase.firestore();

// App key for mobile access - Güvenli mobil erişim anahtarı
window.APP_KEY = "SECRET";
