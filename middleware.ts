import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const roleRoutes: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/tools', roles: ['admin', 'staff'] },
  { prefix: '/master', roles: ['admin'] },
  { prefix: '/approval', roles: ['approval', 'admin'] },
  { prefix: '/staff', roles: ['staff', 'admin'] },
  { prefix: '/audit', roles: ['admin'] },
  { prefix: '/exports', roles: ['admin', 'staff'] }
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/403'
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;
  if (!role) return NextResponse.redirect(new URL('/login', req.url));

  const blocked = roleRoutes.find(route => pathname.startsWith(route.prefix));
  if (blocked && !blocked.roles.includes(role)) {
    return NextResponse.redirect(new URL('/403', req.url));
  }

  return NextResponse.next();
}
