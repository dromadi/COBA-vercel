export default function NotFoundPage() {
  return (
    <main className="container py-5" style={{ maxWidth: 720 }}>
      <div className="card-glass p-4 text-center">
        <h1 className="h4 mb-2">404 • Halaman tidak ditemukan</h1>
        <p className="small-muted">URL yang Anda cari tidak tersedia.</p>
        <a className="btn btn-outline-primary btn-sm" href="/">Kembali ke Dashboard</a>
      </div>
    </main>
  );
}
