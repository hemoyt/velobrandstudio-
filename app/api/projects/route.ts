import { NextRequest, NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/local/store';
import { errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, industry } = await req.json();
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const project = await createProject(name.trim(), typeof industry === 'string' ? industry : 'General / Corporate');
    return NextResponse.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}
