import AppShell from '@/app/_components/AppShell';
import { requireRole } from '@/lib/session';
import { todayInputValueJakarta } from '@/lib/time';

export default async function ExportPage() {
  const user = await requireRole(['admin', 'staff']);
  const today = todayInputValueJakarta();

  return (
    <AppShell user={user}>
      <div style={{ maxWidth: 720 }}>
        <h1 className="h5 mb-3">Export Data</h1>
        <div className="card-glass p-3 mb-3">
          <h2 className="h6">Master Tools</h2>
          <a className="btn btn-outline-primary btn-sm" href="/api/exports/tools">Download tools.xlsx</a>
        </div>

        <div className="card-glass p-3 mb-3">
          <h2 className="h6">Transaksi</h2>
          <form className="row g-2" action="/api/exports/transactions" method="get">
            <div className="col-md-4">
              <label className="form-label">Tanggal mulai</label>
              <input name="start" type="date" className="form-control" defaultValue={today} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Tanggal akhir</label>
              <input name="end" type="date" className="form-control" defaultValue={today} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select name="status" className="form-select">
                <option value="">Semua</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="CHECKED_OUT">CHECKED_OUT</option>
                <option value="RETURNED">RETURNED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
            <div className="col-12">
              <button className="btn btn-outline-primary btn-sm" type="submit">Download transactions.xlsx</button>
            </div>
          </form>
        </div>

        <div className="card-glass p-3">
          <h2 className="h6">Overdue</h2>
          <a className="btn btn-outline-danger btn-sm" href="/api/exports/overdue">Download overdue.xlsx</a>
        </div>
      </div>
    </AppShell>
  );
}
