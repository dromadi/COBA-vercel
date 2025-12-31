import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import EmptyStateCard from '@/app/_components/EmptyStateCard';
import { requireRole } from '@/lib/auth';
import {
  addTool,
  deactivateTool,
  getToolById,
  getUserById,
  listAudit,
  listRequestsByTool,
  listTools,
  updateTool
} from '@/lib/store';
import { BorrowRequest, ToolItem } from '@/lib/types';
import { redirect } from 'next/navigation';
import { formatDateId } from '@/lib/time';

const KATEGORI = ['General Tools', 'Measurement Tools', 'Lifting Tools', 'Electrical Tools'];
const LOKASI = ['PNS', 'LBA', 'KS Tubun', 'Priok'];
const KONDISI: ToolItem['kondisi'][] = ['Baik', 'Rusak', 'Kalibrasi', 'Dipinjam'];

async function addToolAction(formData: FormData) {
  'use server';
  const user = requireRole(['admin', 'staff']);

  const kode = String(formData.get('kode') || '').trim();
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const lokasi = String(formData.get('lokasi') || '').trim();
  const kondisi = String(formData.get('kondisi') || '').trim() as ToolItem['kondisi'];

  if (!kode || !nama) return;
  if (!KATEGORI.includes(kategori)) return;
  if (!LOKASI.includes(lokasi)) return;
  if (!KONDISI.includes(kondisi)) return;

  addTool(user.id, {
    kode,
    nama,
    kategori,
    lokasi,
    kondisi,
    isActive: true
  });

  redirect('/tools');
}

async function updateToolAction(formData: FormData) {
  'use server';
  const user = requireRole(['admin', 'staff']);
  const toolId = String(formData.get('toolId') || '');

  const kode = String(formData.get('kode') || '').trim();
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const lokasi = String(formData.get('lokasi') || '').trim();
  const kondisi = String(formData.get('kondisi') || '').trim() as ToolItem['kondisi'];

  if (!toolId || !kode || !nama) return;
  if (!KATEGORI.includes(kategori)) return;
  if (!LOKASI.includes(lokasi)) return;
  if (!KONDISI.includes(kondisi)) return;

  updateTool(user.id, toolId, { kode, nama, kategori, lokasi, kondisi });
  redirect(`/tools?toolId=${toolId}`);
}

async function deactivateToolAction(formData: FormData) {
  'use server';
  const user = requireRole(['admin', 'staff']);
  const toolId = String(formData.get('toolId') || '');
  if (!toolId) return;
  deactivateTool(user.id, toolId);
  redirect(`/tools?toolId=${toolId}`);
}

