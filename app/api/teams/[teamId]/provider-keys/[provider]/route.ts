import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import type { AiProvider } from '@/lib/supabase/database.types';

const VALID_PROVIDERS: AiProvider[] = ['openai', 'gemini'];

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; provider: string }> },
) {
  try {
    const { teamId, provider } = await params;
    if (!VALID_PROVIDERS.includes(provider as AiProvider)) {
      return NextResponse.json({ error: `provider must be one of ${VALID_PROVIDERS.join(', ')}` }, { status: 400 });
    }
    const { supabase, user } = await requireTeamRole(teamId, 'admin');

    const { error } = await supabase.from('provider_keys').delete().eq('team_id', teamId).eq('provider', provider as AiProvider);
    if (error) throw error;

    await logActivity(supabase, { teamId, actorId: user.id, action: 'provider_key.removed', targetType: 'provider_key', metadata: { provider } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
