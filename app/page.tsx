import NavBar from '@/app/_components/NavBar';
import { requireUser } from '@/lib/auth';
import { listTools, listRequestsForUser } from '@/lib/store';

export default function DashboardPage() {
  const user = requireUser();
  const tools = listTools(true);
  const requests = listRequestsForUser(user.id, user.role);

  const stat = {
    totalTools: tools.length,
    dipinjam: tools.filter(t => t.kondisi === 'Dipinjam').length,
    butuhKalib: tools.filter(t => t.kondisi === 'Kalibrasi').length,
    reqActive: requests.filter(r => !['CLOSED', 'REJECTED'].includes(r.status)).length
  };

  return (
    <div>
      <NavBar user={user} />
      <main className="container py-4">
        <div className="row g-3">
          <div className="col-md-3">
            <div className="p-3 card-glass">
              <div className="small-muted">Total Alat (aktif)</div>
              <div className="display-6 fw-semibold">{stat.totalTools}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 card-glass">
              <div className="small-muted">Dipinjam</div>
              <div className="display-6 fw-semibold">{stat.dipinjam}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 card-glass">
              <div className="small-muted">Kalibrasi</div>
              <div className="display-6 fw-semibold">{stat.butuhKalib}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 card-glass">
              <div className="small-muted">Request aktif</div>
              <div className="display-6 fw-semibold">{stat.reqActive}</div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-lg-6">
            <div className="p-3 card-glass">
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
            <div className="p-3 card-glass">
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
