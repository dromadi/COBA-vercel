import Link from 'next/link';
import AppShell from '@/app/_components/AppShell';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatDateTimeId } from '@/lib/time';
import { flagOverdue } from '@/lib/services/request';

const actionMeta = {
  CREATE: { label: 'Create', badge: 'badge-status badge-status--good' },
  UPDATE: { label: 'Update', badge: 'badge-status badge-status--primary' },
  DELETE: { label: 'Delete', badge: 'badge-status badge-status--danger' },
  SOFT_DELETE: { label: 'Hapus', badge: 'badge-status badge-status--danger' },
  RESTORE: { label: 'Restore', badge: 'badge-status badge-status--info' },
  STATE_TRANSITION: { label: 'Status', badge: 'badge-status badge-status--warning' }
} as const;

const formatRelativeTime = (date: Date) => {
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
  const absMinutes = Math.abs(minutes);
  if (absMinutes < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
};

export default async function DashboardPage() {
  const user = await requireUser();
  await flagOverdue();

  const [
    toolsCount,
    borrowedCount,
    calibrationCount,
    activeRequests,
    overdueCount,
    pendingApproval,
    staffQueueCount,
    auditLogs
  ] = await Promise.all([
    prisma.tool.count({ where: { deletedAt: null, isActive: true } }),
    prisma.borrowRequest.count({ where: { deletedAt: null, status: 'CHECKED_OUT' } }),
    prisma.tool.count({ where: { deletedAt: null, isActive: true, condition: { code: 'KALIBRASI' } } }),
    prisma.borrowRequest.count({
      where: {
        deletedAt: null,
        status: { in: ['SUBMITTED', 'STAFF_REVIEW', 'APPROVAL_PENDING'] }
      }
    }),
    prisma.borrowRequest.count({ where: { status: 'OVERDUE', deletedAt: null } }),
    prisma.borrowRequest.count({ where: { status: 'APPROVAL_PENDING', deletedAt: null } }),
    prisma.borrowRequest.count({ where: { status: { in: ['SUBMITTED', 'STAFF_REVIEW'] }, deletedAt: null } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
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

  const lastActivityAt = auditLogs[0]?.createdAt;
  const lastUpdatedLabel = formatDateTimeId(lastActivityAt ?? new Date());
  const alertQueueCount = user.role === 'staff' ? staffQueueCount : pendingApproval;
  const alertQueueHref = user.role === 'staff' ? '/staff/queue' : '/approval';
  const alertQueueLabel = user.role === 'staff' ? 'Menunggu staff review' : 'Menunggu approval';

  const alertItems = [
    {
      label: 'Overdue',
      description: 'Peminjaman melewati tanggal kembali.',
      count: overdueCount,
      href: '/requests?status=OVERDUE',
      tone: 'danger'
    },
    {
      label: 'Kalibrasi due',
      description: 'Alat masuk antrian kalibrasi.',
      count: calibrationCount,
      href: '/tools?condition=KALIBRASI',
      tone: 'warning'
    },
    {
      label: alertQueueLabel,
      description: 'Butuh tindakan verifikasi hari ini.',
      count: alertQueueCount,
      href: alertQueueHref,
      tone: 'info'
    }
  ].filter(item => item.count > 0);

  return (
    <AppShell user={user}>
      <div className="dashboard-header dashboard-header--compact mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge badge-soft text-uppercase">{user.role}</span>
            <span className="badge badge-soft">{user.name}</span>
            <span className="small-muted">Tools Lifecycle Hub</span>
          </div>
          <h1 className="h3 fw-semibold mb-1">Dashboard Operasional</h1>
          <p className="small-muted mb-0">Pantau backlog, aktivitas terbaru, dan peringatan prioritas hari ini.</p>
        </div>
      </div>

        <div className="row g-3 g-lg-4 dashboard-section">
          <div className="col-12 col-md-6 col-xl-3">
            <Link className="stat-card stat-card--primary stat-card-link" href="/tools?active=1">
              <div className="stat-card__label">Total Alat (aktif)</div>
              <div className="stat-card__value">{toolsCount}</div>
              <div className="stat-card__hint">Inventori siap pakai • Update {lastUpdatedLabel}</div>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link className="stat-card stat-card--info stat-card-link" href="/requests?status=CHECKED_OUT">
              <div className="stat-card__label">Dipinjam</div>
              <div className="stat-card__value">{borrowedCount}</div>
              <div className="stat-card__hint">Status checkout • Update {lastUpdatedLabel}</div>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link className="stat-card stat-card--warning stat-card-link" href="/tools?condition=KALIBRASI">
              <div className="stat-card__label">Kalibrasi</div>
              <div className="stat-card__value">{calibrationCount}</div>
              <div className="stat-card__hint">Perlu jadwal ulang • Update {lastUpdatedLabel}</div>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link className="stat-card stat-card--danger stat-card-link" href="/requests?status=ACTIVE">
              <div className="stat-card__label">Request aktif</div>
              <div className="stat-card__value">{activeRequests}</div>
              <div className="stat-card__hint">Backlog operasional • Update {lastUpdatedLabel}</div>
            </Link>
          </div>
        </div>

        <div className="row g-3 g-lg-4 dashboard-section">
          <div className="col-12 col-lg-7">
            <div className="info-card h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-semibold mb-0">Aktivitas Terbaru</h2>
                <span className="small-muted">Update terakhir: {lastUpdatedLabel}</span>
              </div>
              {auditLogs.length === 0 ? (
                <div className="empty-state card-glass">
                  <div className="empty-state__icon">🧾</div>
                  <div className="empty-state__content">
                    <h3 className="h6 fw-semibold mb-1">Belum ada aktivitas hari ini</h3>
                    <p className="small-muted mb-3">Mulai operasional dengan membuat request atau menambah alat.</p>
                    <div className="empty-state__actions">
                      <Link className="btn btn-primary btn-sm" href="/requests/new">Buat Request</Link>
                      <Link className="btn btn-outline-primary btn-sm" href="/tools">Tambah Alat</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3 activity-list">
                  {auditLogs.map(entry => {
                    const meta = actionMeta[entry.action] ?? actionMeta.UPDATE;
                    return (
                      <li key={entry.id} className="activity-item">
                        <span className={meta.badge}>{meta.label}</span>
                        <div className="activity-item__body">
                          <div className="activity-item__title">
                            {entry.tableName} • {entry.actor.name}
                          </div>
                          <div className="activity-item__meta">
                            <span className="small-muted">{formatRelativeTime(entry.createdAt)}</span>
                            <span className="small-muted">{formatDateTimeId(entry.createdAt)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <div className="col-12 col-lg-5">
            <div className="info-card h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-semibold mb-0">Peringatan</h2>
                <span className="small-muted">Prioritas hari ini</span>
              </div>
              {alertItems.length === 0 ? (
                <div className="small-muted">Tidak ada peringatan aktif.</div>
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {alertItems.map(item => (
                    <li key={item.label}>
                      <Link className={`alert-item alert-item--${item.tone}`} href={item.href}>
                        <div className="alert-item__content">
                          <span className="fw-semibold">{item.label}</span>
                          <span className="small-muted">{item.description}</span>
                        </div>
                        <span className={`badge-status badge-status--${item.tone}`}>{item.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="row g-3 g-lg-4 dashboard-section">
          <div className="col-12">
            <h2 className="h6 fw-semibold mb-3">Aksi cepat</h2>
          </div>
          {quickActions.map(action => (
            <div key={action.title} className="col-12 col-md-6 col-xl-3">
              <Link className="action-card action-card-link h-100 d-flex flex-column gap-2" href={action.href}>
                <div className="action-card__icon">{action.icon}</div>
                <div>
                  <h3 className="h6 fw-semibold mb-1">{action.title}</h3>
                  <p className="small-muted mb-2">{action.desc}</p>
                </div>
                <span className="btn btn-primary btn-sm mt-auto align-self-start">Buka</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="dashboard-section">
          <details className="info-card dashboard-accordion">
            <summary className="dashboard-accordion__summary">
              <span className="fw-semibold">Bantuan & Aturan Demo</span>
              <span className="small-muted">Konten edukasi (opsional)</span>
            </summary>
            <div className="dashboard-accordion__content">
              <div className="mb-3">
                <h3 className="h6 fw-semibold mb-1">Cara cepat mencoba</h3>
                <ul className="small-muted mb-0">
                  <li>Mulai dari buat request, lalu proses melalui staff & approval queue.</li>
                  <li>Gunakan status checkout untuk mensimulasikan peminjaman aktif.</li>
                  <li>Cek audit log untuk memastikan jejak aktivitas tercatat.</li>
                </ul>
              </div>
              <div>
                <h3 className="h6 fw-semibold mb-1">Catatan aturan ultra-strict</h3>
                <ul className="small-muted mb-0">
                  <li>Status request hanya berubah lewat action resmi (approve, reject, checkout).</li>
                  <li>Setiap perubahan penting menulis audit log secara otomatis.</li>
                  <li>Gunakan correction note untuk revisi setelah approval.</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
    </AppShell>
  );
}
