import { prisma } from '@/lib/prisma';
import { assertCan, RequestAction } from '@/lib/fsm';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';
import { AttachmentRequiredType, AuditAction, EventAction, RequestStatus, Role } from '@/lib/constants/prisma-enums';
import { Prisma } from '@prisma/client';

async function generateRequestNo(client: Prisma.TransactionClient) {
  const latest = await client.borrowRequest.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  const latestNumber = latest?.requestNo?.split('-')[1];
  const next = latestNumber ? Number(latestNumber) + 1 : 1;
  return `REQ-${String(next).padStart(4, '0')}`;
}

export async function createRequest(params: {
  borrowerId: string;
  purpose: string;
  startDate: Date;
  endDatePlan: Date;
}) {
  return prisma.$transaction(async tx => {
    const requestNo = await generateRequestNo(tx);
    const request = await tx.borrowRequest.create({
      data: {
        requestNo,
        borrowerId: params.borrowerId,
        purpose: params.purpose,
        startDate: params.startDate,
        endDatePlan: params.endDatePlan,
        status: 'DRAFT',
        currentAssigneeRole: 'peminjam'
      }
    });
    await logAudit({
      tableName: 'borrow_requests',
      recordId: request.id,
      action: AuditAction.CREATE,
      after: request,
      actorId: params.borrowerId,
      client: tx
    });
    await logEvent({
      entityType: 'borrow_request',
      entityId: request.id,
      action: EventAction.CREATE,
      actorId: params.borrowerId,
      client: tx
    });
    return request;
  });
}

export async function addRequestItem(params: {
  actorId: string;
  requestId: string;
  toolId: string;
  qty: number;
  note?: string;
}) {
  return prisma.$transaction(async tx => {
    const request = await tx.borrowRequest.findUnique({ where: { id: params.requestId } });
    if (!request || request.deletedAt) throw new Error('Request tidak ditemukan');
    if (request.status !== 'DRAFT' || request.isLocked) {
      throw new Error('Request tidak bisa diubah.');
    }
    const tool = await tx.tool.findUnique({ where: { id: params.toolId } });
    if (!tool || tool.deletedAt || !tool.isActive) {
      throw new Error('Alat tidak tersedia.');
    }
    const item = await tx.borrowRequestItem.create({
      data: {
        requestId: params.requestId,
        toolId: params.toolId,
        qty: params.qty,
        note: params.note
      }
    });
    await logAudit({
      tableName: 'borrow_request_items',
      recordId: item.id,
      action: AuditAction.CREATE,
      after: item,
      actorId: params.actorId,
      client: tx
    });
    await logEvent({
      entityType: 'borrow_request_item',
      entityId: item.id,
      action: EventAction.CREATE,
      actorId: params.actorId,
      client: tx
    });
    return item;
  });
}

export async function updateRequestDetail(params: {
  actorId: string;
  requestId: string;
  purpose: string;
  startDate: Date;
  endDatePlan: Date;
}) {
  return prisma.$transaction(async tx => {
    const request = await tx.borrowRequest.findUnique({ where: { id: params.requestId } });
    if (!request || request.deletedAt) throw new Error('Request tidak ditemukan');
    if (request.status !== 'DRAFT' || request.isLocked) throw new Error('Request tidak dapat diubah');
    const before = request;
    const updated = await tx.borrowRequest.update({
      where: { id: params.requestId },
      data: {
        purpose: params.purpose,
        startDate: params.startDate,
        endDatePlan: params.endDatePlan
      }
    });
    await logAudit({
      tableName: 'borrow_requests',
      recordId: updated.id,
      action: AuditAction.UPDATE,
      before,
      after: updated,
      actorId: params.actorId,
      client: tx
    });
    await logEvent({
      entityType: 'borrow_request',
      entityId: updated.id,
      action: EventAction.UPDATE,
      actorId: params.actorId,
      client: tx
    });
    return updated;
  });
}

