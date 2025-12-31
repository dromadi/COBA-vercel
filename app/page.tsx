import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import { requireUser } from '@/lib/auth';
import { getToolById, getUserById, listAudit, listRequestsForUser, listTools } from '@/lib/store';
import { formatDateId } from '@/lib/time';
import { AuditLog, RequestStatus, ToolItem } from '@/lib/types';

export default function DashboardPage() {
  const user = requireUser();
  const tools = listTools(true);
  const requests = listRequestsForUser(user.id, user.role);
  const auditLogs = listAudit(10);
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

  const kalibrasiTools = tools.filter(t => t.kondisi === 'Kalibrasi');
  const pendingRequests = requests.filter(r => ['SUBMITTED', 'STAFF_VERIFIED', 'APPROVED'].includes(r.status));
  const overdueRequests = requests.filter(r => {
    if (['CLOSED', 'REJECTED', 'RETURNED'].includes(r.status)) return false;
    return new Date(r.tglSelesaiRencana) < new Date();
  });

  const warningItems = [
    {
      title: 'Request overdue',
      count: overdueRequests.length,
      description: 'Request melewati rencana selesai.',
      href: '/requests?status=overdue'
    },
    {
      title: 'Kalibrasi due',
      count: kalibrasiTools.length,
      description: 'Alat butuh kalibrasi teknis.',
      href: '/tools?kondisi=Kalibrasi'
    },
    {
      title: 'Request menunggu',
      count: pendingRequests.length,
      description: 'Butuh verifikasi/approval.',
      href: '/requests?status=pending'
    }
  ];

  function activityLabel(entry: AuditLog) {
    const actor = getUserById(entry.actorUserId);
    const actorName = actor?.name || 'User';
    const action = entry.action;
    if (entry.entity === 'tool') {
      const toolAfter = entry.after as ToolItem | null;
      const toolName = toolAfter?.kode || getToolById(entry.entityId)?.kode || 'alat';
      if (action === 'TOOL_CREATE') return `${actorName} menambahkan alat ${toolName}.`;
      if (action === 'TOOL_STATUS') return `${actorName} mengubah kondisi ${toolName} → ${toolAfter?.kondisi ?? '—'}.`;
    }
    if (entry.entity === 'request') {
      const nomor = entry.after?.nomor || 'request';
      const status = entry.after?.status as RequestStatus | undefined;
      if (action === 'REQUEST_CREATE') return `${actorName} membuat ${nomor}.`;
      if (status) return `${actorName} memperbarui ${nomor} ke status ${status}.`;
      return `${actorName} memperbarui ${nomor}.`;
    }
    return `${actorName} melakukan aktivitas.`;
  }

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
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
            <Link className="stat-card stat-card--primary stat-card-link" href="/tools">
              <div className="stat-card__label">Total Alat (aktif)</div>
              <div className="stat-card__value">{stat.totalTools}</div>
              <div className="stat-card__hint">Inventori siap pakai</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--info stat-card-link" href="/tools?kondisi=Dipinjam">
              <div className="stat-card__label">Dipinjam</div>
              <div className="stat-card__value">{stat.dipinjam}</div>
              <div className="stat-card__hint">Sedang berada di user</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--warning stat-card-link" href="/tools?kondisi=Kalibrasi">
              <div className="stat-card__label">Kalibrasi</div>
              <div className="stat-card__value">{stat.butuhKalib}</div>
              <div className="stat-card__hint">Perlu tindakan teknis</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--success stat-card-link" href="/requests?status=active">
              <div className="stat-card__label">Request aktif</div>
              <div className="stat-card__value">{stat.reqActive}</div>
              <div className="stat-card__hint">Menunggu proses</div>
            </Link>
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

        <div className="row g-3 g-lg-4 mt-2">
          <div className="col-lg-7">
            <div className="info-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 fw-semibold mb-0">Aktivitas Terbaru</h2>
                <span className="small-muted">Update terakhir</span>
              </div>
              {auditLogs.length === 0 ? (
                <div className="small-muted">Belum ada aktivitas. Mulai dari membuat request atau menambah alat.</div>
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  {auditLogs.map(entry => (
                    <li key={entry.id} className="d-flex flex-column gap-1">
                      <span className="fw-semibold">{activityLabel(entry)}</span>
                      <span className="small-muted">{formatDateId(entry.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="info-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 fw-semibold mb-0">Peringatan</h2>
                <span className="small-muted">Perlu perhatian</span>
              </div>
              {warningItems.every(item => item.count === 0) && (
                <div className="small-muted mb-3">Belum ada peringatan aktif saat ini.</div>
              )}
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                {warningItems.map(item => (
                  <li key={item.title} className="d-flex flex-column gap-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <Link className="fw-semibold text-decoration-none" href={item.href}>
                        {item.title}
                      </Link>
                      <span className="badge badge-soft">{item.count}</span>
                    </div>
                    <span className="small-muted">{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
