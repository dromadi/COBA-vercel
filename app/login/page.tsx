'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = params.get('error');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: '/'
    });
    setLoading(false);
  }

  return (
    <main className="container py-5" style={{ maxWidth: 980 }}>
      <div className="row g-3 align-items-start">
        <div className="col-lg-6">
          <div className="p-4 card-glass">
            <h1 className="h4 mb-1">Masuk • TRL Tools Lifecycle Hub</h1>
            <p className="small-muted mb-4">Timezone: Asia/Jakarta • Format tanggal: DD-MMM-YYYY</p>
            {error && <div className="alert alert-danger">Email/password salah. Coba lagi.</div>}

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <label className="form-label">Email</label>
                <input name="email" type="email" className="form-control" required placeholder="admin@trl.local" />
              </div>
              <div className="col-12">
                <label className="form-label">Password</label>
                <input name="password" type="password" className="form-control" required placeholder="password" />
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="p-4 card-glass">
            <h2 className="h5">Akun demo</h2>
            <p className="small-muted mb-3">Semua akun memakai password yang sama: <b>password</b></p>
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Hak akses ringkas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-role">ADMIN</span></td>
                    <td>admin@trl.local</td>
                    <td>Semua fitur + master data + audit log</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">STAFF</span></td>
                    <td>staff@trl.local</td>
                    <td>Review request + handover + return</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">APPROVAL</span></td>
                    <td>approval@trl.local</td>
                    <td>Approve / reject</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">PEMINJAM</span></td>
                    <td>peminjam@trl.local</td>
                    <td>Buat & submit request</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
