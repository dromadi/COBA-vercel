'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname();
  const links: Array<{ href: string; label: string; roles?: User['role'][] }> = [
    { href: '/', label: 'Dashboard' },
    { href: '/tools', label: 'Master Alat', roles: ['admin', 'staff'] },
    { href: '/requests', label: 'Peminjaman' },
    { href: '/audit', label: 'Audit Log', roles: ['admin'] }
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand fw-semibold" href="/">
          TRL • Tools Lifecycle Hub (MVP)
        </Link>
        <div className="d-flex align-items-center gap-2">
          <span className="badge badge-role text-uppercase">{user.role}</span>
          <span className="small-muted d-none d-sm-inline">{user.name}</span>
          <form action="/api/logout" method="post">
            <button className="btn btn-outline-primary btn-sm">Keluar</button>
          </form>
        </div>
      </div>
      <div className="container pb-2">
        <ul className="nav nav-pills">
          {links
            .filter(l => !l.roles || l.roles.includes(user.role))
            .map(l => (
              <li key={l.href} className="nav-item">
                <Link className={`nav-link ${pathname === l.href ? 'active' : ''}`} href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </nav>
  );
}
