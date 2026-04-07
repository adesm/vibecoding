# Vibecoding Backend API

Vibecoding adalah sebuah purwarupa aplikasi *backend API* yang kokoh (robust) namun minimalis, yang mendemonstrasikan kelayakan alur kerja modern pengembangan *Backend* secara cepat. Aplikasi ini utamanya menangani siklus autentikasi pengguna tingkat lanjut—meliputi Registrasi, Login, Perolehan Sesi, hingga *Logout* (*Token Invalidation*).

---

## 🚀 Teknologi Stack & Library
Proyek ini dibangun memanfaatkan ekosistem modern yang sangat cepat (blazing fast):
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) (Extremely fast web framework berbasis Typescript)
- **Database**: MySQL
- **ORM (Object-Relational Mapping)**: [Drizzle ORM](https://orm.drizzle.team/)
- **Test Runner / Framework**: `bun:test` (Bawaan native Bun)
- **Hashing**: `Bun.password` (Native Argon2id)

---

## 🏗 Arsitektur & Struktur Folder
Aplikasi ini mengadopsi pola arsitektur **Controller-Service** yang dipisah secara modular. Tujuannya adalah memisahkan perutean (HTTP interface) dari logika inti bisnis.

### Penamaan Konvensi (Naming Convention)
- **Folder**: Menggunakan tipe *plural* / jamak (cth: `routes`, `services`)
- **File**: *Kebab-case* dengan sufiks jenis komponen (cth: `users-route.ts`, `users-services.ts`)

### Struktur Folder
```text
.
├── .env                  # Environment Variables Konfigurasi Utama
├── .env.test             # Environment Variables Khusus Testing (Isolated DB)
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── src/
│   ├── index.ts          # Entry point utama aplikasi (Setup port & import routes)
│   ├── db/
│   │   ├── index.ts      # Instansiasi driver MySQL & koneksi Drizzle 
│   │   └── schema.ts     # Deklarasi tabel/skema Drizzle ORM
│   ├── routes/
│   │   └── users-route.ts # Deklarasi Elysia router & Validasi Tipe Data (TypeBox)
│   └── services/
│       └── users-services.ts # Logika bisnis operasional CRUD dan enkripsi
└── tests/
    └── user.test.ts      # File eksekusi Unit Test lengkap per-skenario
```

---

## 💾 Skema Database
Sistem ini terdiri dari dua tabel utama yang saling berelasi:

1. **Table `users`**: Menyimpan kredensial identitas asli.
   - `id`: varchar(255) - UUID Otomatis (Primary Key)
   - `name`: varchar(255) - Nama pengguna (Not Null)
   - `email`: varchar(255) - Email (Not Null & UNIQUE)
   - `password`: varchar(255) - String Hash Argon2 dari sandi otentik
   - `created_at`: timestamp - *Default Current Timestamp*

2. **Table `sessions`**: Menyimpan token otorisasi yang dihasilkan setiap Login.
   - `token`: varchar(255) - UUID (Primary Key)
   - `user_id`: varchar(255) - Foreign Key yang merujuk pada kolom `id` tabel `users`
   - `created_at`: timestamp - Menandakan usia sesi

---

## 🌐 Dokumentasi API
*Base URL Default*: `http://localhost:3000`

### 1. Registrasi Akun Baru
- **Endpoint**: `POST /api/users`
- **Body JSON**:
  ```json
  {
    "name": "Alex",
    "email": "alex@mail.com",
    "password": "rahasia"
  }
  ```
- **Respons Sukses**: `200 OK` `{"data": "OK"}`

### 2. Login
- **Endpoint**: `POST /api/users/login`
- **Body JSON**:
  ```json
  {
    "email": "alex@mail.com",
    "password": "rahasia"
  }
  ```
- **Respons Sukses**: `200 OK` menghasilkan token UUID.

### 3. Profil Pengguna (Current User)
- **Endpoint**: `GET /api/users/current`
- **Headers**: 
  - `Authorization`: `Bearer <TOKEN_DARI_LOGIN>`
- **Respons Sukses**: `200 OK` memuat data nama dan email pribadi tanpa mendistribusikan enkripsi password.
- **Respons Gagal**: Jika token pudar/manipulatif, seketika ditolak dengan `401 Unauthorized`.

### 4. Logout (Cabut/Invalidasi Sesi)
- **Endpoint**: `DELETE /api/users/logout`
- **Headers**: 
  - `Authorization`: `Bearer <TOKEN_DARI_LOGIN>`
- **Respons Sukses**: Data Token dibuang dari database `sessions`. Mengembalikan `{"data": "OK"}`.

---

## ⚙️ Cara Setup & Run Aplikasi

### Prasyarat
- [Bun](https://bun.sh/) sudah terinstal di perangkat lokal.
- Server **MySQL** lokal/remote sedang berlari tegak lurus.

### Tahapan Instalasi & Menjalankan (*Development Mode*)
1. Clone repositori ini dan masuk ke direktori aplikasi.
2. Lakukan instalasi seluruh *dependencies* tersemat.
   ```bash
   bun install
   ```
3. Salin/buat deklarasi `.env` sesuai dengan konfigurasi mesin lokal masing-masing.
   ```env
   DATABASE_URL="mysql://[USERNAME]:[PASSWORD]@[HOST]:3306/[NAMA_DB]"
   ```
4. Promosikan format tabel/skema Drizzle kepada Database MySQL target (Auto Setup Table).
   ```bash
   bun run db:push
   ```
5. Lepaskan aplikasi via server (*Hot Reload / Watch Mode*):
   ```bash
   bun run dev
   ```
   *Terminal akan mengabarkan bahwa 🦊 Elysia is running at localhost:3000*

---

## 🧪 Cara Menjalankan Pengujian (Unit Test)

Aplikasi telah disertai jaring pengaman berstandar keamanan tinggi; proses tes mutlak menggunakan Environment `.env.test` mandiri yang memastikan kebersihan/keputihan tabel database production (`DATABASE_URL` asli tidak akan disentuh).

1. Buat file `.env.test` di *root folder* (sejajar dengan `.env`) dan isikan URI Database pengujian yang kosong (misal `vibecoding_test`):
   ```bash
   DATABASE_URL="mysql://root:sandi_anda@localhost:3306/vibecoding_test"
   ```
2. Migrasikan skema Drizzle ke Database Simulasi (*Test DB*) tersebut.
   ```bash
   # Akses dari UNIX system / WSL
   DATABASE_URL="uri_db_test_anda" bun run db:push
   ```
3. Mainkan Eksekusi Tes.
   ```bash
   bun test
   # Atau eksekusi secara spesifik:
   bun test tests/user.test.ts
   ```

Script test sudah memuat otomatisasi blok *Lifecycle* (`beforeEach`) yang mengosongkan tabel pengujian untuk memastikan setiap siklus unit tes murni, akurat, independen dan terisolasi.
