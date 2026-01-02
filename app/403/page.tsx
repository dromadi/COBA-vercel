export default function ForbiddenPage() {
  return (
    <main className="container py-5" style={{ maxWidth: 720 }}>
      <div className="card-glass p-4 text-center">
        <h1 className="h4 mb-2">403 • Tidak Berwenang</h1>
        <p className="small-muted">Anda tidak memiliki akses ke halaman ini.</p>
        <a className="btn btn-outline-primary btn-sm" href="/">Kembali ke Dashboard</a>
      </div>
    </main>
  );
}
