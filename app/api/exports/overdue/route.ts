import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';
import { formatDateId } from '@/lib/time';
import { logEvent } from '@/lib/services/event';
import { EventAction } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const overdue = await prisma.borrowRequest.findMany({
    where: { status: 'OVERDUE', deletedAt: null },
    include: { borrower: true, items: { include: { tool: true } } }
  });

  const rows = overdue.map(req => ({
    Nomor: req.requestNo,
    Peminjam: req.borrower.name,
    Mulai: formatDateId(req.startDate),
    RencanaKembali: formatDateId(req.endDatePlan),
    Item: req.items.map(item => `${item.tool.toolCode} (${item.qty})`).join(', ')
  }));

  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Overdue');
  const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

  await logEvent({
    entityType: 'export',
    entityId: 'overdue',
    action: EventAction.EXPORT,
    actorId: session.user.id,
    metadata: { count: overdue.length }
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="overdue.xlsx"'
    }
  });
}
