'use client';

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} ${url} failed (${res.status})`);
  return data as T;
}

export const createProject = (teamId: string, clientName: string, industry: string) =>
  request<{ project: { id: string } }>(`/api/teams/${teamId}/projects`, 'POST', { clientName, industry });

export const updateProject = (
  projectId: string,
  update: Partial<{
    clientName: string;
    industry: string;
    brief: string;
    status: string;
    selectedLogoAssetId: string | null;
  }>,
) => request<{ project: unknown }>(`/api/projects/${projectId}`, 'PATCH', update);

export const deleteProject = (projectId: string) => request<{ ok: true }>(`/api/projects/${projectId}`, 'DELETE');

export const enableShareLink = (projectId: string) =>
  request<{ shareUrl: string }>(`/api/projects/${projectId}/share`, 'POST');

export const disableShareLink = (projectId: string) => request<{ ok: true }>(`/api/projects/${projectId}/share`, 'DELETE');
