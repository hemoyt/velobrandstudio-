import { mkdir, readFile, readdir, rm, writeFile, access, constants } from 'fs/promises';
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';
import { slugify, randomSuffix } from '@/lib/slug';
import type { BrandIdentity } from '@/types';

// ---------------------------------------------------------------------------
// VeloBrand Studio is local-first: everything lives in two folders on disk.
//
//  - The data dir (settings + project records as JSON). Small, private,
//    defaults to ~/.velobrand. Override with VELOBRAND_HOME (e.g. in Docker).
//  - The output dir (the user's actual designs — PNGs, MP4s), chosen by the
//    user in Settings. Defaults to ~/VeloBrand. Override the *default* with
//    VELOBRAND_OUTPUT_DIR; the value saved in Settings always wins.
//
// No database, no auth, no cloud. One process serves one user, so a simple
// per-project promise chain is enough to serialize concurrent writes (the
// setup wizard fires several generations at once).
// ---------------------------------------------------------------------------

export const DATA_DIR = process.env.VELOBRAND_HOME || path.join(os.homedir(), '.velobrand');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_OUTPUT_DIR = process.env.VELOBRAND_OUTPUT_DIR || path.join(os.homedir(), 'VeloBrand');

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface StudioSettings {
  openaiApiKey: string | null;
  geminiApiKey: string | null;
  /** Absolute path where generated designs are saved. */
  outputDir: string;
}

export async function getSettings(): Promise<StudioSettings> {
  try {
    const raw = JSON.parse(await readFile(SETTINGS_FILE, 'utf8'));
    return {
      openaiApiKey: typeof raw.openaiApiKey === 'string' && raw.openaiApiKey ? raw.openaiApiKey : null,
      geminiApiKey: typeof raw.geminiApiKey === 'string' && raw.geminiApiKey ? raw.geminiApiKey : null,
      outputDir: typeof raw.outputDir === 'string' && raw.outputDir ? raw.outputDir : DEFAULT_OUTPUT_DIR,
    };
  } catch {
    return { openaiApiKey: null, geminiApiKey: null, outputDir: DEFAULT_OUTPUT_DIR };
  }
}

export async function saveSettings(update: Partial<StudioSettings>): Promise<StudioSettings> {
  const current = await getSettings();
  const next: StudioSettings = {
    openaiApiKey: update.openaiApiKey !== undefined ? update.openaiApiKey : current.openaiApiKey,
    geminiApiKey: update.geminiApiKey !== undefined ? update.geminiApiKey : current.geminiApiKey,
    outputDir: update.outputDir !== undefined && update.outputDir ? update.outputDir : current.outputDir,
  };

  if (update.outputDir) {
    if (!path.isAbsolute(next.outputDir)) {
      throw new HttpError('The designs folder must be an absolute path (e.g. /Users/you/Designs)', 400);
    }
    try {
      await mkdir(next.outputDir, { recursive: true });
      await access(next.outputDir, constants.W_OK);
    } catch {
      throw new HttpError(`Cannot create or write to "${next.outputDir}" — check the path and permissions`, 400);
    }
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

export function defaultOutputDir(): string {
  return DEFAULT_OUTPUT_DIR;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface StoredAsset {
  id: string;
  type: 'logo' | 'mockup' | 'social_post' | 'business_card' | 'social_template';
  prompt: string;
  originalPrompt: string | null;
  /** File path relative to the output dir, e.g. "moss-and-mist/logos/logo-concept-ab12.png" */
  file: string;
  createdAt: string;
}

export interface StoredVideo {
  id: string;
  prompt: string;
  file: string;
  hasSound: boolean;
  createdAt: string;
}

export interface StoredProject {
  id: string;
  name: string;
  industry: string;
  brief: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED';
  /** Folder name (relative to the output dir) that this project's files live in. */
  folder: string;
  brandIdentity: BrandIdentity | null;
  selectedLogoAssetId: string | null;
  assets: StoredAsset[];
  videos: StoredVideo[];
  createdAt: string;
  updatedAt: string;
}

function projectFile(id: string): string {
  // Project ids are UUIDs we generate ourselves; reject anything else so a
  // crafted id can never traverse out of the projects dir.
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError('Invalid project id', 400);
  return path.join(PROJECTS_DIR, `${id}.json`);
}

export async function listProjects(): Promise<StoredProject[]> {
  let files: string[];
  try {
    files = await readdir(PROJECTS_DIR);
  } catch {
    return [];
  }
  const projects: StoredProject[] = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      projects.push(JSON.parse(await readFile(path.join(PROJECTS_DIR, f), 'utf8')));
    } catch {
      // Skip corrupt records rather than breaking the whole list.
    }
  }
  return projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getProject(id: string): Promise<StoredProject> {
  try {
    return JSON.parse(await readFile(projectFile(id), 'utf8'));
  } catch {
    throw new HttpError('Project not found', 404);
  }
}

export async function createProject(name: string, industry: string): Promise<StoredProject> {
  const now = new Date().toISOString();
  const existing = await listProjects();
  let folder = slugify(name) || 'project';
  if (existing.some((p) => p.folder === folder)) folder = `${folder}-${randomSuffix()}`;

  const project: StoredProject = {
    id: randomUUID(),
    name,
    industry,
    brief: '',
    status: 'DRAFT',
    folder,
    brandIdentity: null,
    selectedLogoAssetId: null,
    assets: [],
    videos: [],
    createdAt: now,
    updatedAt: now,
  };
  await mkdir(PROJECTS_DIR, { recursive: true });
  await writeFile(projectFile(project.id), JSON.stringify(project, null, 2));
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  // Only removes the project record. Generated files stay in the user's
  // designs folder — they're the user's work, not ours to delete.
  await rm(projectFile(id), { force: true });
}

// One writer at a time per project: the wizard runs 3 generations
// concurrently and each appends to the same JSON record.
const locks = new Map<string, Promise<unknown>>();

export async function updateProject(
  id: string,
  mutate: (project: StoredProject) => void | Promise<void>,
): Promise<StoredProject> {
  const prev = locks.get(id) ?? Promise.resolve();
  const task = prev.catch(() => {}).then(async () => {
    const project = await getProject(id);
    await mutate(project);
    project.updatedAt = new Date().toISOString();
    await writeFile(projectFile(id), JSON.stringify(project, null, 2));
    return project;
  });
  locks.set(id, task);
  try {
    return await task;
  } finally {
    if (locks.get(id) === task) locks.delete(id);
  }
}
