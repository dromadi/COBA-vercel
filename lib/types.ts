export type Role = 'admin' | 'staff' | 'approval' | 'peminjam';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string; // demo only
};

export type ToolItem = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  lokasi: string;
  kondisi: 'Baik' | 'Rusak' | 'Kalibrasi' | 'Dipinjam';
  isActive: boolean;
  createdAt: string;
};

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'STAFF_VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'HANDOVER'
  | 'RETURNED'
  | 'CLOSED';

export type BorrowRequest = {
  id: string;
  nomor: string;
  peminjamUserId: string;
  toolId: string;
  qty: number;
  kebutuhan: string;
  tglMulai: string;
  tglSelesaiRencana: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  entity: 'tool' | 'request' | 'auth';
  entityId: string;
  before: any;
  after: any;
  remark?: string;
};
