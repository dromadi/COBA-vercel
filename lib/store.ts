import { BorrowRequest, RequestStatus, ToolItem, User, AuditLog, Role } from './types';
import { nowIsoJakarta, formatDateId } from './time';

type Store = {
  users: User[];
  tools: ToolItem[];
  requests: BorrowRequest[];
  audit: AuditLog[];
};

declare global {
  // eslint-disable-next-line no-var
  var __TRL_STORE__: Store | undefined;
}

function randId(prefix: string) {
  const c = globalThis.crypto as any;
  const uuid = c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
}

function seed(): Store {
  const now = nowIsoJakarta();
  const users: User[] = [
    { id: 'u_admin', name: 'Admin TRL', email: 'admin@trl.local', role: 'admin', password: 'trl12345' },
    { id: 'u_staff', name: 'Staff TRL', email: 'staff@trl.local', role: 'staff', password: 'trl12345' },
    { id: 'u_approval', name: 'Approval TRL', email: 'approval@trl.local', role: 'approval', password: 'trl12345' },
    { id: 'u_peminjam', name: 'Peminjam TRL', email: 'peminjam@trl.local', role: 'peminjam', password: 'trl12345' }
  ];

  const tools: ToolItem[] = [
    {
      id: 't_001',
      kode: 'TL-0001',
      nama: 'Kunci Ring Pas 50mm',
      kategori: 'General Tools',
      lokasi: 'PNS',
      kondisi: 'Baik',
      isActive: true,
      createdAt: now
    },
    {
      id: 't_002',
      kode: 'TL-0002',
      nama: 'Megger MIT 525',
      kategori: 'Measurement Tools',
      lokasi: 'LBA',
      kondisi: 'Kalibrasi',
      isActive: true,
      createdAt: now
    },
    {
      id: 't_003',
      kode: 'TL-0003',
      nama: 'Chain Block 3T',
      kategori: 'Lifting Tools',
      lokasi: 'KS Tubun',
      kondisi: 'Baik',
      isActive: true,
      createdAt: now
    }
  ];

  return { users, tools, requests: [], audit: [] };
}

export function getStore(): Store {
  if (!globalThis.__TRL_STORE__) {
    globalThis.__TRL_STORE__ = seed();
  }
  return globalThis.__TRL_STORE__;
}

