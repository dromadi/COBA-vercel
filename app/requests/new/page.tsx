import NavBar from '@/app/_components/NavBar';
import { requireUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { requestCreateSchema } from '@/lib/validation';
import { createRequest } from '@/lib/services/request';
import { isoFromDateInput, todayInputValueJakarta } from '@/lib/time';

async function createRequestAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  if (user.role !== 'peminjam' && user.role !== 'admin') redirect('/requests');

  const parsed = requestCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/requests/new?error=Data%20tidak%20lengkap');

  try {
    const request = await createRequest({
      borrowerId: user.id,
      purpose: parsed.data.purpose,
      startDate: new Date(isoFromDateInput(parsed.data.startDate)),
      endDatePlan: new Date(isoFromDateInput(parsed.data.endDatePlan))
    });
    redirect(`/requests/${request.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat request';
    redirect(`/requests/new?error=${encodeURIComponent(message)}`);
  }
}

export default async function NewRequestPage({ searchParams }: { searchParams?: { error?: string } }) {
  const user = await requireUser();

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content" style={{ maxWidth: 800 }}>
        <h1 className="h5 mb-3">Buat Request Peminjaman</h1>
        {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}
        <div className="card-glass p-3">
          <form action={createRequestAction} className="row g-2">
            <div className="col-12">
              <label className="form-label">Tujuan / Pekerjaan</label>
              <input name="purpose" className="form-control" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Tanggal Mulai</label>
              <input name="startDate" type="date" className="form-control" defaultValue={todayInputValueJakarta()} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rencana Kembali</label>
              <input name="endDatePlan" type="date" className="form-control" defaultValue={todayInputValueJakarta()} required />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Buat Request</button>
              <p className="small-muted mt-2 mb-0">Setelah dibuat, tambahkan item alat di detail request.</p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
