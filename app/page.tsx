import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import { requireUser } from '@/lib/auth';
import { listTools, listRequestsForUser } from '@/lib/store';

export default function DashboardPage() {
  const user = requireUser();
  const tools = listTools(true);
  const requests = listRequestsForUser(user.id, user.role);
  const quickActions = [
    {
      title: 'Buat Request',
      desc: 'Ajukan peminjaman alat baru untuk tim.',
      href: '/requests',
      icon: '📝',
      show: user.role === 'peminjam' || user.role === 'admin'
    },
    {
      title: 'Kelola Master Alat',
      desc: 'Tambah, cek, dan atur stok alat aktif.',
      href: '/tools',
      icon: '🧰',
      show: user.role === 'admin' || user.role === 'staff'
    },
    {
      title: 'Pantau Audit Log',
      desc: 'Lihat jejak perubahan dan aktivitas.',
      href: '/audit',
      icon: '🛰️',
      show: user.role === 'admin'
    },
    {
      title: 'Lihat Request',
      desc: 'Review status request yang berjalan.',
      href: '/requests',
      icon: '📌',
      show: user.role !== 'peminjam'
    }
  ].filter(action => action.show);

  const stat = {
    totalTools: tools.length,
    dipinjam: tools.filter(t => t.kondisi === 'Dipinjam').length,
    butuhKalib: tools.filter(t => t.kondisi === 'Kalibrasi').length,
    reqActive: requests.filter(r => !['CLOSED', 'REJECTED'].includes(r.status)).length
  };

  return (
    <div>
      <NavBar user={user} />
      <main className="container py-4 py-lg-5">
        <div className="dashboard-header mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge badge-soft text-uppercase">{user.role}</span>
              <span className="small-muted">Tools Lifecycle Hub</span>
            </div>
            <h1 className="h3 fw-semibold mb-1">Dashboard Operasional</h1>
            <p className="small-muted mb-0">
              Ringkasan aktivitas alat, request, dan status penting hari ini.
            </p>
          </div>
          <div className="dashboard-header__meta">
            <div className="small-muted">Login sebagai</div>
            <div className="fw-semibold">{user.name}</div>
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          <div className="col-md-6 col-lg-3">
            <div className="stat-card stat-card--primary">
              <div className="stat-card__label">Total Alat (aktif)</div>
              <div className="stat-card__value">{stat.totalTools}</div>
              <div className="stat-card__hint">Inventori siap pakai</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="stat-card stat-card--info">
              <div className="stat-card__label">Dipinjam</div>
              <div className="stat-card__value">{stat.dipinjam}</div>
              <div className="stat-card__hint">Sedang berada di user</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="stat-card stat-card--warning">
              <div className="stat-card__label">Kalibrasi</div>
              <div className="stat-card__value">{stat.butuhKalib}</div>
              <div className="stat-card__hint">Perlu tindakan teknis</div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="stat-card stat-card--success">
              <div className="stat-card__label">Request aktif</div>
              <div className="stat-card__value">{stat.reqActive}</div>
              <div className="stat-card__hint">Menunggu proses</div>
            </div>
          </div>
        </div>

        <div className="row g-3 g-lg-4 mt-2">
          <div className="col-12">
            <h2 className="h6 fw-semibold mb-3">Aksi cepat</h2>
          </div>
          {quickActions.map(action => (
            <div key={action.title} className="col-md-6 col-lg-3">
              <div className="action-card h-100 d-flex flex-column gap-2">
                <div className="action-card__icon">{action.icon}</div>
                <div>
                  <h3 className="h6 fw-semibold mb-1">{action.title}</h3>
                  <p className="small-muted mb-2">{action.desc}</p>
                </div>
                <Link className="btn btn-outline-primary btn-sm mt-auto align-self-start" href={action.href}>
                  Buka
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3 g-lg-4 mt-1 mt-lg-2">
          <div className="col-lg-6">
            <div className="info-card">
              <h5 className="mb-1">Cara cepat mencoba</h5>
              <p className="small-muted mb-2">
                Ini MVP demo. Data tersimpan di memori server (bisa reset). Untuk versi produksi, sambungkan ke database
                (Supabase/Neon/Vercel Postgres).
              </p>
              <ul className="mb-0">
                <li>Login pakai akun demo (lihat halaman Login).</li>
                <li>Role <b>peminjam</b>: buat request → submit.</li>
                <li>Role <b>staff</b>: verifikasi → handover.</li>
                <li>Role <b>approval</b>: approve/reject.</li>
                <li>Role <b>admin</b>: akses audit log & close request.</li>
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="info-card">
              <h5 className="mb-1">Catatan aturan “ultra-strict” (versi MVP)</h5>
              <ul className="mb-0">
                <li>Status request mengikuti state machine (transisi via tombol).</li>
                <li>Setelah <b>SUBMITTED</b>, data request dianggap tidak boleh diubah bebas (MVP fokus transisi).</li>
                <li>Tidak ada hard delete (di MVP belum ada menu hapus).</li>
                <li>Semua aksi penting dicatat ke Audit Log (admin).</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
