import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';
import { formatDateId } from '@/lib/time';
import { logEvent } from '@/lib/services/event';
import { EventAction } from '@/lib/constants/prisma-enums';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const tools = await prisma.tool.findMany({
    where: { deletedAt: null },
    include: { category: true, location: true, condition: true }
  });

  const rows = tools.map(tool => ({
    Kode: tool.toolCode,
    Nama: tool.name,
    Kategori: tool.category.name,
    Lokasi: tool.location.name,
    Kondisi: tool.condition.name,
    Unit: tool.unit,
    Kepemilikan: tool.ownershipStatus,
    Asset: tool.assetNo || '',
    Serial: tool.serialNo || '',
    Dibuat: formatDateId(tool.createdAt)
  }));

  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Tools');
  const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

  await logEvent({
    entityType: 'export',
    entityId: 'tools',
    action: EventAction.EXPORT,
    actorId: session.user.id,
    metadata: { count: tools.length }
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="tools.xlsx"'
    }
  });
}
