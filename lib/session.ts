import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';
import { SessionUser } from './types';
import { Role } from '@prisma/client';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name || 'Pengguna',
    email: session.user.email || '',
    role: session.user.role as Role
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/403');
  return user;
}
