import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getSignedUrls } from '@/lib/storage';
import { mapBrandIdentityRow } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export default async function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('id, client_name')
    .eq('share_token', token)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: brandRow }, { data: assets }] = await Promise.all([
    admin.from('brand_identities').select('*').eq('project_id', project.id).maybeSingle(),
    admin.from('assets').select('*').eq('project_id', project.id).order('created_at', { ascending: true }),
  ]);

  const signedUrls = await getSignedUrls(
    admin as any,
    (assets ?? []).map((a) => a.storage_path),
  );
  const brand = brandRow ? mapBrandIdentityRow(brandRow) : null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Shared brand kit</p>
        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-10">{project.client_name}</h1>

        {brand && (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mb-10">
            <p className="text-2xl font-serif italic text-stone-800 mb-6">&quot;{brand.tagline}&quot;</p>
            <div className="flex flex-wrap gap-3">
              {brand.colorPalette.map((color, i) => (
                <div key={i} className="w-10 h-10 rounded-full border border-stone-100 shadow-sm" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(assets ?? []).map((asset) => (
            <div key={asset.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signedUrls[asset.storage_path]} alt={asset.prompt ?? ''} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-xs font-bold text-stone-700 truncate">{asset.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
