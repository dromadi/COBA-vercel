-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'staff', 'approval', 'peminjam');

CREATE TYPE "RequestStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'STAFF_REVIEW',
  'APPROVAL_PENDING',
  'APPROVED',
  'READY_FOR_PICKUP',
  'CHECKED_OUT',
  'RETURN_REQUESTED',
  'RETURNED',
  'REJECTED',
  'CANCELLED',
  'OVERDUE'
);

CREATE TYPE "AttachmentEntityType" AS ENUM ('REQUEST', 'ITEM', 'HANDOVER', 'RETURN', 'CORRECTION');
CREATE TYPE "AttachmentRequiredType" AS ENUM ('SURAT_TUGAS', 'BA_HANDOVER', 'BA_RETURN', 'CORRECTION_NOTE', 'OTHER');

CREATE TYPE "EventAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'SUBMIT',
  'STAFF_REVIEW',
  'SEND_TO_APPROVAL',
  'APPROVE',
  'REJECT',
  'READY_PICKUP',
  'CHECKOUT',
  'REQUEST_RETURN',
  'RECEIVE_RETURN',
  'CANCEL',
  'OVERDUE_FLAG',
  'CORRECTION_REQUEST',
  'CORRECTION_DECISION',
  'SOFT_DELETE',
  'RESTORE',
  'EXPORT'
);

CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'STATE_TRANSITION');
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ToolCategory" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ToolCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Condition" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tool" (
  "id" TEXT NOT NULL,
  "toolCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "assetNo" TEXT,
  "serialNo" TEXT,
  "unit" TEXT NOT NULL,
  "conditionId" TEXT NOT NULL,
  "ownershipStatus" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BorrowRequest" (
  "id" TEXT NOT NULL,
  "requestNo" TEXT NOT NULL,
  "borrowerId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDatePlan" TIMESTAMP(3) NOT NULL,
  "status" "RequestStatus" NOT NULL,
  "currentAssigneeRole" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "checkedOutAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "BorrowRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BorrowRequestItem" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "BorrowRequestItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attachment" (
  "id" TEXT NOT NULL,
  "entityType" "AttachmentEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "requiredType" "AttachmentRequiredType" NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventLog" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "EventAction" NOT NULL,
  "remark" TEXT,
  "metadata" JSONB,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorrectionNote" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "reasonText" TEXT,
  "requestedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),

  CONSTRAINT "CorrectionNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorrectionNoteAction" (
  "id" TEXT NOT NULL,
  "correctionNoteId" TEXT NOT NULL,
  "patch" JSONB NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CorrectionNoteAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterReason" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "MasterReason_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ToolCategory_code_key" ON "ToolCategory"("code");
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");
CREATE UNIQUE INDEX "Condition_code_key" ON "Condition"("code");
CREATE UNIQUE INDEX "Tool_toolCode_key" ON "Tool"("toolCode");
CREATE UNIQUE INDEX "BorrowRequest_requestNo_key" ON "BorrowRequest"("requestNo");
CREATE UNIQUE INDEX "MasterReason_code_key" ON "MasterReason"("code");

-- Foreign keys
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ToolCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BorrowRequestItem" ADD CONSTRAINT "BorrowRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BorrowRequestItem" ADD CONSTRAINT "BorrowRequestItem_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorrectionNote" ADD CONSTRAINT "CorrectionNote_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CorrectionNote" ADD CONSTRAINT "CorrectionNote_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CorrectionNoteAction" ADD CONSTRAINT "CorrectionNoteAction_correctionNoteId_fkey" FOREIGN KEY ("correctionNoteId") REFERENCES "CorrectionNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CorrectionNoteAction" ADD CONSTRAINT "CorrectionNoteAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
