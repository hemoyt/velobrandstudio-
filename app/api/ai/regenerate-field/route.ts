import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject } from '@/lib/local/store';
import { getTextProvider } from '@/lib/providers/resolve';
import { AIProviderError } from '@/lib/providers/types';
import { REGENERABLE_FIELDS, type RegenerableField } from '@/lib/providers/brand-prompt';
import { errorResponse } from '@/lib/api-response';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { projectId, field } = (await req.json()) as { projectId?: string; field?: string };
    if (!projectId || !field) {
      return NextResponse.json({ error: 'projectId and field are required' }, { status: 400 });
    }
    if (!REGENERABLE_FIELDS.includes(field as RegenerableField)) {
      return NextResponse.json({ error: `Unknown field: ${field}` }, { status: 400 });
    }

    const project = await getProject(projectId);
    if (!project.brandIdentity) {
      return NextResponse.json({ error: 'This project has no brand identity yet' }, { status: 422 });
    }

    const provider = await getTextProvider();
    if (!provider.regenerateIdentityField) {
      throw new AIProviderError('Field regeneration is unavailable', 422);
    }

    const value = await provider.regenerateIdentityField(
      field as RegenerableField,
      project.brief || project.brandIdentity.description,
      project.brandIdentity,
    );

    const updated = await updateProject(projectId, (p) => {
      if (!p.brandIdentity) return;
      (p.brandIdentity as unknown as Record<string, unknown>)[field] = value;
    });

    return NextResponse.json({ field, value, brandIdentity: updated.brandIdentity });
  } catch (err) {
    return errorResponse(err);
  }
}
