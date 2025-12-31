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
    <nav className="navbar navbar-expand-lg navbar-light navbar-sticky">
      <div className="container app-container">
        <Link className="navbar-brand fw-semibold" href="/">
          TRL • Tools Lifecycle Hub (MVP)
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#trlNavbar"
          aria-controls="trlNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="trlNavbar">
          <ul className="nav nav-pills navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            {links
              .filter(l => !l.roles || l.roles.includes(user.role))
              .map(l => (
                <li key={l.href} className="nav-item">
                  <Link
                    className={`nav-link ${pathname === l.href ? 'active' : ''}`}
                    href={l.href}
                    aria-current={pathname === l.href ? 'page' : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
          <div className="dropdown user-menu mt-2 mt-lg-0 ms-lg-3">
            <button
              className="btn btn-light btn-sm dropdown-toggle user-menu__toggle border"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="badge badge-role text-uppercase">{user.role}</span>
              <span className="user-menu__name text-truncate">{user.name}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item-text small-muted">
                  Login sebagai <strong>{user.name}</strong>
                </span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <form action="/api/logout" method="post" className="px-3 py-1">
                  <button className="btn btn-outline-primary btn-sm w-100" type="submit">
                    Keluar
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
