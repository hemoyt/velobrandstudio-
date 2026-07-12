import type { BrandIdentity } from '@/types';

export interface GuidelinesAsset {
  type: 'logo' | 'mockup' | 'social_post' | 'business_card' | 'social_template';
  prompt: string;
  /** Any valid <img src> — a browser-relative URL or a data: URI. */
  url: string;
}

const ASSET_SECTION_LABELS: Record<GuidelinesAsset['type'], string> = {
  logo: 'Logo Variants',
  mockup: 'Mockups & Brand Essentials',
  business_card: 'Business Cards',
  social_template: 'Social Templates',
  social_post: 'Campaign Posts',
};

const ASSET_SECTION_ORDER: GuidelinesAsset['type'][] = [
  'logo',
  'business_card',
  'social_template',
  'social_post',
  'mockup',
];

function groupAssetsByType(assets: GuidelinesAsset[]): { type: GuidelinesAsset['type']; label: string; items: GuidelinesAsset[] }[] {
  return ASSET_SECTION_ORDER.map((type) => ({
    type,
    label: ASSET_SECTION_LABELS[type],
    items: assets.filter((a) => a.type === type),
  })).filter((group) => group.items.length > 0);
}

function assetGridHTML(items: GuidelinesAsset[]): string {
  return items
    .map(
      (asset) => `
        <div class="asset-card">
          <img src="${asset.url}" />
          <div class="asset-info">
            <div class="asset-prompt">${asset.prompt}</div>
          </div>
        </div>
      `,
    )
    .join('');
}

/**
 * Renders a full, self-contained brand guidelines HTML document: cover,
 * strategy, voice-in-practice, logo usage rules, color/type system, and the
 * generated asset library. Used both for the in-browser "print to PDF" flow
 * (lib/pdf-export.ts) and for the offline copy bundled into the ZIP export
 * (app/api/projects/[projectId]/export-zip), which passes base64 data URIs
 * for `asset.url` so the file works without the app running.
 */
