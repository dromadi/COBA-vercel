import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/login?msg=Keluar%20berhasil', req.url));
  res.cookies.set({ name: SESSION_COOKIE_NAME, value: '', path: '/', maxAge: 0 });
  return res;
}
