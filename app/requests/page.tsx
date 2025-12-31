import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import EmptyStateCard from '@/app/_components/EmptyStateCard';
import { requireUser } from '@/lib/auth';
import { createRequest, getToolById, listRequestsForUser, listTools, transitionRequest } from '@/lib/store';
import { BorrowRequest, RequestStatus, ToolItem } from '@/lib/types';
import { redirect } from 'next/navigation';
import { formatDateId, isoFromDateInput, todayInputValueJakarta } from '@/lib/time';

const ACTIONS: Array<{ to: RequestStatus; label: string; roles: string[]; from: RequestStatus[] }> = [
  { to: 'SUBMITTED', label: 'Submit', roles: ['peminjam'], from: ['DRAFT'] },
  { to: 'STAFF_VERIFIED', label: 'Verifikasi', roles: ['staff', 'admin'], from: ['SUBMITTED'] },
  { to: 'APPROVED', label: 'Approve', roles: ['approval', 'admin'], from: ['STAFF_VERIFIED'] },
  { to: 'REJECTED', label: 'Reject', roles: ['approval', 'admin'], from: ['STAFF_VERIFIED'] },
  { to: 'HANDOVER', label: 'Handover', roles: ['staff', 'admin'], from: ['APPROVED'] },
  { to: 'RETURNED', label: 'Return', roles: ['staff', 'admin'], from: ['HANDOVER'] },
  { to: 'CLOSED', label: 'Close', roles: ['admin'], from: ['RETURNED'] }
];

async function createRequestAction(formData: FormData) {
  'use server';
  const user = requireUser();
  if (user.role !== 'peminjam' && user.role !== 'admin') return;

  const toolId = String(formData.get('toolId') || '');
  const qty = Number(formData.get('qty') || 1);
  const kebutuhan = String(formData.get('kebutuhan') || '').trim();
  const tglMulai = isoFromDateInput(String(formData.get('tglMulai') || todayInputValueJakarta()));
  const tglSelesaiRencana = isoFromDateInput(String(formData.get('tglSelesaiRencana') || todayInputValueJakarta()));

  if (!toolId || !kebutuhan) return;
  createRequest(user.id, { toolId, qty, kebutuhan, tglMulai, tglSelesaiRencana });
  redirect('/requests');
}

async function transitionAction(formData: FormData) {
  'use server';
  const user = requireUser();
  const requestId = String(formData.get('requestId') || '');
  const to = String(formData.get('to') || '') as RequestStatus;
  const remark = String(formData.get('remark') || '').trim() || undefined;

  transitionRequest(user.id, user.role, requestId, to, remark);
  redirect('/requests');
}

function toolLabel(t: ToolItem | undefined) {
  if (!t) return '—';
  return `${t.kode} • ${t.nama}`;
}

