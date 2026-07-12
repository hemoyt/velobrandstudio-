import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject, type StoredProject } from '@/lib/local/store';
import { errorResponse } from '@/lib/api-response';

const VALID_STATUSES: StoredProject['status'][] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    return NextResponse.json({ project: await getProject(projectId) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const project = await updateProject(projectId, (p) => {
      // clientName is the historical field name the UI sends for the project name.
      if (typeof body.clientName === 'string') p.name = body.clientName;
      if (typeof body.name === 'string') p.name = body.name;
      if (typeof body.industry === 'string') p.industry = body.industry;
      if (typeof body.brief === 'string') p.brief = body.brief;
      if (typeof body.selectedLogoAssetId === 'string' || body.selectedLogoAssetId === null) {
        p.selectedLogoAssetId = body.selectedLogoAssetId;
      }
      if (body.status) p.status = body.status;
    });

    return NextResponse.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    await deleteProject(projectId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
