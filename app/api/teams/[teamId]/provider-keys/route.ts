import { NextRequest, NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/authz';
import { errorResponse, logActivity } from '@/lib/api-response';
import { encryptSecret } from '@/lib/crypto';
import type { AiProvider } from '@/lib/supabase/database.types';

const VALID_PROVIDERS: AiProvider[] = ['openai', 'gemini'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase } = await requireTeamRole(teamId, 'admin');
    const { data, error } = await supabase
      .from('provider_keys')
      .select('id, provider, added_by, created_at')
      .eq('team_id', teamId);
    if (error) throw error;
    return NextResponse.json({ providerKeys: data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { supabase, user } = await requireTeamRole(teamId, 'admin');
    const { provider, apiKey } = await req.json();

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `provider must be one of ${VALID_PROVIDERS.join(', ')}` }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return NextResponse.json({ error: 'A valid apiKey is required' }, { status: 400 });
    }

    const encrypted_key = encryptSecret(apiKey.trim());
    const { data, error } = await supabase
      .from('provider_keys')
      .upsert({ team_id: teamId, provider, encrypted_key, added_by: user.id }, { onConflict: 'team_id,provider' })
      .select('id, provider, added_by, created_at')
      .single();
    if (error) throw error;

    await logActivity(supabase, {
      teamId,
      actorId: user.id,
      action: 'provider_key.set',
      targetType: 'provider_key',
      targetId: data.id,
      metadata: { provider },
    });

    return NextResponse.json({ providerKey: data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
