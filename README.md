# TRL • Tools Lifecycle Hub (MVP) — Deployable on Vercel

Ini MVP demo untuk **peminjaman tools/alat** dengan **RBAC** dan **finite state machine**.

> Catatan penting: versi ini memakai **in-memory store** (demonstrasi). Di Vercel, data bisa reset kapan saja.

## Akun demo
Password semua akun: `trl12345`

- admin@trl.local (admin)
- staff@trl.local (staff)
- approval@trl.local (approval)
- peminjam@trl.local (peminjam)

## Cara jalan lokal
```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Deploy ke Vercel
- Pastikan ada environment variable `SESSION_SECRET` (string random panjang).
- Deploy seperti biasa lewat Vercel.

## Roadmap versi produksi (saran)
- Ganti in-memory store ke database (Supabase/Neon/Vercel Postgres)
- RBAC + RLS (row level security)
- Master data lengkap (kategori, lokasi, kondisi, unit, vendor, dll.)
- Upload lampiran & persyaratan dokumen per transisi state
- Export Excel/CSV + QR/Barcode
- Audit log & event log terstruktur
