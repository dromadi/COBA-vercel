'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/types';
import { signOut } from 'next-auth/react';
import { navLinks } from './navLinks';

export default function NavBar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const links = navLinks.filter(link => !link.roles || link.roles.includes(user.role));

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
            {links.map(link => (
              <li key={link.href} className="nav-item">
                <Link
                  className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
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
              <li className="px-3 py-1">
                <button
                  className="btn btn-outline-primary btn-sm w-100"
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Keluar
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
