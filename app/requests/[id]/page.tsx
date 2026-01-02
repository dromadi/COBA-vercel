import AppShell from '@/app/_components/AppShell';
import { requireUser, requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { requestItemSchema, correctionSchema, requestCreateSchema } from '@/lib/validation';
import { transitionRequest, addRequestItem, updateRequestDetail } from '@/lib/services/request';
import { formatDateId, isoFromDateInput } from '@/lib/time';
import { put } from '@vercel/blob';
import { logAudit } from '@/lib/services/audit';
import { logEvent } from '@/lib/services/event';
import { AttachmentEntityType, AuditAction, EventAction, RequestStatus } from '@prisma/client';

const statusBadge: Record<RequestStatus, string> = {
  DRAFT: 'badge-status badge-status--info',
  SUBMITTED: 'badge-status badge-status--primary',
  STAFF_REVIEW: 'badge-status badge-status--warning',
  APPROVAL_PENDING: 'badge-status badge-status--warning',
  APPROVED: 'badge-status badge-status--good',
  READY_FOR_PICKUP: 'badge-status badge-status--info',
  CHECKED_OUT: 'badge-status badge-status--primary',
  RETURN_REQUESTED: 'badge-status badge-status--warning',
  RETURNED: 'badge-status badge-status--good',
  REJECTED: 'badge-status badge-status--danger',
  CANCELLED: 'badge-status badge-status--danger',
  OVERDUE: 'badge-status badge-status--danger'
};

async function addItemAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  const requestId = String(formData.get('requestId') || '');
  const parsed = requestItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/requests/${requestId}?error=Item%20tidak%20lengkap`);
  try {
    await addRequestItem({
      actorId: user.id,
      requestId,
      toolId: parsed.data.toolId,
      qty: parsed.data.qty,
      note: parsed.data.note
    });
    redirect(`/requests/${requestId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menambah item';
    redirect(`/requests/${requestId}?error=${encodeURIComponent(message)}`);
  }
}

async function updateDetailAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  const requestId = String(formData.get('requestId') || '');
  const parsed = requestCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/requests/${requestId}?error=Data%20tidak%20lengkap`);
  try {
    await updateRequestDetail({
      actorId: user.id,
      requestId,
      purpose: parsed.data.purpose,
      startDate: new Date(isoFromDateInput(parsed.data.startDate)),
      endDatePlan: new Date(isoFromDateInput(parsed.data.endDatePlan))
    });
    redirect(`/requests/${requestId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui request';
    redirect(`/requests/${requestId}?error=${encodeURIComponent(message)}`);
  }
}

