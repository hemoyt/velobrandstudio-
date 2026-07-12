import { NextRequest, NextResponse } from 'next/server';
import { duplicateProject } from '@/lib/local/store';
import { errorResponse } from '@/lib/api-response';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const project = await duplicateProject(projectId);
    return NextResponse.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}
