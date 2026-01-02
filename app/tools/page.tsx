import NavBar from '@/app/_components/NavBar';
import EmptyStateCard from '@/app/_components/EmptyStateCard';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { toolSchema } from '@/lib/validation';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';
import { AuditAction, EventAction } from '@prisma/client';

async function createToolAction(formData: FormData) {
  'use server';
  const user = await requireRole(['admin', 'staff']);
  const parsed = toolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect('/tools?error=Data%20alat%20tidak%20lengkap');
  }

  try {
    await prisma.$transaction(async tx => {
      const tool = await tx.tool.create({
        data: {
          toolCode: parsed.data.toolCode,
          name: parsed.data.name,
          categoryId: parsed.data.categoryId,
          locationId: parsed.data.locationId,
          unit: parsed.data.unit,
          conditionId: parsed.data.conditionId,
          ownershipStatus: parsed.data.ownershipStatus,
          assetNo: parsed.data.assetNo,
          serialNo: parsed.data.serialNo
        }
      });

      await logAudit({
        tableName: 'tools',
        recordId: tool.id,
        action: AuditAction.CREATE,
        after: tool,
        actorId: user.id,
        client: tx
      });
      await logEvent({
        entityType: 'tool',
        entityId: tool.id,
        action: EventAction.CREATE,
        actorId: user.id,
        client: tx
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menambah alat';
    redirect(`/tools?error=${encodeURIComponent(message)}`);
  }

  redirect('/tools');
}

async function updateToolAction(formData: FormData) {
  'use server';
  const user = await requireRole(['admin', 'staff']);
  const toolId = String(formData.get('toolId') || '');
  if (!toolId) redirect('/tools');
  const parsed = toolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/tools?error=Data%20alat%20tidak%20lengkap&editId=${toolId}`);
  }
  const existing = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!existing) redirect('/tools');
  try {
    await prisma.$transaction(async tx => {
      const updated = await tx.tool.update({
        where: { id: toolId },
        data: {
          toolCode: parsed.data.toolCode,
          name: parsed.data.name,
          categoryId: parsed.data.categoryId,
          locationId: parsed.data.locationId,
          unit: parsed.data.unit,
          conditionId: parsed.data.conditionId,
          ownershipStatus: parsed.data.ownershipStatus,
          assetNo: parsed.data.assetNo,
          serialNo: parsed.data.serialNo
        }
      });

      await logAudit({
        tableName: 'tools',
        recordId: toolId,
        action: AuditAction.UPDATE,
        before: existing,
        after: updated,
        actorId: user.id,
        client: tx
      });
      await logEvent({
        entityType: 'tool',
        entityId: toolId,
        action: EventAction.UPDATE,
        actorId: user.id,
        client: tx
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui alat';
    redirect(`/tools?error=${encodeURIComponent(message)}&editId=${toolId}`);
  }

  redirect('/tools');
}

async function deactivateToolAction(formData: FormData) {
  'use server';
  const user = await requireRole(['admin', 'staff']);
  const toolId = String(formData.get('toolId') || '');
  if (!toolId) redirect('/tools');
  const existing = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!existing) redirect('/tools');
  try {
    await prisma.$transaction(async tx => {
      const updated = await tx.tool.update({
        where: { id: toolId },
        data: { isActive: false, deletedAt: new Date() }
      });

      await logAudit({
        tableName: 'tools',
        recordId: toolId,
        action: AuditAction.SOFT_DELETE,
        before: existing,
        after: updated,
        actorId: user.id,
        client: tx
      });
      await logEvent({
        entityType: 'tool',
        entityId: toolId,
        action: EventAction.SOFT_DELETE,
        actorId: user.id,
        client: tx
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menonaktifkan alat';
    redirect(`/tools?error=${encodeURIComponent(message)}`);
  }
  redirect('/tools');
}

export default async function ToolsPage({
  searchParams
}: {
  searchParams?: { q?: string; page?: string; error?: string; editId?: string; active?: string; condition?: string };
}) {
  const user = await requireRole(['admin', 'staff']);
  const page = Number(searchParams?.page || '1');
  const pageSize = 10;
  const q = searchParams?.q || '';
  const activeParam = searchParams?.active;
  const conditionParam = searchParams?.condition;
  const where = {
    deletedAt: null,
    ...(activeParam === '1' ? { isActive: true } : {}),
    ...(conditionParam ? { condition: { code: conditionParam } } : {}),
    ...(q
      ? {
          OR: [
            { toolCode: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {})
  } as const;

  const [tools, total, categories, locations, conditions] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: { category: true, location: true, condition: true },
      orderBy: { toolCode: 'asc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    }),
    prisma.tool.count({ where }),
    prisma.toolCategory.findMany({ where: { deletedAt: null, isActive: true } }),
    prisma.location.findMany({ where: { deletedAt: null, isActive: true } }),
    prisma.condition.findMany({ where: { deletedAt: null, isActive: true } })
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const editId = searchParams?.editId;
  const editing = editId ? tools.find(tool => tool.id === editId) : null;
  const querySuffix = `&q=${encodeURIComponent(q)}${activeParam ? `&active=${encodeURIComponent(activeParam)}` : ''}${conditionParam ? `&condition=${encodeURIComponent(conditionParam)}` : ''}`;

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="h5 mb-1">Master Alat</h1>
            <p className="small-muted mb-0">Kelola inventori alat. Semua perubahan tercatat pada audit log.</p>
          </div>
          <form className="d-flex gap-2" action="/tools" method="get">
            <input
              name="q"
              className="form-control form-control-sm"
              placeholder="Cari kode atau nama"
              defaultValue={q}
            />
            <button className="btn btn-outline-primary btn-sm" type="submit">Cari</button>
          </form>
        </div>

        {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card-glass p-3">
              <h2 className="h6 mb-3">{editing ? 'Edit Alat' : 'Tambah Alat'}</h2>
              <form action={editing ? updateToolAction : createToolAction} className="row g-2">
                {editing && <input type="hidden" name="toolId" value={editing.id} />}
                <div className="col-12">
                  <label className="form-label">Kode Alat</label>
                  <input
                    name="toolCode"
                    className="form-control"
                    defaultValue={editing?.toolCode}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Nama Alat</label>
                  <input name="name" className="form-control" defaultValue={editing?.name} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Kategori</label>
                  <select name="categoryId" className="form-select" defaultValue={editing?.categoryId} required>
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Lokasi</label>
                  <select name="locationId" className="form-select" defaultValue={editing?.locationId} required>
                    <option value="">Pilih lokasi</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Kondisi</label>
                  <select name="conditionId" className="form-select" defaultValue={editing?.conditionId} required>
                    <option value="">Pilih kondisi</option>
                    {conditions.map(cond => (
                      <option key={cond.id} value={cond.id}>{cond.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Satuan</label>
                  <input name="unit" className="form-control" defaultValue={editing?.unit || 'unit'} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Asset No</label>
                  <input name="assetNo" className="form-control" defaultValue={editing?.assetNo || ''} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Serial No</label>
                  <input name="serialNo" className="form-control" defaultValue={editing?.serialNo || ''} />
                </div>
                <div className="col-12">
                  <label className="form-label">Status Kepemilikan</label>
                  <input
                    name="ownershipStatus"
                    className="form-control"
                    defaultValue={editing?.ownershipStatus || 'Milik Perusahaan'}
                    required
                  />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100" type="submit">
                    {editing ? 'Simpan Perubahan' : 'Tambah Alat'}
                  </button>
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
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Kondisi</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyStateCard
                            title="Belum ada data alat"
                            description="Tambahkan alat pertama melalui form di samping."
                          />
                        </td>
                      </tr>
                    ) : (
                      tools.map(tool => (
                        <tr key={tool.id}>
                          <td>{tool.toolCode}</td>
                          <td>{tool.name}</td>
                          <td>{tool.category.name}</td>
                          <td>{tool.location.name}</td>
                          <td>{tool.condition.name}</td>
                          <td>{tool.isActive ? 'Aktif' : 'Nonaktif'}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <a className="btn btn-outline-secondary btn-sm" href={`/tools?editId=${tool.id}`}>Edit</a>
                              <form action={deactivateToolAction}>
                                <input type="hidden" name="toolId" value={tool.id} />
                                <button className="btn btn-outline-danger btn-sm" type="submit">Nonaktif</button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="small-muted">Total: {total} item</span>
                <div className="d-flex gap-2">
                  <a className={`btn btn-sm btn-outline-primary ${page <= 1 ? 'disabled' : ''}`} href={`/tools?page=${page - 1}${querySuffix}`}>
                    Prev
                  </a>
                  <span className="small-muted">Halaman {page} / {totalPages || 1}</span>
                  <a className={`btn btn-sm btn-outline-primary ${page >= totalPages ? 'disabled' : ''}`} href={`/tools?page=${page + 1}${querySuffix}`}>
                    Next
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
