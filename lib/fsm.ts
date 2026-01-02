import { RequestStatus, Role } from '@/lib/constants/prisma-enums';

export type RequestAction =
  | 'SUBMIT'
  | 'STAFF_REVIEW'
  | 'SEND_TO_APPROVAL'
  | 'APPROVE'
  | 'REJECT'
  | 'READY_PICKUP'
  | 'CHECKOUT'
  | 'REQUEST_RETURN'
  | 'RECEIVE_RETURN'
  | 'CANCEL'
  | 'FLAG_OVERDUE';

const transitions: Record<RequestAction, { from: RequestStatus[]; to: RequestStatus; roles: Role[] }> = {
  SUBMIT: {
    from: ['DRAFT'],
    to: 'SUBMITTED',
    roles: ['peminjam', 'admin']
  },
  STAFF_REVIEW: {
    from: ['SUBMITTED'],
    to: 'STAFF_REVIEW',
    roles: ['staff', 'admin']
  },
  SEND_TO_APPROVAL: {
    from: ['STAFF_REVIEW'],
    to: 'APPROVAL_PENDING',
    roles: ['staff', 'admin']
  },
  APPROVE: {
    from: ['APPROVAL_PENDING'],
    to: 'APPROVED',
    roles: ['approval', 'admin']
  },
  REJECT: {
    from: ['APPROVAL_PENDING'],
    to: 'REJECTED',
    roles: ['approval', 'admin']
  },
  READY_PICKUP: {
    from: ['APPROVED'],
    to: 'READY_FOR_PICKUP',
    roles: ['staff', 'admin']
  },
  CHECKOUT: {
    from: ['READY_FOR_PICKUP'],
    to: 'CHECKED_OUT',
    roles: ['staff', 'admin']
  },
  REQUEST_RETURN: {
    from: ['CHECKED_OUT', 'OVERDUE'],
    to: 'RETURN_REQUESTED',
    roles: ['peminjam', 'staff', 'admin']
  },
  RECEIVE_RETURN: {
    from: ['RETURN_REQUESTED'],
    to: 'RETURNED',
    roles: ['staff', 'admin']
  },
  CANCEL: {
    from: ['DRAFT', 'SUBMITTED'],
    to: 'CANCELLED',
    roles: ['peminjam', 'admin']
  },
  FLAG_OVERDUE: {
    from: ['CHECKED_OUT'],
    to: 'OVERDUE',
    roles: ['admin', 'staff']
  }
};

export function assertCan(action: RequestAction, role: Role, status: RequestStatus) {
  const rule = transitions[action];
  if (!rule.roles.includes(role)) {
    throw new Error('Tidak berwenang melakukan aksi ini.');
  }
  if (!rule.from.includes(status)) {
    throw new Error('Transisi status tidak valid.');
  }
  return rule.to;
}

export function getNextStatus(action: RequestAction) {
  return transitions[action].to;
}