function actionButtons(userRole: string, r: BorrowRequest) {
  const available = ACTIONS.filter(a => a.roles.includes(userRole) && a.from.includes(r.status));
  if (available.length === 0) return null;

  const actionButtonClass: Record<RequestStatus, string> = {
    DRAFT: 'btn-outline-primary',
    SUBMITTED: 'btn-outline-primary',
    STAFF_VERIFIED: 'btn-outline-primary',
    APPROVED: 'btn-outline-primary',
    REJECTED: 'btn-outline-primary',
    HANDOVER: 'btn-outline-primary',
    RETURNED: 'btn-outline-primary',
    CLOSED: 'btn-outline-primary'
  };

  return (
    <div className="d-flex flex-column gap-2">
      {available.map(a => (
        <form key={a.to} action={transitionAction} className="d-flex gap-2">
          <input type="hidden" name="requestId" value={r.id} />
          <input type="hidden" name="to" value={a.to} />
          <input
            name="remark"
            className="form-control form-control-sm"
            placeholder="Catatan (opsional)"
          />
          <button className={`btn ${actionButtonClass[a.to]} btn-sm`} type="submit">
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}

export default function RequestsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const user = requireUser();
  const requests = listRequestsForUser(user.id, user.role);
  const tools = listTools(true);
  const statusBadge: Record<RequestStatus, string> = {
    DRAFT: 'badge-status badge-status--info',
    SUBMITTED: 'badge-status badge-status--primary',
    STAFF_VERIFIED: 'badge-status badge-status--warning',
    APPROVED: 'badge-status badge-status--good',
    REJECTED: 'badge-status badge-status--danger',
    HANDOVER: 'badge-status badge-status--info',
    RETURNED: 'badge-status badge-status--good',
    CLOSED: 'badge-status badge-status--warning'
  };
  const statusParam = typeof searchParams?.status === 'string' ? searchParams.status : '';
  const normalizedStatus = statusParam.toUpperCase();
  const isActiveRequest = (r: BorrowRequest) => !['CLOSED', 'REJECTED'].includes(r.status);
  const isOverdue = (r: BorrowRequest) =>
    !['CLOSED', 'REJECTED', 'RETURNED'].includes(r.status) && new Date(r.tglSelesaiRencana) < new Date();

  const filteredRequests = (() => {
    if (!statusParam) return requests;
    if (normalizedStatus === 'ACTIVE') return requests.filter(isActiveRequest);
    if (normalizedStatus === 'PENDING')
      return requests.filter(r => ['SUBMITTED', 'STAFF_VERIFIED', 'APPROVED'].includes(r.status));
    if (normalizedStatus === 'OVERDUE') return requests.filter(isOverdue);
    if ((Object.keys(statusBadge) as RequestStatus[]).includes(normalizedStatus as RequestStatus)) {
      return requests.filter(r => r.status === normalizedStatus);
    }
    return requests;
  })();
  const filterLabel = (() => {
    if (!statusParam) return 'Semua status';
    if (normalizedStatus === 'ACTIVE') return 'Status aktif';
    if (normalizedStatus === 'PENDING') return 'Menunggu proses';
    if (normalizedStatus === 'OVERDUE') return 'Overdue';
    if ((Object.keys(statusBadge) as RequestStatus[]).includes(normalizedStatus as RequestStatus)) {
      return `Status = ${normalizedStatus}`;
    }
    return 'Semua status';
  })();

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <div className="row g-3">
          {(user.role === 'peminjam' || user.role === 'admin') && (
            <div className="col-lg-5">
              <div className="p-3 card-glass">
                <h1 className="h5 mb-1">Buat Request Peminjaman</h1>
                <p className="small-muted mb-3">Field master-coded memakai dropdown (MVP).</p>

                <form action={createRequestAction} className="row g-2">
                  <div className="col-12">
                    <label className="form-label">Pilih alat</label>
                    <select name="toolId" className="form-select" defaultValue={tools[0]?.id || ''} required>
                      {tools.map(t => (
                        <option key={t.id} value={t.id} disabled={t.kondisi !== 'Baik'}>
                          {t.kode} • {t.nama} ({t.kondisi})
                        </option>
                      ))}
                    </select>
                    <div className="form-text">Alat non-"Baik" otomatis disabled.</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Qty</label>
                    <input name="qty" type="number" className="form-control" defaultValue={1} min={1} required />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Kebutuhan</label>
                    <input name="kebutuhan" className="form-control" placeholder="Contoh: Overhaul MOP" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tanggal mulai</label>
                    <input name="tglMulai" type="date" className="form-control" defaultValue={todayInputValueJakarta()} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Rencana selesai</label>
                    <input name="tglSelesaiRencana" type="date" className="form-control" defaultValue={todayInputValueJakarta()} required />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary w-100">Buat (status: DRAFT)</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={(user.role === 'peminjam' || user.role === 'admin') ? 'col-lg-7' : 'col-12'}>
            <div className="p-3 card-glass">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h2 className="h6 mb-1">Daftar Request</h2>
                  <div className="small-muted">
                    {filterLabel}
                    {statusParam && (
                      <>
                        {' '}
                        <Link className="text-decoration-none" href="/requests">
                          (Reset)
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <span className="small-muted">Total: {filteredRequests.length}</span>
              </div>

              {filteredRequests.length === 0 ? (
                <EmptyStateCard
                  title="Belum ada request peminjaman"
                  description="Mulai buat request baru untuk melihat riwayat status di sini."
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M7 4h7l4 4v12H7V4Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 4v4h4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 13h4m-2-2v4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  actions={[
                    { label: 'Buat Request', href: '/requests', variant: 'primary' },
                    { label: 'Refresh', href: '/requests', variant: 'outline' }
                  ]}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-soft table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Nomor</th>
                        <th>Alat</th>
                        <th>Qty</th>
                        <th>Kebutuhan</th>
                        <th>Mulai</th>
                        <th>Rencana selesai</th>
                        <th>Status</th>
                        <th style={{ minWidth: 260 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(r => {
                        const t = getToolById(r.toolId);
                        return (
                          <tr key={r.id}>
                            <td className="fw-semibold">{r.nomor}</td>
                            <td>{toolLabel(t)}</td>
                            <td>{r.qty}</td>
                            <td>{r.kebutuhan}</td>
                            <td>{formatDateId(r.tglMulai)}</td>
                            <td>{formatDateId(r.tglSelesaiRencana)}</td>
                            <td>
                              <span className={statusBadge[r.status]}>{r.status}</span>
                            </td>
                            <td>{actionButtons(user.role, r) || <span className="small-muted">Tidak ada aksi.</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="small-muted mb-0">
                Catatan: transisi status hanya via tombol. Setelah HANDOVER, kondisi alat otomatis menjadi "Dipinjam".
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
