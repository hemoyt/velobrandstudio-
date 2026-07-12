import { NextResponse } from 'next/server';
import { HttpError } from '@/lib/local/store';
import { AIProviderError } from '@/lib/providers/types';

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError || err instanceof AIProviderError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  return NextResponse.json({ error: message }, { status: 500 });
}
