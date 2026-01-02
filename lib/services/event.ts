import { prisma } from '@/lib/prisma';
import { EventAction } from '@/lib/constants/prisma-enums';
import { Prisma } from '@prisma/client';

export async function logEvent(params: {
  entityType: string;
  entityId: string;
  action: EventAction;
  remark?: string | null;
  metadata?: any;
  actorId: string;
  client?: Prisma.TransactionClient;
}) {
  const client = params.client ?? prisma;
  return client.eventLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      remark: params.remark || null,
      metadata: params.metadata || undefined,
      actorId: params.actorId
    }
  });
}
