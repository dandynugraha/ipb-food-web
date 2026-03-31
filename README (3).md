# IPB Makan — GitHub Pages

Platform digital ekosistem pangan UMKM di Jl. Babakan Raya, IPB University Dramaga.

## Deploy ke GitHub Pages (5 menit)

### 1. Buat repository GitHub
1. Buka **github.com/new**
2. Nama: `ipb-makan` — harus **Public**
3. Klik **Create repository**

### 2. Upload semua file
**Via browser (termudah):**
1. Di halaman repo, klik **uploading an existing file**
2. Drag & drop semua file dan folder ini
3. Klik **Commit changes**

**Via terminal:**
```bash
git init && git add . && git commit -m "IPB Makan v2"
git remote add origin https://github.com/USERNAME/ipb-makan.git
git push -u origin main
```

### 3. Aktifkan GitHub Pages
**Settings → Pages → Branch: main → Folder: / (root) → Save**

### 4. Akses
```
https://USERNAME.github.io/ipb-makan/
```

---

## Struktur File

```
ipb-makan/
├── index.html           Beranda + Login
├── explore.html         Jelajahi warung
├── checkout.html        Pre-order + Poki
├── reels.html           Video feed
├── dashboard.html       Dashboard UMKM
├── menus.html           Kelola menu
├── videos.html          Video & TikTok
├── ai.html              AI Asisten Gemini
├── admin.html           Admin panel
├── css/
│   ├── design.css       Design system
│   └── components.css   Komponen UI
├── js/
│   ├── config.js        Konfigurasi
│   ├── state.js         State & cart
│   ├── data.js          Supabase queries
│   ├── auth.js          Login/logout
│   ├── gemini.js        AI via Edge Function
│   ├── ui.js            Sidebar, toast
│   └── pages/           Logic per halaman
└── supabase/functions/gemini/index.ts
```

---

## Demo Login

| Role | Cara |
|---|---|
| Mahasiswa | Pilih "Mahasiswa IPB" + NIM apapun |
| UMKM | Pilih "UMKM / Pemilik Warung" |
| Admin | Pilih "Admin Platform" |
| Umum | "Lanjutkan tanpa login" |

---

## Gemini AI — Kenapa Sekarang Bekerja

API key tersimpan di **Supabase Edge Function** (server-side), bukan di browser.
Tidak ada masalah CORS, tidak ada key yang terekspos.

```
GitHub Pages → Edge Function → Gemini API
  (browser)     (server)        (Google)
```

---

Supabase Project: `ahesoewawdtcgriergft` · Region: ap-southeast-1
