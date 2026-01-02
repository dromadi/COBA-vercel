import { Role } from '@prisma/client';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};