export function renderBrandGuidelinesHTML(brandIdentity: BrandIdentity, assets: GuidelinesAsset[], opts: { autoPrint?: boolean } = {}): string {
  const primaryLogo = assets.find((a) => a.type === 'logo');
  const assetGroups = groupAssetsByType(assets);
  const palette = brandIdentity.colorPalette || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Brand Guidelines - ${brandIdentity.businessName || 'Brand'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .cover { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
          .cover .kicker { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin-bottom: 16px; }
          .cover h1 { font-size: 56px; margin: 0 0 20px; }
          .cover .desc { font-size: 18px; color: #666; max-width: 640px; }
          h1 { font-size: 36px; margin-bottom: 10px; border-bottom: 3px solid #000; padding-bottom: 20px; }
          .desc { font-size: 18px; color: #666; margin-bottom: 40px; }
          h2 { font-size: 24px; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; page-break-after: avoid; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
          .section { margin-bottom: 40px; page-break-inside: avoid; }
          .color-palette { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 10px; }
          .color-swatch { width: 100px; height: 100px; border-radius: 8px; border: 1px solid #eee; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; font-size: 11px; padding: 8px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          .color-swatch .role { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; margin-bottom: 2px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .asset-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
          .asset-card img { width: 100%; height: auto; display: block; }
          .asset-info { padding: 15px; background: #f9f9f9; }
          .asset-prompt { font-size: 14px; font-weight: 500; }
          .typography-sample { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 10px; }
          .font-heading { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .font-body { font-size: 16px; }
          .rule-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .rule-card { background: #f9f9f9; border-radius: 12px; padding: 20px; }
          .rule-card.do { border-left: 4px solid #16a34a; }
          .rule-card.dont { border-left: 4px solid #dc2626; }
          .rule-card ul { margin: 0; padding-left: 18px; font-size: 14px; }
          .rule-card li { margin-bottom: 8px; }
          .clearspace-note { background: #f9f9f9; border-radius: 12px; padding: 20px; font-size: 14px; }
          .usage-bar { display: flex; height: 28px; border-radius: 6px; overflow: hidden; margin-top: 10px; }
          @media print {
            body { padding: 0; }
            .asset-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="kicker">Brand Guidelines</div>
          <h1>${brandIdentity.businessName || 'Brand Identity'}</h1>
          <p class="desc">${brandIdentity.description || ''}</p>
        </div>

        <div class="section">
          <h2>Strategy Core</h2>
          <p><strong>Tagline:</strong> &quot;${brandIdentity.tagline || ''}&quot;</p>
          ${brandIdentity.mission ? `<p><strong>Mission:</strong> ${brandIdentity.mission}</p>` : ''}
          ${brandIdentity.values?.length ? `<p><strong>Values:</strong> ${brandIdentity.values.join(' · ')}</p>` : ''}
          ${brandIdentity.personality?.length ? `<p><strong>Personality:</strong> ${brandIdentity.personality.join(', ')}</p>` : ''}
          <p><strong>Brand Voice:</strong> ${brandIdentity.brandVoice || ''}</p>
          <p><strong>Target Audience:</strong> ${brandIdentity.targetAudience || ''}</p>
          ${brandIdentity.elevatorPitch ? `<p><strong>Elevator Pitch:</strong> ${brandIdentity.elevatorPitch}</p>` : ''}
        </div>

        ${
          brandIdentity.socialBios || brandIdentity.sampleCaptions?.length || brandIdentity.imageryStyle
            ? `<div class="section">
                <h2>Voice in Practice</h2>
                ${
                  brandIdentity.socialBios
                    ? `<h3>Social Bios</h3>
                       ${brandIdentity.socialBios.instagram ? `<p><strong>Instagram:</strong> ${brandIdentity.socialBios.instagram}</p>` : ''}
                       ${brandIdentity.socialBios.twitter ? `<p><strong>Twitter/X:</strong> ${brandIdentity.socialBios.twitter}</p>` : ''}
                       ${brandIdentity.socialBios.linkedin ? `<p><strong>LinkedIn:</strong> ${brandIdentity.socialBios.linkedin}</p>` : ''}`
                    : ''
                }
                ${
                  brandIdentity.sampleCaptions?.length
                    ? `<h3>Sample Captions</h3><ul>${brandIdentity.sampleCaptions.map((c) => `<li>${c}</li>`).join('')}</ul>`
                    : ''
                }
                ${brandIdentity.imageryStyle ? `<h3>Imagery Direction</h3><p>${brandIdentity.imageryStyle}</p>` : ''}
              </div>`
            : ''
        }

        <div class="section">
          <h2>Logo Usage</h2>
          ${
            primaryLogo
              ? `<div class="grid"><div class="asset-card"><img src="${primaryLogo.url}" /></div>
                 <div class="clearspace-note">
                   <h3>Clear space &amp; minimum size</h3>
                   <p>Keep clear space around the logo equal to at least the height of its mark on every side — no text, imagery, or edges should intrude. Avoid scaling the logo below 24px / 0.5in in digital or print use; below that, legibility of fine detail breaks down.</p>
                 </div></div>`
              : '<p>Generate and select a logo to populate this section.</p>'
          }
          <div class="rule-grid" style="margin-top: 20px;">
            <div class="rule-card do">
              <h3>Do</h3>
              <ul>
                <li>Use the approved logo files at full resolution</li>
                <li>Maintain the required clear space</li>
                <li>Use on approved background colors for contrast</li>
              </ul>
            </div>
            <div class="rule-card dont">
              <h3>Don&rsquo;t</h3>
              <ul>
                <li>Stretch, distort, or rotate the logo</li>
                <li>Recolor outside the brand palette</li>
                <li>Add drop shadows, outlines, or effects</li>
                <li>Place on low-contrast or busy backgrounds</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Visual System</h2>

          <h3>Color Palette</h3>
          <div class="color-palette">
            ${palette
              .map(
                (c, i) =>
                  `<div class="color-swatch" style="background-color: ${c}"><span class="role">${
                    i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'
                  }</span>${c}</div>`,
              )
              .join('')}
          </div>
          ${
            palette.length > 0
              ? `<div class="usage-bar">${palette
                  .map((c, i) => `<div style="flex: ${i === 0 ? 3 : i === 1 ? 2 : 1}; background: ${c};"></div>`)
                  .join('')}</div>
                 <p style="font-size: 12px; color: #999; margin-top: 6px;">Suggested usage weight, left to right — lead with the primary color, use secondary/accent tones for emphasis and calls to action.</p>`
              : ''
          }

          <h3>Typography</h3>
          <div class="typography-sample">
            <div class="font-heading" style="font-family: sans-serif">${brandIdentity.typography?.heading || 'Heading Font'}</div>
            <div class="font-body" style="font-family: serif">${brandIdentity.typography?.body || 'Body Font'}</div>
          </div>
          <p><strong>Heading:</strong> ${brandIdentity.typography?.heading || ''}</p>
          <p><strong>Body:</strong> ${brandIdentity.typography?.body || ''}</p>
        </div>

        ${assetGroups
          .map(
            (group) => `
          <div class="section">
            <h2>${group.label}</h2>
            <div class="grid">
              ${assetGridHTML(group.items)}
            </div>
          </div>
        `,
          )
          .join('')}

        ${opts.autoPrint ? '<script>setTimeout(() => { window.print(); }, 1000);</script>' : ''}
      </body>
    </html>
  `;
}
