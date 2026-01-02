import AppShell from '@/app/_components/AppShell';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatDateTimeId } from '@/lib/time';

export default async function AuditPage({
  searchParams
}: {
  searchParams?: { type?: string; userId?: string };
}) {
  const user = await requireRole(['admin']);
  const type = searchParams?.type || 'audit';
  const userId = searchParams?.userId || '';

  const auditLogs = await prisma.auditLog.findMany({
    where: userId ? { actorId: userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { actor: true }
  });

  const eventLogs = await prisma.eventLog.findMany({
    where: userId ? { actorId: userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { actor: true }
  });

  const users = await prisma.user.findMany({ where: { deletedAt: null } });

  return (
    <AppShell user={user}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h5 mb-1">Audit & Event Log</h1>
            <p className="small-muted mb-0">Semua aksi penting tercatat otomatis.</p>
          </div>
          <form className="d-flex gap-2" action="/audit" method="get">
            <select name="type" className="form-select form-select-sm" defaultValue={type}>
              <option value="audit">Audit Log</option>
              <option value="event">Event Log</option>
            </select>
            <select name="userId" className="form-select form-select-sm" defaultValue={userId}>
              <option value="">Semua user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button className="btn btn-outline-primary btn-sm" type="submit">Filter</button>
          </form>
        </div>

        <div className="card-glass p-3">
          {type === 'audit' ? (
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Tabel</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDateTimeId(log.createdAt)}</td>
                      <td>{log.actor.name}</td>
                      <td>{log.action}</td>
                      <td>{log.tableName}</td>
                      <td>{log.recordId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-soft table-hover align-middle">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLogs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDateTimeId(log.createdAt)}</td>
                      <td>{log.actor.name}</td>
                      <td>{log.action}</td>
                      <td>{log.entityType}</td>
                      <td>{log.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AppShell>
  );
}
