import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import EmptyStateCard from '@/app/_components/EmptyStateCard';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatDateId } from '@/lib/time';
import { flagOverdue } from '@/lib/services/request';
import { RequestStatus } from '@prisma/client';

const statusBadge: Record<RequestStatus, string> = {
  DRAFT: 'badge-status badge-status--info',
  SUBMITTED: 'badge-status badge-status--primary',
  STAFF_REVIEW: 'badge-status badge-status--warning',
  APPROVAL_PENDING: 'badge-status badge-status--warning',
  APPROVED: 'badge-status badge-status--good',
  READY_FOR_PICKUP: 'badge-status badge-status--info',
  CHECKED_OUT: 'badge-status badge-status--primary',
  RETURN_REQUESTED: 'badge-status badge-status--warning',
  RETURNED: 'badge-status badge-status--good',
  REJECTED: 'badge-status badge-status--danger',
  CANCELLED: 'badge-status badge-status--danger',
  OVERDUE: 'badge-status badge-status--danger'
};

export default async function RequestsPage({ searchParams }: { searchParams?: { status?: string; q?: string; page?: string } }) {
  const user = await requireUser();
  await flagOverdue();

  const statusParam = searchParams?.status?.toUpperCase();
  const q = searchParams?.q || '';
  const page = Number(searchParams?.page || '1');
  const pageSize = 10;
  const where: any = { deletedAt: null };
  if (user.role === 'peminjam') where.borrowerId = user.id;
  if (statusParam && Object.keys(statusBadge).includes(statusParam)) {
    where.status = statusParam;
  }
  if (q) {
    where.OR = [
      { requestNo: { contains: q, mode: 'insensitive' } },
      { purpose: { contains: q, mode: 'insensitive' } },
      { borrower: { name: { contains: q, mode: 'insensitive' } } }
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.borrowRequest.findMany({
      where,
      include: { borrower: true, items: { include: { tool: true } } },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.borrowRequest.count({ where })
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h5 mb-1">Request Peminjaman</h1>
            <p className="small-muted mb-0">Semua status mengikuti FSM dan hanya berubah via action.</p>
          </div>
          {(user.role === 'peminjam' || user.role === 'admin') && (
            <Link className="btn btn-primary btn-sm" href="/requests/new">Buat Request</Link>
          )}
        </div>
        <form className="d-flex gap-2 mb-3" action="/requests" method="get">
          <input name="q" className="form-control form-control-sm" placeholder="Cari nomor / tujuan / peminjam" defaultValue={q} />
          <select name="status" className="form-select form-select-sm" defaultValue={statusParam || ''}>
            <option value="">Semua status</option>
            {Object.keys(statusBadge).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="btn btn-outline-primary btn-sm" type="submit">Filter</button>
        </form>

        {requests.length === 0 ? (
          <EmptyStateCard
            title="Belum ada request"
            description="Buat request baru untuk mulai proses peminjaman."
            action={{ label: 'Buat Request', href: '/requests/new' }}
          />
        ) : (
          <div className="card-glass p-3">
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Nomor</th>
                    <th>Peminjam</th>
                    <th>Tujuan</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.requestNo}</td>
                      <td>{req.borrower.name}</td>
                      <td>{req.purpose}</td>
                      <td>
                        {formatDateId(req.startDate)} - {formatDateId(req.endDatePlan)}
                      </td>
                      <td>
                        <span className={statusBadge[req.status]}>{req.status}</span>
                      </td>
                      <td>
                        <Link className="btn btn-outline-primary btn-sm" href={`/requests/${req.id}`}>Detail</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="small-muted">Total: {total} request</span>
              <div className="d-flex gap-2">
                <a className={`btn btn-sm btn-outline-primary ${page <= 1 ? 'disabled' : ''}`} href={`/requests?page=${page - 1}&q=${q}&status=${statusParam || ''}`}>
                  Prev
                </a>
                <span className="small-muted">Halaman {page} / {totalPages || 1}</span>
                <a className={`btn btn-sm btn-outline-primary ${page >= totalPages ? 'disabled' : ''}`} href={`/requests?page=${page + 1}&q=${q}&status=${statusParam || ''}`}>
                  Next
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
