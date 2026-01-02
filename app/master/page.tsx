import NavBar from '@/app/_components/NavBar';
import { requireRole } from '@/lib/session';
import Link from 'next/link';

export default async function MasterPage() {
  const user = await requireRole(['admin']);

  const cards = [
    { title: 'Kategori Alat', desc: 'Kelola master kategori.', href: '/master/categories' },
    { title: 'Lokasi/Area', desc: 'Kelola master lokasi.', href: '/master/locations' },
    { title: 'Kondisi Alat', desc: 'Kelola master kondisi.', href: '/master/conditions' },
    { title: 'User Management', desc: 'Kelola akun & role.', href: '/master/users' }
  ];

  return (
    <div>
      <NavBar user={user} />
      <main className="app-container page-content">
        <h1 className="h5 mb-3">Master Data</h1>
        <div className="row g-3">
          {cards.map(card => (
            <div key={card.title} className="col-md-6 col-lg-3">
              <div className="action-card h-100 d-flex flex-column gap-2">
                <h2 className="h6 fw-semibold mb-1">{card.title}</h2>
                <p className="small-muted mb-2">{card.desc}</p>
                <Link href={card.href} className="btn btn-outline-primary btn-sm mt-auto align-self-start">
                  Kelola
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