async function transitionAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  const requestId = String(formData.get('requestId') || '');
  const action = String(formData.get('action') || '') as any;
  const remark = String(formData.get('remark') || '') || undefined;
  const reasonCode = String(formData.get('reasonCode') || '') || undefined;
  try {
    await transitionRequest({ actorId: user.id, role: user.role, requestId, action, remark, reasonCode });
    redirect(`/requests/${requestId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Aksi gagal';
    redirect(`/requests/${requestId}?error=${encodeURIComponent(message)}`);
  }
}

async function uploadAttachmentAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  const requestId = String(formData.get('requestId') || '');
  const entityType = String(formData.get('entityType') || '');
  const requiredType = String(formData.get('requiredType') || '');
  const file = formData.get('file') as File | null;
  if (!file) redirect(`/requests/${requestId}?error=File%20wajib%20diunggah`);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = await put(`trl/${requestId}/${Date.now()}-${file.name}`, arrayBuffer, {
      access: 'public',
      contentType: file.type
    });

    await prisma.$transaction(async tx => {
      const attachment = await tx.attachment.create({
        data: {
          entityType: entityType as any,
          entityId: requestId,
          fileName: file.name,
          fileUrl: blob.url,
          mimeType: file.type,
          fileSize: file.size,
          requiredType: requiredType as any,
          uploadedBy: user.id
        }
      });

      await logAudit({
        tableName: 'attachments',
        recordId: attachment.id,
        action: AuditAction.CREATE,
        after: attachment,
        actorId: user.id,
        client: tx
      });

      await logEvent({
        entityType: 'attachment',
        entityId: attachment.id,
        action: EventAction.CREATE,
        actorId: user.id,
        client: tx
      });
    });

    redirect(`/requests/${requestId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal upload lampiran';
    redirect(`/requests/${requestId}?error=${encodeURIComponent(message)}`);
  }
}

async function createCorrectionAction(formData: FormData) {
  'use server';
  const user = await requireUser();
  const requestId = String(formData.get('requestId') || '');
  const parsed = correctionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/requests/${requestId}?error=Data%20koreksi%20tidak%20lengkap`);
  try {
    await prisma.$transaction(async tx => {
      const note = await tx.correctionNote.create({
        data: {
          entityType: 'borrow_request',
          entityId: requestId,
          reasonCode: parsed.data.reasonCode,
          reasonText: parsed.data.reasonText,
          requestedBy: user.id,
          status: 'PENDING'
        }
      });

      await tx.correctionNoteAction.create({
        data: {
          correctionNoteId: note.id,
          patch: {
            field: parsed.data.field,
            oldValue: parsed.data.oldValue,
            newValue: parsed.data.newValue
          },
          actorId: user.id
        }
      });

      await logEvent({
        entityType: 'correction_note',
        entityId: note.id,
        action: EventAction.CORRECTION_REQUEST,
        actorId: user.id,
        client: tx
      });
    });

    redirect(`/requests/${requestId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat koreksi';
    redirect(`/requests/${requestId}?error=${encodeURIComponent(message)}`);
  }
}

async function decideCorrectionAction(formData: FormData) {
  'use server';
  const admin = await requireRole(['admin']);
  const correctionId = String(formData.get('correctionId') || '');
  const decision = String(formData.get('decision') || '');
  const correction = await prisma.correctionNote.findUnique({
    where: { id: correctionId },
    include: { actions: true }
  });
  if (!correction) redirect('/requests');

  await prisma.$transaction(async tx => {
    if (decision === 'APPROVE') {
      const patch = correction.actions[0]?.patch as any;
      if (patch?.field) {
        const request = await tx.borrowRequest.findUnique({ where: { id: correction.entityId } });
        if (request) {
          const data: any = {};
          if (patch.field === 'endDatePlan') data.endDatePlan = new Date(patch.newValue);
          if (patch.field === 'startDate') data.startDate = new Date(patch.newValue);
          if (patch.field === 'purpose') data.purpose = patch.newValue;
          const updated = await tx.borrowRequest.update({ where: { id: request.id }, data });
          await logAudit({
            tableName: 'borrow_requests',
            recordId: request.id,
            action: AuditAction.UPDATE,
            before: request,
            after: updated,
            actorId: admin.id,
            client: tx
          });
        }
      }
    }

    await tx.correctionNote.update({
      where: { id: correctionId },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedBy: admin.id,
        decidedAt: new Date()
      }
    });

    await logEvent({
      entityType: 'correction_note',
      entityId: correctionId,
      action: EventAction.CORRECTION_DECISION,
      metadata: { decision },
      actorId: admin.id,
      client: tx
    });
  });

  redirect(`/requests/${correction.entityId}`);
}

