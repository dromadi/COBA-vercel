import AppShell from '@/app/_components/AppShell';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { userSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';
import { AuditAction, EventAction } from '@prisma/client';

async function createUserAction(formData: FormData) {
  'use server';
  const admin = await requireRole(['admin']);
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/master/users?error=Data%20user%20tidak%20lengkap');
  const hashed = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: hashed
      }
    });

    await logAudit({
      tableName: 'users',
      recordId: user.id,
      action: AuditAction.CREATE,
      after: { ...user, passwordHash: '***' },
      actorId: admin.id,
      client: tx
    });
    await logEvent({
      entityType: 'user',
      entityId: user.id,
      action: EventAction.CREATE,
      actorId: admin.id,
      client: tx
    });
  });
  redirect('/master/users');
}

async function deactivateUserAction(formData: FormData) {
  'use server';
  const admin = await requireRole(['admin']);
  const id = String(formData.get('id') || '');
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) redirect('/master/users');
  await prisma.$transaction(async tx => {
    const updated = await tx.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() }
    });
    await logAudit({
      tableName: 'users',
      recordId: id,
      action: AuditAction.SOFT_DELETE,
      before: { ...existing, passwordHash: '***' },
      after: { ...updated, passwordHash: '***' },
      actorId: admin.id,
      client: tx
    });
    await logEvent({
      entityType: 'user',
      entityId: id,
      action: EventAction.SOFT_DELETE,
      actorId: admin.id,
      client: tx
    });
  });
  redirect('/master/users');
}

export default async function UsersPage({ searchParams }: { searchParams?: { error?: string; q?: string; page?: string } }) {
  const user = await requireRole(['admin']);
  const page = Number(searchParams?.page || '1');
  const pageSize = 10;
  const q = searchParams?.q || '';
  const where: any = { deletedAt: null };
  if (q) {
    where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.user.count({ where })
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <AppShell user={user}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h5 mb-0">User Management</h1>
          <form className="d-flex gap-2" action="/master/users" method="get">
            <input name="q" className="form-control form-control-sm" placeholder="Cari nama/email" defaultValue={q} />
            <button className="btn btn-outline-primary btn-sm" type="submit">Cari</button>
          </form>
        </div>
        {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card-glass p-3">
              <h2 className="h6 mb-3">Tambah User</h2>
              <form action={createUserAction} className="row g-2">
                <div className="col-12">
                  <label className="form-label">Nama</label>
                  <input name="name" className="form-control" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-control" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Role</label>
                  <select name="role" className="form-select" required>
                    <option value="">Pilih role</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="approval">Approval</option>
                    <option value="peminjam">Peminjam</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Password</label>
                  <input name="password" type="password" className="form-control" required />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100" type="submit">Tambah User</button>
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
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(row => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.role}</td>
                        <td>{row.isActive ? 'Aktif' : 'Nonaktif'}</td>
                        <td>
                          <form action={deactivateUserAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <button className="btn btn-outline-danger btn-sm" type="submit">Nonaktif</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="small-muted">Total: {total} user</span>
                <div className="d-flex gap-2">
                  <a className={`btn btn-sm btn-outline-primary ${page <= 1 ? 'disabled' : ''}`} href={`/master/users?page=${page - 1}&q=${q}`}>
                    Prev
                  </a>
                  <span className="small-muted">Halaman {page} / {totalPages || 1}</span>
                  <a className={`btn btn-sm btn-outline-primary ${page >= totalPages ? 'disabled' : ''}`} href={`/master/users?page=${page + 1}&q=${q}`}>
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