export default function ToolsPage({ searchParams }: { searchParams?: { kondisi?: string; toolId?: string; editId?: string } }) {
  const user = requireRole(['admin', 'staff']);
  const tools = listTools(false);
  const kondisiParam = typeof searchParams?.kondisi === 'string' ? searchParams.kondisi : '';
  const detailToolId = typeof searchParams?.toolId === 'string' ? searchParams.toolId : '';
  const editToolId = typeof searchParams?.editId === 'string' ? searchParams.editId : '';
  const detailTool = detailToolId ? getToolById(detailToolId) : undefined;
  const editTool = editToolId ? getToolById(editToolId) : undefined;
  const toolRequests = detailTool ? listRequestsByTool(detailTool.id) : [];
  const toolAudit = detailTool
    ? listAudit(200).filter(entry => entry.entity === 'tool' && entry.entityId === detailTool.id)
    : [];
  const kondisiFilter = KONDISI.includes(kondisiParam as ToolItem['kondisi'])
    ? (kondisiParam as ToolItem['kondisi'])
    : undefined;
  const filteredTools = kondisiFilter ? tools.filter(t => t.kondisi === kondisiFilter) : tools;
  const kondisiBadge: Record<ToolItem['kondisi'], string> = {
    Baik: 'badge-status badge-status--good',
    Rusak: 'badge-status badge-status--danger',
    Kalibrasi: 'badge-status badge-status--warning',
    Dipinjam: 'badge-status badge-status--info'
  };
  const conditionHistory = toolAudit.filter(entry => entry.before?.kondisi && entry.after?.kondisi && entry.before.kondisi !== entry.after.kondisi);
  const toolRequestLabel = (r: BorrowRequest) => {
    const peminjam = getUserById(r.peminjamUserId)?.name || 'Peminjam';
    return `${r.nomor} • ${r.status} • ${peminjam}`;
  };

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="p-3 card-glass">
              <h1 className="h5 mb-1">{editTool ? 'Edit Alat' : 'Master Alat'}</h1>
              <p className="small-muted mb-3">
                {editTool ? `Ubah detail untuk ${editTool.kode}.` : 'MVP: kode unik + dropdown kategori/lokasi/kondisi.'}
              </p>

              {editTool ? (
                <form action={updateToolAction} className="row g-2">
                  <input type="hidden" name="toolId" value={editTool.id} />
                  <div className="col-md-4">
                    <label className="form-label">Kode</label>
                    <input name="kode" className="form-control" defaultValue={editTool.kode} required />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Nama alat</label>
                    <input name="nama" className="form-control" defaultValue={editTool.nama} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kategori</label>
                    <select name="kategori" className="form-select" defaultValue={editTool.kategori}>
                      {KATEGORI.map(k => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lokasi</label>
                    <select name="lokasi" className="form-select" defaultValue={editTool.lokasi}>
                      {LOKASI.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kondisi</label>
                    <select name="kondisi" className="form-select" defaultValue={editTool.kondisi}>
                      {KONDISI.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 d-flex gap-2 align-items-end">
                    <button className="btn btn-primary flex-grow-1">Simpan</button>
                    <Link className="btn btn-outline-secondary flex-grow-1" href="/tools">
                      Batal
                    </Link>
                  </div>
                </form>
              ) : (
                <form action={addToolAction} className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label">Kode</label>
                    <input name="kode" className="form-control" placeholder="TL-0004" required />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Nama alat</label>
                    <input name="nama" className="form-control" placeholder="Contoh: Torque Wrench" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kategori</label>
                    <select name="kategori" className="form-select" defaultValue={KATEGORI[0]}>
                      {KATEGORI.map(k => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lokasi</label>
                    <select name="lokasi" className="form-select" defaultValue={LOKASI[0]}>
                      {LOKASI.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kondisi</label>
                    <select name="kondisi" className="form-select" defaultValue={'Baik'}>
                      {KONDISI.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <button className="btn btn-primary w-100">Tambah</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="col-lg-7">
            {detailTool && (
              <div className="p-3 card-glass mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h2 className="h6 mb-1">Detail Alat</h2>
                    <div className="small-muted">Terakhir diperbarui: {formatDateId(detailTool.createdAt)}</div>
                  </div>
                  <Link className="btn btn-sm btn-outline-secondary" href="/tools">
                    Tutup
                  </Link>
                </div>
                <div className="row g-2 small">
                  <div className="col-md-6">
                    <div className="text-muted">Kode</div>
                    <div className="fw-semibold">{detailTool.kode}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Nama</div>
                    <div className="fw-semibold">{detailTool.nama}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Kategori</div>
                    <div className="fw-semibold">{detailTool.kategori}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Lokasi</div>
                    <div className="fw-semibold">{detailTool.lokasi}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Kondisi</div>
                    <span className={kondisiBadge[detailTool.kondisi]}>{detailTool.kondisi}</span>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Aktif</div>
                    <div className="fw-semibold">{detailTool.isActive ? 'Ya' : 'Tidak'}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="h6 mb-2">Riwayat Peminjaman</h3>
                  {toolRequests.length === 0 ? (
                    <div className="small-muted">Belum ada transaksi peminjaman.</div>
                  ) : (
                    <ul className="list-unstyled small mb-0">
                      {toolRequests.map(r => (
                        <li key={r.id} className="mb-2">
                          <div className="fw-semibold">{toolRequestLabel(r)}</div>
                          <div className="text-muted">Dibuat: {formatDateId(r.createdAt)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="h6 mb-2">Riwayat Kondisi</h3>
                  {conditionHistory.length === 0 ? (
                    <div className="small-muted">Belum ada perubahan kondisi tercatat.</div>
                  ) : (
                    <ul className="list-unstyled small mb-0">
                      {conditionHistory.map(entry => (
                        <li key={entry.id} className="mb-2">
                          <div className="fw-semibold">
                            {entry.before.kondisi} → {entry.after.kondisi}
                          </div>
                          <div className="text-muted">{formatDateId(entry.at)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 card-glass">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h2 className="h6 mb-1">Daftar alat</h2>
                  {kondisiFilter ? (
                    <div className="small-muted">
                      Filter: Kondisi = <b>{kondisiFilter}</b>{' '}
                      <Link href="/tools" className="text-decoration-none">
                        (Reset)
                      </Link>
                    </div>
                  ) : (
                    <span className="small-muted">Semua kondisi</span>
                  )}
                </div>
                <span className="small-muted">Total: {filteredTools.length}</span>
              </div>
              {filteredTools.length === 0 ? (
                <EmptyStateCard
                  title="Belum ada alat terdaftar"
                  description="Tambahkan alat baru agar bisa dipinjam atau digunakan di request."
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 7h16v10H4V7Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 7V5h8v2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 12h4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  actions={[
                    { label: 'Tambah Alat', href: '/tools', variant: 'primary' },
                    { label: 'Refresh', href: '/tools', variant: 'outline' }
                  ]}
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-soft table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Nama</th>
                        <th>Kategori</th>
                        <th>Lokasi</th>
                        <th>Kondisi</th>
                        <th>Aktif</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.map(t => (
                        <tr key={t.id}>
                          <td className="fw-semibold position-relative">
                            <Link
                              href={`/tools?toolId=${t.id}`}
                              className="stretched-link text-decoration-none text-reset"
                            >
                              {t.kode}
                            </Link>
                          </td>
                          <td>{t.nama}</td>
                          <td>{t.kategori}</td>
                          <td>{t.lokasi}</td>
                          <td>
                            <span className={kondisiBadge[t.kondisi]}>{t.kondisi}</span>
                          </td>
                          <td>{t.isActive ? 'Ya' : 'Tidak'}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <Link className="btn btn-sm btn-outline-primary" href={`/tools?toolId=${t.id}`}>
                                Detail
                              </Link>
                              <Link className="btn btn-sm btn-outline-secondary" href={`/tools?editId=${t.id}`}>
                                Edit
                              </Link>
                              <form action={deactivateToolAction}>
                                <input type="hidden" name="toolId" value={t.id} />
                                <button className="btn btn-sm btn-outline-danger" disabled={!t.isActive}>
                                  Nonaktifkan
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="small-muted mb-0">
                Catatan: alat nonaktif tidak bisa dipinjam. Transisi kondisi “Dipinjam” otomatis saat HANDOVER.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
