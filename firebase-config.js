// ============================================================
// KONFIGURASI SINKRONISASI ZuuXNote (OPSIONAL)
// ============================================================
// Tanpa mengisi ini, ZuuXNote tetap berfungsi penuh secara LOKAL
// di masing-masing perangkat (tersimpan di penyimpanan browser),
// tapi TIDAK akan tersinkron antar perangkat.
//
// Untuk mengaktifkan sinkronisasi PC <-> HP:
// 1. Buka https://console.firebase.google.com -> buat project baru (gratis).
// 2. Di project itu, tambahkan "Web App" -> salin objek firebaseConfig yang muncul.
// 3. Aktifkan "Firestore Database" (mode production atau test, keduanya bisa).
// 4. Tempelkan konfigurasi Anda menggantikan objek di bawah ini.
// 5. Deploy ulang / unggah ulang folder ini ke hosting Anda.
//
// Catatan keamanan: Firestore dalam mode test bersifat publik untuk siapa
// saja yang tahu "kode sinkron" Anda (dibuat otomatis oleh aplikasi).
// Cukup aman untuk catatan pribadi biasa, tapi jangan simpan data sensitif
// (password, dsb) di sini.
// ============================================================

window.ZUUXNOTE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBnuoFH55YXLHYZXlnKy6L6_4JFDGFRVR8",
  authDomain: "zuuxnote.firebaseapp.com",
  projectId: "zuuxnote",
  storageBucket: "zuuxnote.firebasestorage.app",
  messagingSenderId: "213026427336",
  appId: "1:213026427336:web:aa431a9ed4a966e8b470fd"
};