export function getUserById(id: string): User | undefined {
  return getStore().users.find(u => u.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  return getStore().users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function pushAudit(params: Omit<AuditLog, 'id' | 'at'>) {
  const st = getStore();
  st.audit.unshift({ id: randId('a'), at: nowIsoJakarta(), ...params });
  st.audit = st.audit.slice(0, 200);
}

export function listTools(activeOnly = true): ToolItem[] {
  const st = getStore();
  const tools = activeOnly ? st.tools.filter(t => t.isActive) : st.tools;
  return tools.slice().sort((a, b) => a.kode.localeCompare(b.kode));
}

export function addTool(actorUserId: string, data: Omit<ToolItem, 'id' | 'createdAt'>): ToolItem {
  const st = getStore();
  const tool: ToolItem = { id: randId('t'), createdAt: nowIsoJakarta(), ...data };
  st.tools.push(tool);
  pushAudit({ actorUserId, action: 'TOOL_CREATE', entity: 'tool', entityId: tool.id, before: null, after: tool });
  return tool;
}

export function updateToolStatus(actorUserId: string, toolId: string, kondisi: ToolItem['kondisi']) {
  const st = getStore();
  const t = st.tools.find(x => x.id === toolId);
  if (!t) throw new Error('Tool tidak ditemukan');
  const before = { ...t };
  t.kondisi = kondisi;
  pushAudit({ actorUserId, action: 'TOOL_STATUS', entity: 'tool', entityId: t.id, before, after: t });
}

export function updateTool(
  actorUserId: string,
  toolId: string,
  data: Pick<ToolItem, 'kode' | 'nama' | 'kategori' | 'lokasi' | 'kondisi'>
) {
  const st = getStore();
  const t = st.tools.find(x => x.id === toolId);
  if (!t) throw new Error('Tool tidak ditemukan');
  const before = { ...t };
  t.kode = data.kode;
  t.nama = data.nama;
  t.kategori = data.kategori;
  t.lokasi = data.lokasi;
  t.kondisi = data.kondisi;
  pushAudit({ actorUserId, action: 'TOOL_UPDATE', entity: 'tool', entityId: t.id, before, after: t });
}

export function deactivateTool(actorUserId: string, toolId: string) {
  const st = getStore();
  const t = st.tools.find(x => x.id === toolId);
  if (!t) throw new Error('Tool tidak ditemukan');
  if (!t.isActive) return;
  const before = { ...t };
  t.isActive = false;
  pushAudit({ actorUserId, action: 'TOOL_DEACTIVATE', entity: 'tool', entityId: t.id, before, after: t });
}

export function listRequestsByTool(toolId: string): BorrowRequest[] {
  const st = getStore();
  return st.requests
    .filter(r => r.toolId === toolId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listRequestsForUser(userId: string, role: Role): BorrowRequest[] {
  const st = getStore();
  const all = st.requests.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (role === 'admin' || role === 'staff' || role === 'approval') return all;
  return all.filter(r => r.peminjamUserId === userId);
}

function nextNomor(seq: number) {
  // TRL-REQ/2025/12/0001
  const dt = new Date();
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const n = String(seq).padStart(4, '0');
  return `TRL-REQ/${y}/${m}/${n}`;
}

export function createRequest(actorUserId: string, payload: {
  toolId: string;
  qty: number;
  kebutuhan: string;
  tglMulai: string;
  tglSelesaiRencana: string;
}): BorrowRequest {
  const st = getStore();
  const seq = st.requests.length + 1;
  const now = nowIsoJakarta();
  const r: BorrowRequest = {
    id: randId('r'),
    nomor: nextNomor(seq),
    peminjamUserId: actorUserId,
    toolId: payload.toolId,
    qty: payload.qty,
    kebutuhan: payload.kebutuhan,
    tglMulai: payload.tglMulai,
    tglSelesaiRencana: payload.tglSelesaiRencana,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now
  };
  st.requests.unshift(r);
  pushAudit({ actorUserId, action: 'REQUEST_CREATE', entity: 'request', entityId: r.id, before: null, after: r });
  return r;
}

function updateRequest(actorUserId: string, id: string, mutator: (r: BorrowRequest) => void, action: string, remark?: string) {
  const st = getStore();
  const r = st.requests.find(x => x.id === id);
  if (!r) throw new Error('Request tidak ditemukan');
  const before = { ...r };
  mutator(r);
  r.updatedAt = nowIsoJakarta();
  pushAudit({ actorUserId, action, entity: 'request', entityId: r.id, before, after: r, remark });
  return r;
}

export function transitionRequest(actorUserId: string, role: Role, requestId: string, to: RequestStatus, remark?: string) {
  const st = getStore();
  const r = st.requests.find(x => x.id === requestId);
  if (!r) throw new Error('Request tidak ditemukan');

  const from = r.status;

  const allowed: Array<{ from: RequestStatus; to: RequestStatus; roles: Role[] }> = [
    { from: 'DRAFT', to: 'SUBMITTED', roles: ['peminjam'] },
    { from: 'SUBMITTED', to: 'STAFF_VERIFIED', roles: ['staff', 'admin'] },
    { from: 'STAFF_VERIFIED', to: 'APPROVED', roles: ['approval', 'admin'] },
    { from: 'STAFF_VERIFIED', to: 'REJECTED', roles: ['approval', 'admin'] },
    { from: 'APPROVED', to: 'HANDOVER', roles: ['staff', 'admin'] },
    { from: 'HANDOVER', to: 'RETURNED', roles: ['staff', 'admin'] },
    { from: 'RETURNED', to: 'CLOSED', roles: ['admin'] }
  ];

  const ok = allowed.some(a => a.from === from && a.to === to && a.roles.includes(role));
  if (!ok) throw new Error(`Transisi tidak diizinkan: ${from} -> ${to} untuk role ${role}`);

  updateRequest(actorUserId, requestId, (x) => {
    x.status = to;
  }, `REQUEST_${to}`, remark);

  // side effects: when handover, mark tool as Dipinjam; when returned, mark Baik
  if (to === 'HANDOVER') {
    updateToolStatus(actorUserId, r.toolId, 'Dipinjam');
  }
  if (to === 'RETURNED') {
    updateToolStatus(actorUserId, r.toolId, 'Baik');
  }
}

export function listAudit(limit = 100): AuditLog[] {
  return getStore().audit.slice(0, limit);
}

export function formatRequestLabel(r: BorrowRequest) {
  return `${r.nomor} • ${r.status} • dibuat ${formatDateId(r.createdAt)}`;
}

export function getToolById(id: string) {
  return getStore().tools.find(t => t.id === id);
}
