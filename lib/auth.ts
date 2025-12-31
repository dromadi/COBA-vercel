import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from './store';
import { Role, User } from './types';
import { SESSION_COOKIE_NAME, verifySessionToken, createSessionToken } from './session';

export function setSession(user: User) {
  const token = createSessionToken(user);
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession() {
  cookies().set({ name: SESSION_COOKIE_NAME, value: '', path: '/', maxAge: 0 });
}

export function getCurrentUser(): User | null {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = getUserById(payload.uid);
  return user || null;
}

export function requireUser(): User {
  const u = getCurrentUser();
  if (!u) redirect('/login');
  return u;
}

export function requireRole(roles: Role[]): User {
  const u = requireUser();
  if (!roles.includes(u.role)) redirect('/');
  return u;
}
