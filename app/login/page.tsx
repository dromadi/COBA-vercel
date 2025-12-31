import Link from 'next/link';

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string; msg?: string };
}) {
  const error = searchParams?.error;
  const msg = searchParams?.msg;

  return (
    <main className="container py-5" style={{ maxWidth: 980 }}>
      <div className="row g-3 align-items-start">
        <div className="col-lg-6">
          <div className="p-4 card-glass">
            <h1 className="h4 mb-1">Masuk • TRL Tools Lifecycle Hub (MVP)</h1>
            <p className="small-muted mb-4">Timezone: Asia/Jakarta • Format tanggal: DD-MMM-YYYY (tampilan)
            </p>
            {error && (
              <div className="alert alert-danger">Email/password salah. Coba lagi.</div>
            )}
            {msg && (
              <div className="alert alert-info">{msg}</div>
            )}

            <form action="/api/login" method="post" className="row g-3">
              <div className="col-12">
                <label className="form-label">Email</label>
                <input name="email" type="email" className="form-control" required placeholder="admin@trl.local" />
              </div>
              <div className="col-12">
                <label className="form-label">Password</label>
                <input name="password" type="password" className="form-control" required placeholder="trl12345" />
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-primary">Masuk</button>
                <Link className="btn btn-outline-light" href="/">Kembali</Link>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="p-4 card-glass">
            <h2 className="h5">Akun demo</h2>
            <p className="small-muted mb-3">Semua akun memakai password yang sama: <b>trl12345</b></p>
            <div className="table-responsive">
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Hak akses ringkas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge text-bg-secondary">ADMIN</span></td>
                    <td>admin@trl.local</td>
                    <td>Semua fitur + audit log + close request</td>
                  </tr>
                  <tr>
                    <td><span className="badge text-bg-secondary">STAFF</span></td>
                    <td>staff@trl.local</td>
                    <td>Verifikasi request + handover + return</td>
                  </tr>
                  <tr>
                    <td><span className="badge text-bg-secondary">APPROVAL</span></td>
                    <td>approval@trl.local</td>
                    <td>Approve / reject</td>
                  </tr>
                  <tr>
                    <td><span className="badge text-bg-secondary">PEMINJAM</span></td>
                    <td>peminjam@trl.local</td>
                    <td>Buat & submit request</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <hr className="border-light opacity-25" />
            <p className="small-muted mb-0">
              Catatan: MVP ini memakai penyimpanan in-memory. Untuk versi produksi, ganti ke DB dan buat RBAC + RLS.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
