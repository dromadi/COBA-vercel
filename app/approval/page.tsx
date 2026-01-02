import NavBar from '@/app/_components/NavBar';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { transitionRequest } from '@/lib/services/request';

async function approveAction(formData: FormData) {
  'use server';
  const user = await requireRole(['approval', 'admin']);
  const requestId = String(formData.get('requestId') || '');
  try {
    await transitionRequest({ actorId: user.id, role: user.role, requestId, action: 'APPROVE' });
    redirect('/approval');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Aksi gagal';
    redirect(`/approval?error=${encodeURIComponent(message)}`);
  }
}

async function rejectAction(formData: FormData) {
  'use server';
  const user = await requireRole(['approval', 'admin']);
  const requestId = String(formData.get('requestId') || '');
  const reasonCode = String(formData.get('reasonCode') || '');
  const remark = String(formData.get('remark') || '');
  try {
    await transitionRequest({ actorId: user.id, role: user.role, requestId, action: 'REJECT', reasonCode, remark });
    redirect('/approval');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Aksi gagal';
    redirect(`/approval?error=${encodeURIComponent(message)}`);
  }
}

export default async function ApprovalPage({ searchParams }: { searchParams?: { error?: string } }) {
  const user = await requireRole(['approval', 'admin']);
  const requests = await prisma.borrowRequest.findMany({
    where: { status: 'APPROVAL_PENDING', deletedAt: null },
    include: { borrower: true, items: { include: { tool: true } } },
    orderBy: { createdAt: 'asc' }
  });
  const reasons = await prisma.masterReason.findMany({ where: { isActive: true, deletedAt: null } });

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <h1 className="h5 mb-3">Antrian Approval</h1>
        {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}
        {requests.length === 0 ? (
          <div className="card-glass p-3">Tidak ada request menunggu approval.</div>
        ) : (
          <div className="card-glass p-3">
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Nomor</th>
                    <th>Peminjam</th>
                    <th>Item</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.requestNo}</td>
                      <td>{req.borrower.name}</td>
                      <td>{req.items.map(item => item.tool.toolCode).join(', ')}</td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <form action={approveAction}>
                            <input type="hidden" name="requestId" value={req.id} />
                            <button className="btn btn-success btn-sm" type="submit">Approve</button>
                          </form>
                          <form action={rejectAction} className="d-flex flex-column gap-2">
                            <input type="hidden" name="requestId" value={req.id} />
                            <select name="reasonCode" className="form-select form-select-sm" required>
                              <option value="">Alasan reject</option>
                              {reasons.map(reason => (
                                <option key={reason.id} value={reason.code}>{reason.name}</option>
                              ))}
                            </select>
                            <input name="remark" className="form-control form-control-sm" placeholder="Catatan reject" required />
                            <button className="btn btn-outline-danger btn-sm" type="submit">Reject</button>
                          </form>
                        </div>
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
