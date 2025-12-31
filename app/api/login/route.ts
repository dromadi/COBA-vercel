import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/store';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
