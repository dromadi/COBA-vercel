import { PrismaClient, Role, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 10);

  const users = [
    { name: 'Admin TRL', email: 'admin@trl.local', role: Role.admin },
    { name: 'Staff TRL', email: 'staff@trl.local', role: Role.staff },
    { name: 'Approval TRL', email: 'approval@trl.local', role: Role.approval },
    { name: 'Peminjam TRL', email: 'peminjam@trl.local', role: Role.peminjam }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash: password }
    });
  }

  const categories = [
    { code: 'GEN', name: 'General Tools' },
    { code: 'LFT', name: 'Lifting Tools' },
    { code: 'MEAS', name: 'Measurement Tools' }
  ];

  const locations = [
    { code: 'PNS', name: 'Pusat' },
    { code: 'LBA', name: 'Lubricant Area' },
    { code: 'KST', name: 'KS Tubun' }
  ];

  const conditions = [
    { code: 'BAIK', name: 'Baik' },
    { code: 'RUSAK_RINGAN', name: 'Rusak Ringan' },
    { code: 'RUSAK_BERAT', name: 'Rusak Berat' },
    { code: 'KALIBRASI', name: 'Kalibrasi' },
    { code: 'MAINT', name: 'Maintenance' }
  ];

  const reasons = [
    { code: 'REJECT_AVAIL', name: 'Alat tidak tersedia' },
    { code: 'REJECT_DOC', name: 'Dokumen tidak lengkap' },
    { code: 'CORR_DATE', name: 'Koreksi tanggal' },
    { code: 'CORR_TOOL', name: 'Koreksi alat' }
  ];

  for (const category of categories) {
    await prisma.toolCategory.upsert({ where: { code: category.code }, update: {}, create: category });
  }
  for (const location of locations) {
    await prisma.location.upsert({ where: { code: location.code }, update: {}, create: location });
  }
  for (const condition of conditions) {
    await prisma.condition.upsert({ where: { code: condition.code }, update: {}, create: condition });
  }
  for (const reason of reasons) {
    await prisma.masterReason.upsert({ where: { code: reason.code }, update: {}, create: reason });
  }

  const category = await prisma.toolCategory.findFirst({ where: { code: 'GEN' } });
  const location = await prisma.location.findFirst({ where: { code: 'PNS' } });
  const condition = await prisma.condition.findFirst({ where: { code: 'BAIK' } });

  if (category && location && condition) {
    const existing = await prisma.tool.count();
    if (existing === 0) {
      const tools = Array.from({ length: 10 }).map((_, idx) => ({
        toolCode: `TL-${String(idx + 1).padStart(4, '0')}`,
        name: `Tool Contoh ${idx + 1}`,
        categoryId: category.id,
        locationId: location.id,
        unit: 'unit',
        conditionId: condition.id,
        ownershipStatus: 'Milik Perusahaan',
        assetNo: `AST-${String(idx + 1).padStart(3, '0')}`,
        serialNo: `SN-${String(idx + 1).padStart(4, '0')}`
      }));
      await prisma.tool.createMany({ data: tools });
    }
  }

  const admin = await prisma.user.findFirst({ where: { email: 'admin@trl.local' } });
  if (admin) {
    const req = await prisma.borrowRequest.findFirst();
    if (!req) {
      const request = await prisma.borrowRequest.create({
        data: {
          requestNo: 'REQ-0001',
          borrowerId: admin.id,
          purpose: 'Seed Request',
          startDate: new Date(),
          endDatePlan: new Date(),
          status: RequestStatus.DRAFT,
          currentAssigneeRole: Role.peminjam
        }
      });
      const tool = await prisma.tool.findFirst();
      if (tool) {
        await prisma.borrowRequestItem.create({ data: { requestId: request.id, toolId: tool.id, qty: 1 } });
      }
    }
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