export default async function RequestDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { error?: string } }) {
  const user = await requireUser();
  const request = await prisma.borrowRequest.findUnique({
    where: { id: params.id },
    include: {
      borrower: true,
      items: { include: { tool: true } },
      correctionNotes: { include: { actions: true, requester: true, approver: true } }
    }
  });

  if (!request) redirect('/requests');
  if (user.role === 'peminjam' && request.borrowerId !== user.id) redirect('/403');

  const attachments = await prisma.attachment.findMany({
    where: {
      entityId: request.id,
      entityType: { in: [AttachmentEntityType.REQUEST, AttachmentEntityType.HANDOVER, AttachmentEntityType.RETURN] },
      deletedAt: null
    }
  });

  const tools = await prisma.tool.findMany({
    where: { isActive: true, deletedAt: null },
    include: { condition: true }
  });

  const reasons = await prisma.masterReason.findMany({ where: { isActive: true, deletedAt: null } });

  const hasHandover = attachments.some(att => att.requiredType === 'BA_HANDOVER');
  const hasReturn = attachments.some(att => att.requiredType === 'BA_RETURN');

  const isBorrower = user.id === request.borrowerId;

  return (
    <AppShell user={user}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h5 mb-1">Detail Request {request.requestNo}</h1>
          <span className={statusBadge[request.status]}>{request.status}</span>
        </div>
        <LinkBack />
      </div>
      {searchParams?.error && <div className="alert alert-danger">{searchParams.error}</div>}

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card-glass p-3 mb-3">
              <h2 className="h6 mb-2">Informasi Request</h2>
              <div className="small-muted mb-3">Peminjam: {request.borrower.name}</div>
              {request.status === 'DRAFT' && isBorrower ? (
                <form action={updateDetailAction} className="row g-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="col-12">
                    <label className="form-label">Tujuan</label>
                    <input name="purpose" className="form-control" defaultValue={request.purpose} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tanggal Mulai</label>
                    <input
                      name="startDate"
                      type="date"
                      className="form-control"
                      defaultValue={request.startDate.toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Rencana Kembali</label>
                    <input
                      name="endDatePlan"
                      type="date"
                      className="form-control"
                      defaultValue={request.endDatePlan.toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-outline-primary btn-sm">Simpan Perubahan</button>
                  </div>
                </form>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <div className="small-muted">Tujuan</div>
                    <div className="fw-semibold">{request.purpose}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="small-muted">Tanggal</div>
                    <div className="fw-semibold">{formatDateId(request.startDate)} - {formatDateId(request.endDatePlan)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-glass p-3">
              <h2 className="h6 mb-2">Item Alat</h2>
              {request.items.length === 0 ? (
                <div className="small-muted">Belum ada item.</div>
              ) : (
                <ul className="list-group mb-3">
                  {request.items.map(item => (
                    <li key={item.id} className="list-group-item d-flex justify-content-between">
                      <span>{item.tool.toolCode} • {item.tool.name}</span>
                      <span>x{item.qty}</span>
                    </li>
                  ))}
                </ul>
              )}

              {request.status === 'DRAFT' && isBorrower && (
                <form action={addItemAction} className="row g-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="col-md-8">
                    <label className="form-label">Pilih Alat</label>
                    <select name="toolId" className="form-select" required>
                      <option value="">Pilih alat</option>
                      {tools.map(tool => (
                        <option key={tool.id} value={tool.id}>
                          {tool.toolCode} • {tool.name} ({tool.condition.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Qty</label>
                    <input name="qty" type="number" className="form-control" min={1} defaultValue={1} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Catatan</label>
                    <input name="note" className="form-control" />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary btn-sm">Tambah Item</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card-glass p-3 mb-3">
              <h2 className="h6 mb-2">Aksi FSM</h2>
              <div className="d-flex flex-column gap-2">
                {request.status === 'DRAFT' && isBorrower && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="SUBMIT" />
                    <button className="btn btn-primary btn-sm" type="submit">Submit Request</button>
                  </form>
                )}

                {request.status === 'SUBMITTED' && ['staff', 'admin'].includes(user.role) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="STAFF_REVIEW" />
                    <button className="btn btn-outline-primary btn-sm" type="submit">Mulai Review Staff</button>
                  </form>
                )}

                {request.status === 'STAFF_REVIEW' && ['staff', 'admin'].includes(user.role) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="SEND_TO_APPROVAL" />
                    <button className="btn btn-outline-primary btn-sm" type="submit">Kirim ke Approval</button>
                  </form>
                )}

                {request.status === 'APPROVAL_PENDING' && ['approval', 'admin'].includes(user.role) && (
                  <div className="d-flex flex-column gap-2">
                    <form action={transitionAction} className="d-flex flex-column gap-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="action" value="APPROVE" />
                      <button className="btn btn-success btn-sm" type="submit">Approve</button>
                    </form>
                    <form action={transitionAction} className="d-flex flex-column gap-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="action" value="REJECT" />
                      <select name="reasonCode" className="form-select form-select-sm" required>
                        <option value="">Alasan reject</option>
                        {reasons.map(reason => (
                          <option key={reason.id} value={reason.code}>{reason.name}</option>
                        ))}
                      </select>
                      <input name="remark" className="form-control form-control-sm" placeholder="Catatan reject" required />
                      <button className="btn btn-danger btn-sm" type="submit">Reject</button>
                    </form>
                  </div>
                )}

                {request.status === 'APPROVED' && ['staff', 'admin'].includes(user.role) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="READY_PICKUP" />
                    <button className="btn btn-outline-primary btn-sm" type="submit">Tandai Ready Pickup</button>
                  </form>
                )}

                {request.status === 'READY_FOR_PICKUP' && ['staff', 'admin'].includes(user.role) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="CHECKOUT" />
                    <button className="btn btn-primary btn-sm" type="submit" disabled={!hasHandover}>
                      Check-out / Serah Terima
                    </button>
                    {!hasHandover && <div className="small-muted">Upload BA serah terima untuk mengaktifkan.</div>}
                  </form>
                )}

                {['CHECKED_OUT', 'OVERDUE'].includes(request.status) && (isBorrower || ['staff', 'admin'].includes(user.role)) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="REQUEST_RETURN" />
                    <button className="btn btn-outline-primary btn-sm" type="submit">Ajukan Return</button>
                  </form>
                )}

                {request.status === 'RETURN_REQUESTED' && ['staff', 'admin'].includes(user.role) && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="RECEIVE_RETURN" />
                    <button className="btn btn-success btn-sm" type="submit" disabled={!hasReturn}>
                      Terima Pengembalian
                    </button>
                    {!hasReturn && <div className="small-muted">Upload BA return sebelum menerima.</div>}
                  </form>
                )}

                {['DRAFT', 'SUBMITTED'].includes(request.status) && isBorrower && (
                  <form action={transitionAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="CANCEL" />
                    <button className="btn btn-outline-danger btn-sm" type="submit">Batalkan</button>
                  </form>
                )}
              </div>
            </div>

            <div className="card-glass p-3 mb-3">
              <h2 className="h6 mb-2">Lampiran</h2>
              <div className="small-muted mb-2">Upload BA serah terima dan BA pengembalian sesuai tahap.</div>
              <div className="d-flex flex-column gap-2">
                {['staff', 'admin'].includes(user.role) && (
                  <form action={uploadAttachmentAction} encType="multipart/form-data">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="entityType" value="HANDOVER" />
                    <input type="hidden" name="requiredType" value="BA_HANDOVER" />
                    <input name="file" type="file" className="form-control form-control-sm" required />
                    <button className="btn btn-outline-primary btn-sm mt-2" type="submit">Upload BA Handover</button>
                  </form>
                )}
                {['staff', 'admin'].includes(user.role) && (
                  <form action={uploadAttachmentAction} encType="multipart/form-data">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="entityType" value="RETURN" />
                    <input type="hidden" name="requiredType" value="BA_RETURN" />
                    <input name="file" type="file" className="form-control form-control-sm" required />
                    <button className="btn btn-outline-primary btn-sm mt-2" type="submit">Upload BA Return</button>
                  </form>
                )}
              </div>
              <ul className="list-unstyled mt-3">
                {attachments.map(att => (
                  <li key={att.id}>
                    <a href={att.fileUrl} target="_blank" rel="noreferrer">{att.fileName}</a>
                  </li>
                ))}
              </ul>
            </div>

            {['APPROVED', 'READY_FOR_PICKUP', 'CHECKED_OUT', 'OVERDUE', 'RETURN_REQUESTED'].includes(request.status) && (
              <div className="card-glass p-3">
                <h2 className="h6 mb-2">Correction Note</h2>
                <form action={createCorrectionAction} className="row g-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <div className="col-12">
                    <label className="form-label">Alasan</label>
                    <select name="reasonCode" className="form-select" required>
                      <option value="">Pilih alasan</option>
                      {reasons.map(reason => (
                        <option key={reason.id} value={reason.code}>{reason.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Field yang dikoreksi</label>
                    <select name="field" className="form-select" required>
                      <option value="">Pilih field</option>
                      <option value="purpose">Tujuan</option>
                      <option value="startDate">Tanggal mulai</option>
                      <option value="endDatePlan">Rencana kembali</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Nilai Baru</label>
                    <input name="newValue" className="form-control" required />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-outline-primary btn-sm" type="submit">Ajukan Koreksi</button>
                  </div>
                </form>

                <div className="mt-3">
                  <h3 className="h6">Daftar Correction Note</h3>
                  {request.correctionNotes.length === 0 ? (
                    <div className="small-muted">Belum ada koreksi.</div>
                  ) : (
                    <ul className="list-unstyled">
                      {request.correctionNotes.map(note => (
                        <li key={note.id} className="border rounded p-2 mb-2">
                          <div className="small-muted">{note.reasonCode} • {note.status}</div>
                          <div className="small">Diajukan oleh {note.requester.name}</div>
                          {user.role === 'admin' && note.status === 'PENDING' && (
                            <form action={decideCorrectionAction} className="d-flex gap-2 mt-2">
                              <input type="hidden" name="correctionId" value={note.id} />
                              <button name="decision" value="APPROVE" className="btn btn-success btn-sm" type="submit">Approve</button>
                              <button name="decision" value="REJECT" className="btn btn-outline-danger btn-sm" type="submit">Reject</button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </AppShell>
  );
}

function LinkBack() {
  return (
    <a className="btn btn-outline-secondary btn-sm" href="/requests">Kembali</a>
  );
}
