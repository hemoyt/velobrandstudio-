import type { BrandIdentity } from '@/types';
import type { Database } from '@/lib/supabase/database.types';

type BrandIdentityRow = Database['public']['Tables']['brand_identities']['Row'];

export function mapBrandIdentityRow(row: BrandIdentityRow): BrandIdentity {
  return {
    businessName: row.business_name ?? '',
    description: row.description ?? '',
    colorPalette: row.color_palette ?? [],
    typography: { heading: row.typography?.heading ?? '', body: row.typography?.body ?? '' },
    brandVoice: row.brand_voice ?? '',
    tagline: row.tagline ?? '',
    targetAudience: row.target_audience ?? '',
  };
}
