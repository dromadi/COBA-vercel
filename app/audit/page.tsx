import NavBar from '@/app/_components/NavBar';
import { requireRole } from '@/lib/auth';
import { listAudit, getUserById } from '@/lib/store';
import { formatDateId } from '@/lib/time';

export default function AuditPage() {
  const user = requireRole(['admin']);
  const logs = listAudit(120);

  return (
    <div>
      <NavBar user={user} />
      <main className="container py-4">
        <div className="p-3 card-glass">
          <h1 className="h5 mb-1">Audit Log</h1>
          <p className="small-muted mb-3">MVP: audit log ringkas (before/after disederhanakan).</p>

          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aktor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{formatDateId(l.at)}</td>
                    <td>{getUserById(l.actorUserId)?.email || l.actorUserId}</td>
                    <td className="fw-semibold">{l.action}</td>
                    <td>{l.entity}</td>
                    <td className="text-white-50">{l.entityId}</td>
                    <td className="text-white-50">{l.remark || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-2">
            <summary className="small text-white-50">Catatan</summary>
            <ul className="small-muted mt-2">
              <li>Di produksi: simpan audit log ke DB, dan simpan before/after sebagai JSONB.</li>
              <li>Tambahkan event log terpisah untuk kebutuhan pelaporan.</li>
            </ul>
          </details>
        </div>
      </main>
    </div>
  );
}
