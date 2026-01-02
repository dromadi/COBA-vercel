'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/types';
import { navLinks } from './navLinks';

export default function SideMenu({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const links = navLinks.filter(link => !link.roles || link.roles.includes(user.role));

  return (
    <div className="side-menu__card card-glass p-3">
      <div className="side-menu__title">Menu</div>
      <nav className="nav flex-column side-menu__nav">
        {links.map(link => (
          <Link
            key={link.href}
            className={`side-menu__link ${pathname === link.href ? 'active' : ''}`}
            href={link.href}
            aria-current={pathname === link.href ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
