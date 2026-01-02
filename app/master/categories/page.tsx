import AppShell from '@/app/_components/AppShell';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { masterSchema } from '@/lib/validation';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';
import { AuditAction, EventAction } from '@prisma/client';

async function createCategoryAction(formData: FormData) {
  'use server';
  const user = await requireRole(['admin']);
  const parsed = masterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/master/categories?error=Data%20tidak%20lengkap');

  await prisma.$transaction(async tx => {
    const category = await tx.toolCategory.create({ data: parsed.data });
    await logAudit({
      tableName: 'tool_categories',
      recordId: category.id,
      action: AuditAction.CREATE,
      after: category,
      actorId: user.id,
      client: tx
    });
    await logEvent({
      entityType: 'tool_category',
      entityId: category.id,
      action: EventAction.CREATE,
      actorId: user.id,
      client: tx
    });
  });
  redirect('/master/categories');
}

async function deactivateCategoryAction(formData: FormData) {
  'use server';
  const user = await requireRole(['admin']);
  const id = String(formData.get('id') || '');
  const existing = await prisma.toolCategory.findUnique({ where: { id } });
  if (!existing) redirect('/master/categories');
  await prisma.$transaction(async tx => {
    const updated = await tx.toolCategory.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() }
    });
    await logAudit({
      tableName: 'tool_categories',
      recordId: id,
      action: AuditAction.SOFT_DELETE,
      before: existing,
      after: updated,
      actorId: user.id,
      client: tx
    });
    await logEvent({
      entityType: 'tool_category',
      entityId: id,
      action: EventAction.SOFT_DELETE,
      actorId: user.id,
      client: tx
    });
  });
  redirect('/master/categories');
}

export default async function CategoriesPage({ searchParams }: { searchParams?: { error?: string; q?: string; page?: string } }) {
  const user = await requireRole(['admin']);
  const page = Number(searchParams?.page || '1');
  const pageSize = 10;
  const q = searchParams?.q || '';
  const where: any = { deletedAt: null };
  if (q) {
    where.OR = [{ code: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }];
  }
  const [categories, total] = await Promise.all([
    prisma.toolCategory.findMany({ where, orderBy: { code: 'asc' }, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.toolCategory.count({ where })
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <AppShell user={user}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h5 mb-0">Master Kategori</h1>
          <form className="d-flex gap-2" action="/master/categories" method="get">
            <input name="q" className="form-control form-control-sm" placeholder="Cari kode/nama" defaultValue={q} />
            <button className="btn btn-outline-primary btn-sm" type="submit">Cari</button>
          </form>
        </div>
        {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card-glass p-3">
              <h2 className="h6 mb-3">Tambah Kategori</h2>
              <form action={createCategoryAction} className="row g-2">
                <div className="col-12">
                  <label className="form-label">Kode</label>
                  <input name="code" className="form-control" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Nama</label>
                  <input name="name" className="form-control" required />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100" type="submit">Tambah</button>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card-glass p-3">
              <div className="table-responsive">
                <table className="table table-soft table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td>{cat.code}</td>
                        <td>{cat.name}</td>
                        <td>{cat.isActive ? 'Aktif' : 'Nonaktif'}</td>
                        <td>
                          <form action={deactivateCategoryAction}>
                            <input type="hidden" name="id" value={cat.id} />
                            <button className="btn btn-outline-danger btn-sm" type="submit">Nonaktif</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="small-muted">Total: {total} item</span>
                <div className="d-flex gap-2">
                  <a className={`btn btn-sm btn-outline-primary ${page <= 1 ? 'disabled' : ''}`} href={`/master/categories?page=${page - 1}&q=${q}`}>
                    Prev
                  </a>
                  <span className="small-muted">Halaman {page} / {totalPages || 1}</span>
                  <a className={`btn btn-sm btn-outline-primary ${page >= totalPages ? 'disabled' : ''}`} href={`/master/categories?page=${page + 1}&q=${q}`}>
                    Next
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