export async function transitionRequest(params: {
  actorId: string;
  role: Role;
  requestId: string;
  action: RequestAction;
  remark?: string;
  reasonCode?: string;
}) {
  return prisma.$transaction(async tx => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: params.requestId },
      include: { items: true }
    });
    if (!request || request.deletedAt) throw new Error('Request tidak ditemukan');

    const nextStatus = assertCan(params.action, params.role, request.status);

    if (params.action === 'SUBMIT' && request.items.length === 0) {
      throw new Error('Request belum memiliki item alat.');
    }

    if (params.action === 'CHECKOUT') {
      const attachment = await tx.attachment.findFirst({
        where: {
          entityType: 'HANDOVER',
          entityId: request.id,
          requiredType: AttachmentRequiredType.BA_HANDOVER,
          deletedAt: null
        }
      });
      if (!attachment) throw new Error('Lampiran BA serah terima wajib diunggah.');
    }

    if (params.action === 'RECEIVE_RETURN') {
      const attachment = await tx.attachment.findFirst({
        where: {
          entityType: 'RETURN',
          entityId: request.id,
          requiredType: AttachmentRequiredType.BA_RETURN,
          deletedAt: null
        }
      });
      if (!attachment) throw new Error('Lampiran pengembalian wajib diunggah.');
    }

    const before = request;
    const data: Record<string, any> = {
      status: nextStatus,
      currentAssigneeRole: params.action === 'SEND_TO_APPROVAL' ? 'approval' : request.currentAssigneeRole
    };

    if (params.action === 'SUBMIT') {
      data.submittedAt = new Date();
      data.currentAssigneeRole = 'staff';
    }
    if (params.action === 'STAFF_REVIEW') {
      data.currentAssigneeRole = 'staff';
    }
    if (params.action === 'APPROVE') {
      data.approvedAt = new Date();
      data.currentAssigneeRole = 'staff';
      data.isLocked = true;
    }
    if (params.action === 'REJECT') {
      data.rejectedAt = new Date();
      data.isLocked = true;
    }
    if (params.action === 'READY_PICKUP') {
      data.currentAssigneeRole = 'staff';
    }
    if (params.action === 'CHECKOUT') {
      data.checkedOutAt = new Date();
      data.currentAssigneeRole = 'peminjam';
    }
    if (params.action === 'REQUEST_RETURN') {
      data.currentAssigneeRole = 'staff';
    }
    if (params.action === 'RECEIVE_RETURN') {
      data.returnedAt = new Date();
      data.isLocked = true;
      data.currentAssigneeRole = 'staff';
    }
    if (params.action === 'CANCEL') {
      data.isLocked = true;
    }

    const updated = await tx.borrowRequest.update({
      where: { id: request.id },
      data
    });

    await logAudit({
      tableName: 'borrow_requests',
      recordId: request.id,
      action: AuditAction.STATE_TRANSITION,
      before,
      after: updated,
      actorId: params.actorId,
      client: tx
    });

    const eventActionMap: Record<RequestAction, EventAction> = {
      SUBMIT: EventAction.SUBMIT,
      STAFF_REVIEW: EventAction.STAFF_REVIEW,
      SEND_TO_APPROVAL: EventAction.SEND_TO_APPROVAL,
      APPROVE: EventAction.APPROVE,
      REJECT: EventAction.REJECT,
      READY_PICKUP: EventAction.READY_PICKUP,
      CHECKOUT: EventAction.CHECKOUT,
      REQUEST_RETURN: EventAction.REQUEST_RETURN,
      RECEIVE_RETURN: EventAction.RECEIVE_RETURN,
      CANCEL: EventAction.CANCEL,
      FLAG_OVERDUE: EventAction.OVERDUE_FLAG
    };

    await logEvent({
      entityType: 'borrow_request',
      entityId: request.id,
      action: eventActionMap[params.action],
      remark: params.remark,
      metadata: params.reasonCode ? { reasonCode: params.reasonCode } : undefined,
      actorId: params.actorId,
      client: tx
    });

    return updated;
  });
}

export async function flagOverdue() {
  const now = new Date();
  const overdue = await prisma.borrowRequest.findMany({
    where: {
      status: 'CHECKED_OUT',
      endDatePlan: { lt: now },
      deletedAt: null
    }
  });

  for (const request of overdue) {
    await prisma.$transaction(async tx => {
      const before = request;
      const updated = await tx.borrowRequest.update({
        where: { id: request.id },
        data: { status: 'OVERDUE', currentAssigneeRole: 'staff' }
      });
      await logAudit({
        tableName: 'borrow_requests',
        recordId: request.id,
        action: AuditAction.STATE_TRANSITION,
        before,
        after: updated,
        actorId: request.borrowerId,
        client: tx
      });
      await logEvent({
        entityType: 'borrow_request',
        entityId: request.id,
        action: EventAction.OVERDUE_FLAG,
        remark: 'Auto-flag overdue',
        actorId: request.borrowerId,
        client: tx
      });
    });
  }
}
