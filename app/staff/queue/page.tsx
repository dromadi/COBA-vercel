import NavBar from '@/app/_components/NavBar';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function StaffQueuePage() {
  const user = await requireRole(['staff', 'admin']);
  const requests = await prisma.borrowRequest.findMany({
    where: {
      deletedAt: null,
      status: { in: ['SUBMITTED', 'STAFF_REVIEW', 'APPROVAL_PENDING', 'APPROVED', 'READY_FOR_PICKUP', 'RETURN_REQUESTED'] }
    },
    include: { borrower: true, items: { include: { tool: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <h1 className="h5 mb-3">Antrian Staff</h1>
        {requests.length === 0 ? (
          <div className="card-glass p-3">Tidak ada request operasional.</div>
        ) : (
          <div className="card-glass p-3">
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Nomor</th>
                    <th>Peminjam</th>
                    <th>Status</th>
                    <th>Item</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.requestNo}</td>
                      <td>{req.borrower.name}</td>
                      <td>{req.status}</td>
                      <td>{req.items.map(item => item.tool.toolCode).join(', ')}</td>
                      <td>
                        <Link className="btn btn-outline-primary btn-sm" href={`/requests/${req.id}`}>
                          Proses
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
