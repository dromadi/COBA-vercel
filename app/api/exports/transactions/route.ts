import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';
import { formatDateId } from '@/lib/time';
import { EventAction, RequestStatus } from '@prisma/client';
import { logEvent } from '@/lib/services/event';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  const status = url.searchParams.get('status') as RequestStatus | null;

  const where: any = { deletedAt: null };
  if (status) where.status = status;
  if (start && end) {
    where.startDate = { gte: new Date(start) };
    where.endDatePlan = { lte: new Date(end) };
  }

  const requests = await prisma.borrowRequest.findMany({
    where,
    include: { borrower: true, items: { include: { tool: true } } }
  });

  const rows = requests.map(req => ({
    Nomor: req.requestNo,
    Peminjam: req.borrower.name,
    Status: req.status,
    Tujuan: req.purpose,
    Mulai: formatDateId(req.startDate),
    RencanaKembali: formatDateId(req.endDatePlan),
    Item: req.items.map(item => `${item.tool.toolCode} (${item.qty})`).join(', ')
  }));

  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Transaksi');
  const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

  await logEvent({
    entityType: 'export',
    entityId: 'transactions',
    action: EventAction.EXPORT,
    actorId: session.user.id,
    metadata: { count: requests.length, status }
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="transactions.xlsx"'
    }
  });
}
