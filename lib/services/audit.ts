import { prisma } from '@/lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

export async function logAudit(params: {
  tableName: string;
  recordId: string;
  action: AuditAction;
  before?: any;
  after?: any;
  actorId: string;
  client?: Prisma.TransactionClient;
}) {
  const client = params.client ?? prisma;
  return client.auditLog.create({
    data: {
      tableName: params.tableName,
      recordId: params.recordId,
      action: params.action,
      before: params.before,
      after: params.after,
      actorId: params.actorId
    }
  });
}
