import crypto from 'crypto';
import { Role, User } from './types';

export const SESSION_COOKIE_NAME = 'trl_session';

type SessionPayload = { uid: string; role: Role; iat: number };

function getSecret() {
  return process.env.SESSION_SECRET || 'DEV_ONLY_CHANGE_ME';
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function unbase64url(input: string) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function sign(data: string) {
  return base64url(crypto.createHmac('sha256', getSecret()).update(data).digest());
}

export function createSessionToken(user: User) {
  const payload: SessionPayload = { uid: user.id, role: user.role, iat: Date.now() };
  const body = base64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const json = unbase64url(body).toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}
