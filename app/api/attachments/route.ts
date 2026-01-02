import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import type { AttachmentEntityType, AttachmentRequiredType } from '@/lib/constants/prisma-enums';
import { AuditAction, EventAction } from '@/lib/constants/prisma-enums';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const entityType = formData.get('entityType') as AttachmentEntityType | null;
  const entityId = formData.get('entityId') as string | null;
  const requiredType = formData.get('requiredType') as AttachmentRequiredType | null;

  if (!file || !entityType || !entityId || !requiredType) {
    return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const blob = await put(`trl/${entityId}/${Date.now()}-${file.name}`, arrayBuffer, {
    access: 'public',
    contentType: file.type
  });

  const attachment = await prisma.$transaction(async tx => {
    const created = await tx.attachment.create({
      data: {
        entityType,
        entityId,
        fileName: file.name,
        fileUrl: blob.url,
        mimeType: file.type,
        fileSize: file.size,
        requiredType,
        uploadedBy: session.user.id
      }
    });

    await logAudit({
      tableName: 'attachments',
      recordId: created.id,
      action: AuditAction.CREATE,
      after: created,
      actorId: session.user.id,
      client: tx
    });

    await logEvent({
      entityType: 'attachment',
      entityId: created.id,
      action: EventAction.CREATE,
      actorId: session.user.id,
      client: tx
    });

    return created;
  });

  return NextResponse.json({ id: attachment.id, url: blob.url });
}
