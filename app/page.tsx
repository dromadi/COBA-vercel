import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatDateTimeId } from '@/lib/time';
import { flagOverdue } from '@/lib/services/request';

export default async function DashboardPage() {
  const user = await requireUser();
  await flagOverdue();

  const [toolsCount, activeRequests, overdueCount, pendingApproval, auditLogs] = await Promise.all([
    prisma.tool.count({ where: { deletedAt: null, isActive: true } }),
    prisma.borrowRequest.count({
      where: {
        deletedAt: null,
        status: { in: ['SUBMITTED', 'STAFF_REVIEW', 'APPROVAL_PENDING', 'APPROVED', 'READY_FOR_PICKUP', 'CHECKED_OUT', 'OVERDUE', 'RETURN_REQUESTED'] }
      }
    }),
    prisma.borrowRequest.count({ where: { status: 'OVERDUE', deletedAt: null } }),
    prisma.borrowRequest.count({ where: { status: 'APPROVAL_PENDING', deletedAt: null } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { actor: true }
    })
  ]);

  const quickActions = [
    {
      title: 'Buat Request',
      desc: 'Ajukan peminjaman alat baru untuk tim.',
      href: '/requests/new',
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
      title: 'Approval Queue',
      desc: 'Review request menunggu persetujuan.',
      href: '/approval',
      icon: '✅',
      show: user.role === 'approval' || user.role === 'admin'
    },
    {
      title: 'Audit Log',
      desc: 'Lihat jejak perubahan dan aktivitas.',
      href: '/audit',
      icon: '🛰️',
      show: user.role === 'admin'
    }
  ].filter(action => action.show);

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
            <p className="small-muted mb-0">Ringkasan aktivitas alat, request, dan status penting hari ini.</p>
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
              <div className="stat-card__value">{toolsCount}</div>
              <div className="stat-card__hint">Inventori siap pakai</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--warning stat-card-link" href="/requests?status=active">
              <div className="stat-card__label">Request aktif</div>
              <div className="stat-card__value">{activeRequests}</div>
              <div className="stat-card__hint">Sedang diproses</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--danger stat-card-link" href="/requests?status=overdue">
              <div className="stat-card__label">Overdue</div>
              <div className="stat-card__value">{overdueCount}</div>
              <div className="stat-card__hint">Butuh tindak lanjut</div>
            </Link>
          </div>
          <div className="col-md-6 col-lg-3">
            <Link className="stat-card stat-card--info stat-card-link" href="/approval">
              <div className="stat-card__label">Approval Pending</div>
              <div className="stat-card__value">{pendingApproval}</div>
              <div className="stat-card__hint">Menunggu persetujuan</div>
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
                      <span className="fw-semibold">
                        {entry.actor.name} melakukan {entry.action} pada {entry.tableName}.
                      </span>
                      <span className="small-muted">{formatDateTimeId(entry.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="info-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 fw-semibold mb-0">Reminder</h2>
              </div>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                <li>• Pastikan lampiran BA serah terima diunggah sebelum checkout.</li>
                <li>• Gunakan Correction Note jika ada perubahan setelah approval.</li>
                <li>• Export laporan tersedia di menu Export.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
