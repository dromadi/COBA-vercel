export const Role = {
  admin: 'admin',
  staff: 'staff',
  approval: 'approval',
  peminjam: 'peminjam'
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const RequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  STAFF_REVIEW: 'STAFF_REVIEW',
  APPROVAL_PENDING: 'APPROVAL_PENDING',
  APPROVED: 'APPROVED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  CHECKED_OUT: 'CHECKED_OUT',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE'
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const AttachmentEntityType = {
  REQUEST: 'REQUEST',
  ITEM: 'ITEM',
  HANDOVER: 'HANDOVER',
  RETURN: 'RETURN',
  CORRECTION: 'CORRECTION'
} as const;

export type AttachmentEntityType = (typeof AttachmentEntityType)[keyof typeof AttachmentEntityType];

export const AttachmentRequiredType = {
  SURAT_TUGAS: 'SURAT_TUGAS',
  BA_HANDOVER: 'BA_HANDOVER',
  BA_RETURN: 'BA_RETURN',
  CORRECTION_NOTE: 'CORRECTION_NOTE',
  OTHER: 'OTHER'
} as const;

export type AttachmentRequiredType = (typeof AttachmentRequiredType)[keyof typeof AttachmentRequiredType];

export const EventAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  SUBMIT: 'SUBMIT',
  STAFF_REVIEW: 'STAFF_REVIEW',
  SEND_TO_APPROVAL: 'SEND_TO_APPROVAL',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  READY_PICKUP: 'READY_PICKUP',
  CHECKOUT: 'CHECKOUT',
  REQUEST_RETURN: 'REQUEST_RETURN',
  RECEIVE_RETURN: 'RECEIVE_RETURN',
  CANCEL: 'CANCEL',
  OVERDUE_FLAG: 'OVERDUE_FLAG',
  CORRECTION_REQUEST: 'CORRECTION_REQUEST',
  CORRECTION_DECISION: 'CORRECTION_DECISION',
  SOFT_DELETE: 'SOFT_DELETE',
  RESTORE: 'RESTORE',
  EXPORT: 'EXPORT'
} as const;

export type EventAction = (typeof EventAction)[keyof typeof EventAction];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SOFT_DELETE: 'SOFT_DELETE',
  RESTORE: 'RESTORE',
  STATE_TRANSITION: 'STATE_TRANSITION'
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const CorrectionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type CorrectionStatus = (typeof CorrectionStatus)[keyof typeof CorrectionStatus];
