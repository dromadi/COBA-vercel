import Link from 'next/link';
import NavBar from '@/app/_components/NavBar';
import EmptyStateCard from '@/app/_components/EmptyStateCard';
import { requireRole } from '@/lib/auth';
import {
  addTool,
  allocateNextToolCode,
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
import ToolFilters from './ToolFilters';

const KATEGORI = ['General Tools', 'Measurement Tools', 'Lifting Tools', 'Electrical Tools'];
const LOKASI = ['PNS', 'LBA', 'KS Tubun', 'Priok'];
const KONDISI: ToolItem['kondisi'][] = ['Baik', 'Rusak', 'Kalibrasi', 'Dipinjam'];
const TOOL_CODE_PATTERN = /^TL-\d{4}$/;

const normalizeKode = (value: string) => value.trim().toUpperCase();

const buildFormParams = (data: {
  kode?: string;
  nama?: string;
  kategori?: string;
  lokasi?: string;
  kondisi?: string;
  error?: string;
  form?: 'add' | 'edit';
  editId?: string;
}) => {
  const params = new URLSearchParams();
  if (data.form) params.set('form', data.form);
  if (data.editId) params.set('editId', data.editId);
  if (data.kode) params.set('kode', data.kode);
  if (data.nama) params.set('nama', data.nama);
  if (data.kategori) params.set('kategori', data.kategori);
  if (data.lokasi) params.set('lokasi', data.lokasi);
  if (data.kondisi) params.set('kondisi', data.kondisi);
  if (data.error) params.set('error', data.error);
  return params.toString();
};

async function addToolAction(formData: FormData) {
  'use server';
  const user = requireRole(['admin', 'staff']);

  const kodeInput = String(formData.get('kode') || '');
  const kode = normalizeKode(kodeInput);
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const lokasi = String(formData.get('lokasi') || '').trim();
  const kondisi = String(formData.get('kondisi') || '').trim() as ToolItem['kondisi'];
  const formPayload = { form: 'add' as const, kode, nama, kategori, lokasi, kondisi };

  if (!kode) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Kode alat wajib diisi.' })}`);
  }
  if (!TOOL_CODE_PATTERN.test(kode)) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Format kode harus TL-0001.' })}`);
  }
  if (!nama) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Nama alat wajib diisi.' })}`);
  }
  if (!KATEGORI.includes(kategori)) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Kategori wajib dipilih.' })}`);
  }
  if (!LOKASI.includes(lokasi)) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Lokasi wajib dipilih.' })}`);
  }
  if (!KONDISI.includes(kondisi)) {
    redirect(`/tools?${buildFormParams({ ...formPayload, error: 'Kondisi wajib dipilih.' })}`);
  }

  try {
    addTool(user.id, {
      kode,
      nama,
      kategori,
      lokasi,
      kondisi,
      isActive: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kode alat sudah terdaftar.';
    redirect(
      `/tools?${buildFormParams({ form: 'add', kode, nama, kategori, lokasi, kondisi, error: message })}`
    );
  }

  redirect('/tools');
}

async function updateToolAction(formData: FormData) {
  'use server';
  const user = requireRole(['admin', 'staff']);
  const toolId = String(formData.get('toolId') || '');

  const kodeInput = String(formData.get('kode') || '');
  const kode = normalizeKode(kodeInput);
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const lokasi = String(formData.get('lokasi') || '').trim();
  const kondisi = String(formData.get('kondisi') || '').trim() as ToolItem['kondisi'];

  if (!toolId) {
    redirect('/tools');
  }
  if (!kode) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Kode alat wajib diisi.' })}`);
  }
  if (!TOOL_CODE_PATTERN.test(kode)) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Format kode harus TL-0001.' })}`);
  }
  if (!nama) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Nama alat wajib diisi.' })}`);
  }
  if (!KATEGORI.includes(kategori)) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Kategori wajib dipilih.' })}`);
  }
  if (!LOKASI.includes(lokasi)) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Lokasi wajib dipilih.' })}`);
  }
  if (!KONDISI.includes(kondisi)) {
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: 'Kondisi wajib dipilih.' })}`);
  }

  try {
    updateTool(user.id, toolId, { kode, nama, kategori, lokasi, kondisi });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kode alat sudah terdaftar.';
    redirect(`/tools?${buildFormParams({ form: 'edit', editId: toolId, error: message })}`);
  }
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

async function generateToolCodeAction(formData: FormData) {
  'use server';
  requireRole(['admin', 'staff']);

  const kode = allocateNextToolCode();
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const lokasi = String(formData.get('lokasi') || '').trim();
  const kondisi = String(formData.get('kondisi') || '').trim();

  const params = buildFormParams({
    form: 'add',
    kode,
    nama,
    kategori: KATEGORI.includes(kategori) ? kategori : '',
    lokasi: LOKASI.includes(lokasi) ? lokasi : '',
    kondisi: KONDISI.includes(kondisi as ToolItem['kondisi']) ? kondisi : ''
  });

  redirect(`/tools?${params}`);
}

type ToolSearchParams = {
  q?: string;
  kategori?: string;
  lokasi?: string;
  kondisi?: string;
  aktif?: string;
  sort?: string;
  page?: string;
  toolId?: string;
  editId?: string;
  form?: string;
  error?: string;
  kode?: string;
  nama?: string;
};

const SORT_OPTIONS = ['kode-asc', 'kode-desc', 'nama-asc', 'nama-desc', 'created-desc'] as const;

export default function ToolsPage({ searchParams }: { searchParams?: ToolSearchParams }) {
  const user = requireRole(['admin', 'staff']);
  const tools = listTools(false);
  const queryParam = typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const kategoriParam = typeof searchParams?.kategori === 'string' ? searchParams.kategori : '';
  const lokasiParam = typeof searchParams?.lokasi === 'string' ? searchParams.lokasi : '';
  const kondisiParam = typeof searchParams?.kondisi === 'string' ? searchParams.kondisi : '';
  const aktifParam = typeof searchParams?.aktif === 'string' ? searchParams.aktif : '';
  const sortParam = typeof searchParams?.sort === 'string' ? searchParams.sort : '';
  const pageParam = typeof searchParams?.page === 'string' ? Number(searchParams.page) : 1;
  const detailToolId = typeof searchParams?.toolId === 'string' ? searchParams.toolId : '';
  const editToolId = typeof searchParams?.editId === 'string' ? searchParams.editId : '';
  const errorParam = typeof searchParams?.error === 'string' ? searchParams.error : '';
  const errorForm = typeof searchParams?.form === 'string' ? searchParams.form : '';
  const kodeParam = typeof searchParams?.kode === 'string' ? searchParams.kode : '';
  const namaParam = typeof searchParams?.nama === 'string' ? searchParams.nama : '';
  const detailTool = detailToolId ? getToolById(detailToolId) : undefined;
  const editTool = editToolId ? getToolById(editToolId) : undefined;
  const toolRequests = detailTool ? listRequestsByTool(detailTool.id) : [];
  const toolAudit = detailTool
    ? listAudit(200).filter(entry => entry.entity === 'tool' && entry.entityId === detailTool.id)
    : [];
  const kategoriFilter = KATEGORI.includes(kategoriParam) ? kategoriParam : '';
  const lokasiFilter = LOKASI.includes(lokasiParam) ? lokasiParam : '';
  const kondisiFilter = KONDISI.includes(kondisiParam as ToolItem['kondisi'])
    ? (kondisiParam as ToolItem['kondisi'])
    : '';
  const formKategori = kategoriFilter;
  const formLokasi = lokasiFilter;
  const formKondisi = kondisiFilter;
  const aktifFilter = aktifParam === 'aktif' || aktifParam === 'nonaktif' ? aktifParam : '';
  const sortFilter = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number]) ? sortParam : 'kode-asc';
  const pageSize = 8;

  const filteredTools = tools.filter(t => {
    if (queryParam) {
      const query = queryParam.toLowerCase();
      const kodeMatch = t.kode.toLowerCase().includes(query);
      const namaMatch = t.nama.toLowerCase().includes(query);
      if (!kodeMatch && !namaMatch) return false;
    }
    if (kategoriFilter && t.kategori !== kategoriFilter) return false;
    if (lokasiFilter && t.lokasi !== lokasiFilter) return false;
    if (kondisiFilter && t.kondisi !== kondisiFilter) return false;
    if (aktifFilter === 'aktif' && !t.isActive) return false;
    if (aktifFilter === 'nonaktif' && t.isActive) return false;
    return true;
  });

  const sortedTools = filteredTools.slice().sort((a, b) => {
    switch (sortFilter) {
      case 'kode-desc':
        return b.kode.localeCompare(a.kode);
      case 'nama-asc':
        return a.nama.localeCompare(b.nama);
      case 'nama-desc':
        return b.nama.localeCompare(a.nama);
      case 'created-desc':
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return a.kode.localeCompare(b.kode);
    }
  });

  const totalItems = sortedTools.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? Math.min(pageParam, totalPages) : 1;
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalItems);
  const pageTools = sortedTools.slice(pageStart, pageStart + pageSize);

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (queryParam) params.set('q', queryParam);
    if (kategoriFilter) params.set('kategori', kategoriFilter);
    if (lokasiFilter) params.set('lokasi', lokasiFilter);
    if (kondisiFilter) params.set('kondisi', kondisiFilter);
    if (aktifFilter) params.set('aktif', aktifFilter);
    if (sortParam) params.set('sort', sortParam);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    return params.toString();
  };

  const pageWindow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  let endPage = Math.min(totalPages, startPage + pageWindow - 1);
  if (endPage - startPage + 1 < pageWindow) {
    startPage = Math.max(1, endPage - pageWindow + 1);
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);
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
              {errorParam && ((editTool && errorForm === 'edit') || (!editTool && errorForm === 'add')) && (
                <div className="alert alert-danger">{errorParam}</div>
              )}

              {editTool ? (
                <form action={updateToolAction} className="row g-2">
                  <input type="hidden" name="toolId" value={editTool.id} />
                  <div className="col-md-4">
                    <label className="form-label">Kode</label>
                    <input
                      name="kode"
                      className="form-control"
                      defaultValue={editTool.kode}
                      required
                      pattern="TL-\\d{4}"
                      title="Gunakan format TL-0001"
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Nama alat</label>
                    <input name="nama" className="form-control" defaultValue={editTool.nama} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kategori</label>
                    <select name="kategori" className="form-select" defaultValue={editTool.kategori} required>
                      {KATEGORI.map(k => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lokasi</label>
                    <select name="lokasi" className="form-select" defaultValue={editTool.lokasi} required>
                      {LOKASI.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kondisi</label>
                    <select name="kondisi" className="form-select" defaultValue={editTool.kondisi} required>
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
                    <div className="input-group">
                      <input
                        name="kode"
                        className="form-control"
                        placeholder="TL-0004"
                        defaultValue={kodeParam}
                        required
                        pattern="TL-\\d{4}"
                        title="Gunakan format TL-0001"
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="submit"
                        formAction={generateToolCodeAction}
                        formNoValidate
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Nama alat</label>
                    <input
                      name="nama"
                      className="form-control"
                      placeholder="Contoh: Torque Wrench"
                      defaultValue={namaParam}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kategori</label>
                    <select name="kategori" className="form-select" defaultValue={formKategori} required>
                      <option value="" disabled>
                        Pilih kategori
                      </option>
                      {KATEGORI.map(k => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lokasi</label>
                    <select name="lokasi" className="form-select" defaultValue={formLokasi} required>
                      <option value="" disabled>
                        Pilih lokasi
                      </option>
                      {LOKASI.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kondisi</label>
                    <select name="kondisi" className="form-select" defaultValue={formKondisi} required>
                      <option value="" disabled>
                        Pilih kondisi
                      </option>
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
                  <span className="small-muted">Gunakan filter untuk menyaring data alat.</span>
                </div>
                <span className="small-muted">Total: {totalItems}</span>
              </div>
              <ToolFilters
                kategoriOptions={KATEGORI}
                lokasiOptions={LOKASI}
                kondisiOptions={KONDISI}
                initialQuery={{
                  q: queryParam,
                  kategori: kategoriFilter,
                  lokasi: lokasiFilter,
                  kondisi: kondisiFilter,
                  aktif: aktifFilter,
                  sort: sortParam
                }}
              />
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="small-muted">
                  Menampilkan {totalItems === 0 ? 0 : pageStart + 1}-{pageEnd} dari {totalItems} alat
                </span>
                <span className="small-muted">Halaman {currentPage} dari {totalPages}</span>
              </div>
              {pageTools.length === 0 ? (
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
                      {pageTools.map(t => (
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
              {totalPages > 1 && (
                <nav className="d-flex justify-content-end mt-3" aria-label="Pagination alat">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <Link className="page-link" href={`/tools?${buildQuery({ page: currentPage - 1 })}`}>
                        Prev
                      </Link>
                    </li>
                    {pageNumbers.map(page => (
                      <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                        <Link className="page-link" href={`/tools?${buildQuery({ page })}`}>
                          {page}
                        </Link>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <Link className="page-link" href={`/tools?${buildQuery({ page: currentPage + 1 })}`}>
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
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
