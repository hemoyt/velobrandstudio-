import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { errorResponse } from '@/lib/api-response';
import { slugify, randomSuffix } from '@/lib/slug';

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from('team_members')
      .select('role, teams:team_id (id, name, slug, created_at)')
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ teams: data.map((row) => ({ ...row.teams, role: row.role })) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    const { name } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const base = slugify(name) || 'team';
    let slug = `${base}-${randomSuffix()}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name: name.trim(), slug, created_by: user.id })
        .select()
        .single();

      if (!error) return NextResponse.json({ team: data }, { status: 201 });
      if (error.code !== '23505') throw error; // not a unique-violation, don't retry
      slug = `${base}-${randomSuffix()}`;
    }

    return NextResponse.json({ error: 'Could not allocate a unique team slug, try again' }, { status: 500 });
  } catch (err) {
    return errorResponse(err);
  }
}
