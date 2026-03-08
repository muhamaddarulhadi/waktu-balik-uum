# 🕐 Waktu Balik UUM

> Kira masa pulang kerja staf UUM secara automatik

🔗 **Live App:** [muhamaddarulhadi.github.io/waktu-balik-uum](https://muhamaddarulhadi.github.io/waktu-balik-uum/)

---

## Tentang App

**Waktu Balik UUM** adalah Progressive Web App (PWA) yang membantu staf UUM mengira masa boleh pulang berdasarkan masa tiba di pejabat. App ini mengambil kira waktu bekerja standard, mod Khamis, dan mod Ramadan secara automatik.

---

## Ciri-Ciri

- ⏱️ **Kira masa pulang** — masukkan masa tiba, app kira bila boleh balik
- 📅 **Auto detect hari Khamis** — mod Khamis aktif secara automatik setiap hari Khamis
- 🌙 **Mod Ramadan** — toggle untuk kurangkan 30 minit waktu bekerja
- ⌨️ **Input fleksibel** — boleh taip terus atau guna butang atas/bawah (tahan untuk tukar cepat)
- 🔔 **Toggle peringatan notifikasi** — klik sekali untuk aktif, klik lagi untuk matikan
- 📊 **Progress bar** — tunjuk kemajuan waktu bekerja dalam masa nyata
- 💾 **Auto simpan sesi** — data dikembalikan semula bila refresh atau buka balik app (sama hari sahaja)
- 📵 **Indicator offline** — tunjuk status sambungan internet
- 📲 **Boleh install** — tambah ke skrin utama seperti app biasa

---

## Waktu Bekerja

| Mod | Waktu Bekerja |
|-----|--------------|
| Biasa | 9 jam |
| Khamis | 7.5 jam |
| Ramadan | 8.5 jam |
| Ramadan + Khamis | 7 jam |

> Had masa tiba: 7:30 AM – 8:30 AM. Jika tiba lepas 8:30 AM, kiraan guna 8:30 AM.

---

## Cara Guna

1. Buka app di [muhamaddarulhadi.github.io/waktu-balik-uum](https://muhamaddarulhadi.github.io/waktu-balik-uum/)
2. Masukkan masa tiba (taip terus dalam kotak atau guna butang ▲▼)
3. Aktifkan toggle **Khamis** atau **Ramadan** jika berkenaan
4. Klik **Kira Waktu Pulang**
5. *(Pilihan)* Klik **Tetapkan Peringatan Pulang** untuk aktifkan notifikasi — klik semula untuk matikan

### Auto Simpan Sesi
- Selepas klik **Kira Waktu Pulang**, data (masa tiba, togol, keputusan) disimpan secara automatik
- Bila refresh atau buka semula app pada **hari yang sama**, data terus dipulihkan tanpa perlu kira semula
- Data akan **luput secara automatik** pada keesokan harinya

---

## Peringatan Notifikasi

Klik butang **Tetapkan Peringatan Pulang** untuk toggle notifikasi:

| Keadaan | Paparan Butang |
|---------|---------------|
| Belum aktif | 🔔 Tetapkan Peringatan Pulang |
| Aktif | 🔔 Notifikasi Aktif ✅ |

- Klik **sekali** → aktifkan, notifikasi akan berbunyi tepat pada masa boleh balik
- Klik **lagi** → matikan peringatan
- Klik **Kira Waktu Pulang** → reset semua, termasuk peringatan

---

## Install Sebagai App (PWA)

**Android (Chrome / Brave):**
1. Buka link app
2. Tap **Menu (⋮)** → **Add to Home Screen**

**iPhone / iPad (Safari sahaja):**
1. Buka link app dalam **Safari**
2. Tap butang **Share** → **Add to Home Screen**

**Desktop (Chrome / Brave / Edge):**
1. Buka link app
2. Klik icon **⊕** di address bar → **Install Waktu Balik**

---

## Notifikasi — Sokongan Platform

| Platform | Status |
|----------|--------|
| Android Chrome/Brave | ✅ Native + vibrate |
| iOS Safari (PWA) | ✅ Perlu install dulu sebagai PWA |
| Windows Chrome/Edge | ✅ Windows notification center |
| macOS | ✅ macOS notification center |

> Untuk desktop — pastikan notifikasi dibenarkan: klik ikon 🔒 di address bar → **Notifications → Allow**

---

## Fail Projek

```
waktu-balik-uum/
├── index.html       # Struktur HTML + CSS
├── app.js           # Logik JavaScript app
├── manifest.json    # PWA manifest
├── sw.js            # Service worker (offline + notifikasi)
├── icon-192.png     # Icon app (192×192)
├── icon-512.png     # Icon app (512×512)
└── README.md        # Dokumentasi ini
```

---

## Teknologi

- HTML5 / CSS3 / Vanilla JavaScript
- Progressive Web App (PWA)
- Web Notifications API
- Service Worker API
- localStorage (sesi harian)
- Google Fonts — Space Grotesk + JetBrains Mono

---

## Dibina oleh

**Muhamad Darul Hadi**
GitHub: [@muhamaddarulhadi](https://github.com/muhamaddarulhadi)
