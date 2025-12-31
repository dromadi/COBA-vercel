import NavBar from '@/app/_components/NavBar';
import { requireRole } from '@/lib/auth';
import { addTool, listTools } from '@/lib/store';
import { ToolItem } from '@/lib/types';
import { redirect } from 'next/navigation';

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

export default function ToolsPage() {
  const user = requireRole(['admin', 'staff']);
  const tools = listTools(false);
  const kondisiBadge: Record<ToolItem['kondisi'], string> = {
    Baik: 'badge-status badge-status--good',
    Rusak: 'badge-status badge-status--danger',
    Kalibrasi: 'badge-status badge-status--warning',
    Dipinjam: 'badge-status badge-status--info'
  };

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="p-3 card-glass">
              <h1 className="h5 mb-1">Master Alat</h1>
              <p className="small-muted mb-3">MVP: kode unik + dropdown kategori/lokasi/kondisi.</p>

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
            </div>
          </div>

          <div className="col-lg-7">
            <div className="p-3 card-glass">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 mb-0">Daftar alat</h2>
                <span className="small-muted">Total: {tools.length}</span>
              </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map(t => (
                      <tr key={t.id}>
                        <td className="fw-semibold">{t.kode}</td>
                        <td>{t.nama}</td>
                        <td>{t.kategori}</td>
                        <td>{t.lokasi}</td>
                        <td>
                          <span className={kondisiBadge[t.kondisi]}>{t.kondisi}</span>
                        </td>
                        <td>{t.isActive ? 'Ya' : 'Tidak'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small-muted mb-0">
                Catatan: menu edit/nonaktif belum dibuat di MVP. Transisi kondisi “Dipinjam” otomatis saat HANDOVER.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
