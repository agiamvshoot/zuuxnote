# ZuuXNote (PWA)

Aplikasi catatan yang bisa **di-install** di HP dan PC seperti aplikasi asli
(ikon di layar utama, jalan dalam jendela sendiri tanpa address bar browser,
dan tetap bisa dipakai walau offline).

## Kenapa harus di-hosting dulu?

Browser hanya mengizinkan instalasi PWA & sinkronisasi dari alamat **https://**
(bukan file HTML yang dibuka langsung dari komputer). Jadi langkah pertama
adalah menaruh folder ini di suatu tempat yang punya alamat https — gratis dan
cepat lewat GitHub Pages:

1. Buat repository baru di GitHub (mis. `zuuxnote`).
2. Upload semua file di folder ini ke repository tersebut (lewat web GitHub:
   "Add file" → "Upload files", drag semua file & folder `icons/`).
3. Masuk ke **Settings → Pages**, pilih branch `main` dan folder `/root`, klik Save.
4. Tunggu 1–2 menit, GitHub akan memberi alamat seperti:
   `https://namaanda.github.io/zuuxnote/`
5. Buka alamat itu di HP dan PC.

## Cara install jadi aplikasi

- **Android (Chrome):** buka alamat di atas → akan muncul tombol
  "⬇ Install aplikasi" di pojok kanan atas, atau lewat menu titik tiga →
  "Install app" / "Add to Home screen".
- **iPhone (Safari):** buka alamat → tombol Share (kotak dengan panah) →
  "Add to Home Screen".
- **PC (Chrome/Edge):** ikon install akan muncul di address bar (ikon layar
  kecil dengan panah), atau klik tombol "⬇ Install aplikasi" di header.

Setelah di-install, ZuuXNote akan punya ikon sendiri dan terbuka seperti
aplikasi biasa, terpisah dari browser.

## Cara mengaktifkan sinkronisasi PC ⟷ HP

Tanpa langkah ini, ZuuXNote tetap berfungsi penuh tapi catatan hanya
tersimpan lokal di masing-masing perangkat (tidak saling terhubung).

1. Buka https://console.firebase.google.com → **Add project** (gratis, tanpa kartu kredit).
2. Di dalam project, klik ikon **Web (`</>`)** untuk mendaftarkan web app →
   beri nama bebas → Firebase akan menampilkan objek `firebaseConfig`.
3. Buka file `firebase-config.js` di folder ini, ganti isinya dengan objek
   yang baru saja Anda salin.
4. Di menu Firebase, buka **Build → Firestore Database → Create database** →
   pilih **mode test** (paling mudah untuk pemakaian pribadi) → pilih lokasi
   server terdekat → Create.
5. Upload ulang `firebase-config.js` yang sudah diisi ke repository GitHub Anda
   (menimpa file lama).
6. Buka ZuuXNote di PC → klik "Kode sinkron" di header → catat 6 karakter
   kode yang muncul.
7. Buka ZuuXNote di HP → klik "Kode sinkron" → masukkan kode yang sama di
   kolom "Gabung".
8. Kedua perangkat sekarang berbagi catatan yang sama secara real-time.

**Catatan keamanan:** dalam mode test, siapa pun yang tahu kode 6 karakter
Anda bisa membaca/menulis catatan di ruang itu. Ini cukup aman untuk catatan
pribadi biasa selama kodenya tidak dibagikan sembarangan. Jangan simpan
password atau data sangat sensitif di dalamnya.

## Struktur file

```
index.html      → tampilan utama
style.css        → tema visual
app.js           → logika aplikasi (catatan, penyimpanan lokal, sinkronisasi)
manifest.json    → identitas aplikasi (nama, ikon, warna) untuk instalasi
sw.js            → service worker, bikin aplikasi bisa jalan offline
firebase-config.js → isi ini untuk mengaktifkan sinkronisasi (opsional)
icons/           → ikon aplikasi
```
