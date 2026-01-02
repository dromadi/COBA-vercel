import { z } from 'zod';

export const requestCreateSchema = z.object({
  purpose: z.string().min(3),
  startDate: z.string().min(1),
  endDatePlan: z.string().min(1)
});

export const requestItemSchema = z.object({
  toolId: z.string().min(1),
  qty: z.coerce.number().min(1),
  note: z.string().optional()
});

export const approvalSchema = z.object({
  reasonCode: z.string().min(1),
  remark: z.string().min(3)
});

export const masterSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2)
});

export const toolSchema = z.object({
  toolCode: z.string().min(3),
  name: z.string().min(3),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  unit: z.string().min(1),
  conditionId: z.string().min(1),
  ownershipStatus: z.string().min(2),
  assetNo: z.string().optional(),
  serialNo: z.string().optional()
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'staff', 'approval', 'peminjam']),
  password: z.string().min(6)
});

export const correctionSchema = z.object({
  reasonCode: z.string().min(1),
  reasonText: z.string().optional(),
  field: z.string().min(1),
  oldValue: z.string().optional(),
  newValue: z.string().min(1)
});
