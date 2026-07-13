import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings, defaultOutputDir } from '@/lib/local/store';
import { errorResponse } from '@/lib/api-response';

function hint(key: string | null): string | null {
  if (!key) return null;
  return key.length > 8 ? `••••${key.slice(-4)}` : '••••';
}

function shape(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    openaiKeyHint: hint(settings.openaiApiKey),
    geminiKeyHint: hint(settings.geminiApiKey),
    openrouterKeyHint: hint(settings.openrouterApiKey),
    openrouterTextModel: settings.openrouterTextModel,
    openrouterImageModel: settings.openrouterImageModel,
    outputDir: settings.outputDir,
    defaultOutputDir: defaultOutputDir(),
  };
}

// Full keys never leave the server — the UI only ever sees a masked hint.
export async function GET() {
  try {
    return NextResponse.json(shape(await getSettings()));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const update: Parameters<typeof saveSettings>[0] = {};

    // A string sets the value, null clears it, absence leaves it untouched.
    if (body.openaiApiKey !== undefined) {
      update.openaiApiKey = typeof body.openaiApiKey === 'string' && body.openaiApiKey.trim() ? body.openaiApiKey.trim() : null;
    }
    if (body.geminiApiKey !== undefined) {
      update.geminiApiKey = typeof body.geminiApiKey === 'string' && body.geminiApiKey.trim() ? body.geminiApiKey.trim() : null;
    }
    if (body.openrouterApiKey !== undefined) {
      update.openrouterApiKey =
        typeof body.openrouterApiKey === 'string' && body.openrouterApiKey.trim() ? body.openrouterApiKey.trim() : null;
    }
    if (body.openrouterTextModel !== undefined) {
      update.openrouterTextModel =
        typeof body.openrouterTextModel === 'string' && body.openrouterTextModel.trim() ? body.openrouterTextModel.trim() : null;
    }
    if (body.openrouterImageModel !== undefined) {
      update.openrouterImageModel =
        typeof body.openrouterImageModel === 'string' && body.openrouterImageModel.trim() ? body.openrouterImageModel.trim() : null;
    }
    if (typeof body.outputDir === 'string' && body.outputDir.trim()) {
      update.outputDir = body.outputDir.trim();
    }

    const settings = await saveSettings(update);
    return NextResponse.json(shape(settings));
  } catch (err) {
    return errorResponse(err);
  }
}
