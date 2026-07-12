import { NextRequest, NextResponse } from 'next/server';
import { updateProject } from '@/lib/local/store';
import { errorResponse } from '@/lib/api-response';
import type { BrandIdentity } from '@/types';

const STRING_FIELDS: (keyof BrandIdentity)[] = [
  'businessName',
  'description',
  'mission',
  'tagline',
  'brandVoice',
  'targetAudience',
  'elevatorPitch',
  'imageryStyle',
];
const STRING_ARRAY_FIELDS: (keyof BrandIdentity)[] = ['values', 'personality', 'sampleCaptions', 'colorPalette'];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

// Manual, human edits to a project's brand identity — the counterpart to
// /api/ai/regenerate-field, which asks the AI for a fresh value instead.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const project = await updateProject(projectId, (p) => {
      const identity: BrandIdentity = p.brandIdentity ?? {
        businessName: p.name,
        description: '',
        colorPalette: [],
        typography: { heading: '', body: '' },
        brandVoice: '',
        tagline: '',
        targetAudience: '',
      };
      const record = identity as unknown as Record<string, unknown>;

      for (const field of STRING_FIELDS) {
        if (typeof body[field] === 'string') record[field] = body[field];
      }
      for (const field of STRING_ARRAY_FIELDS) {
        if (isStringArray(body[field])) record[field] = body[field];
      }
      if (body.typography && typeof body.typography === 'object') {
        const t = body.typography as Record<string, unknown>;
        identity.typography = {
          heading: typeof t.heading === 'string' ? t.heading : identity.typography.heading,
          body: typeof t.body === 'string' ? t.body : identity.typography.body,
        };
      }
      if (body.socialBios && typeof body.socialBios === 'object') {
        const s = body.socialBios as Record<string, unknown>;
        identity.socialBios = {
          instagram: typeof s.instagram === 'string' ? s.instagram : identity.socialBios?.instagram,
          twitter: typeof s.twitter === 'string' ? s.twitter : identity.socialBios?.twitter,
          linkedin: typeof s.linkedin === 'string' ? s.linkedin : identity.socialBios?.linkedin,
        };
      }

      p.brandIdentity = identity;
    });

    return NextResponse.json({ brandIdentity: project.brandIdentity });
  } catch (err) {
    return errorResponse(err);
  }
}
