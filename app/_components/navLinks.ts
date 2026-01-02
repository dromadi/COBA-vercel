import { SessionUser } from '@/lib/types';

export type NavLink = { href: string; label: string; roles?: SessionUser['role'][] };

export const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/tools', label: 'Master Alat', roles: ['admin', 'staff'] },
  { href: '/master', label: 'Master Data', roles: ['admin'] },
  { href: '/requests', label: 'Peminjaman' },
  { href: '/staff/queue', label: 'Antrian Staff', roles: ['staff', 'admin'] },
  { href: '/approval', label: 'Approval', roles: ['approval', 'admin'] },
  { href: '/exports', label: 'Export', roles: ['admin', 'staff'] },
  { href: '/audit', label: 'Audit Log', roles: ['admin'] }
];
