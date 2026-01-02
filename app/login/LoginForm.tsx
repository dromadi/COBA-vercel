'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedQuickLogin, setSelectedQuickLogin] = useState('');
  const error = params.get('error');

  const quickLoginOptions = [
    { label: 'Admin Sistem (ADMIN)', email: 'admin@trl.local' },
    { label: 'Manager Approver (APPROVAL)', email: 'approval@trl.local' },
    { label: 'Operator Gudang (STAFF)', email: 'staff@trl.local' },
    { label: 'Staff Peminjam (PEMINJAM)', email: 'peminjam@trl.local' }
  ];

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

  async function handleQuickLogin(email: string) {
    setLoading(true);
    await signIn('credentials', {
      email,
      password: 'password',
      callbackUrl: '/'
    });
    setLoading(false);
  }

  return (
    <main className="container py-5" style={{ maxWidth: 980 }}>
      <div className="row g-3 align-items-start">
        <div className="col-lg-6">
          <div className="p-4 card-glass">
            <h1 className="h4 mb-1">Masuk ke Akun</h1>
            <p className="small-muted mb-4">Pilih role untuk simulasi login</p>
            {error && <div className="alert alert-danger">Email/password salah. Coba lagi.</div>}

            <div className="mb-4">
              <label className="form-label">Pilih Role Pengguna</label>
              <select
                className="form-select"
                value={selectedQuickLogin}
                onChange={(event) => setSelectedQuickLogin(event.target.value)}
              >
                <option value="">Pilih role pengguna</option>
                {quickLoginOptions.map((option) => (
                  <option key={option.email} value={option.email}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="d-flex mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={loading || !selectedQuickLogin}
                  onClick={() => handleQuickLogin(selectedQuickLogin)}
                >
                  {loading ? 'Memproses...' : 'Masuk dengan role'}
                </button>
              </div>
            </div>

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
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-role">ADMIN</span></td>
                    <td>admin@trl.local</td>
                    <td>Semua fitur + master data + audit log</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={loading}
                        onClick={() => handleQuickLogin('admin@trl.local')}
                      >
                        Masuk cepat
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">STAFF</span></td>
                    <td>staff@trl.local</td>
                    <td>Review request + handover + return</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={loading}
                        onClick={() => handleQuickLogin('staff@trl.local')}
                      >
                        Masuk cepat
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">APPROVAL</span></td>
                    <td>approval@trl.local</td>
                    <td>Approve / reject</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={loading}
                        onClick={() => handleQuickLogin('approval@trl.local')}
                      >
                        Masuk cepat
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-role">PEMINJAM</span></td>
                    <td>peminjam@trl.local</td>
                    <td>Buat & submit request</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={loading}
                        onClick={() => handleQuickLogin('peminjam@trl.local')}
                      >
                        Masuk cepat
                      </button>
                    </td>
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
