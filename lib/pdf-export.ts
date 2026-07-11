import type { BrandIdentity, GeneratedImage } from '@/types';

export function exportBrandKitPDF(brandIdentity: BrandIdentity, assets: GeneratedImage[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Brand Kit - ${brandIdentity.businessName || 'Brand'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          h1 { font-size: 36px; margin-bottom: 10px; border-bottom: 3px solid #000; padding-bottom: 20px; }
          .desc { font-size: 18px; color: #666; margin-bottom: 40px; }
          h2 { font-size: 24px; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
          .section { margin-bottom: 40px; }
          .color-palette { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 10px; }
          .color-swatch { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #eee; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; padding-bottom: 5px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .asset-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
          .asset-card img { width: 100%; height: auto; display: block; }
          .asset-info { padding: 15px; background: #f9f9f9; }
          .asset-type { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: bold; }
          .asset-prompt { font-size: 14px; font-weight: 500; margin-top: 5px; }
          .typography-sample { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 10px; }
          .font-heading { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .font-body { font-size: 16px; }
          @media print {
            body { padding: 0; }
            .asset-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${brandIdentity.businessName || 'Brand Identity'}</h1>
        <p class="desc">${brandIdentity.description || ''}</p>

        <div class="section">
          <h2>Strategy Core</h2>
          <p><strong>Tagline:</strong> ${brandIdentity.tagline}</p>
          <p><strong>Brand Voice:</strong> ${brandIdentity.brandVoice}</p>
          <p><strong>Target Audience:</strong> ${brandIdentity.targetAudience}</p>
        </div>

        <div class="section">
          <h2>Visual System</h2>

          <h3>Color Palette</h3>
          <div class="color-palette">
            ${brandIdentity.colorPalette?.map((c) => `<div class="color-swatch" style="background-color: ${c}">${c}</div>`).join('') || ''}
          </div>

          <h3>Typography</h3>
          <div class="typography-sample">
            <div class="font-heading" style="font-family: sans-serif">${brandIdentity.typography?.heading || 'Heading Font'}</div>
            <div class="font-body" style="font-family: serif">${brandIdentity.typography?.body || 'Body Font'}</div>
          </div>
          <p><strong>Heading:</strong> ${brandIdentity.typography?.heading}</p>
          <p><strong>Body:</strong> ${brandIdentity.typography?.body}</p>
        </div>

        <div class="section">
          <h2>Generated Assets</h2>
          <div class="grid">
            ${assets
              .map(
                (asset) => `
              <div class="asset-card">
                <img src="${asset.url}" />
                <div class="asset-info">
                  <div class="asset-type">${asset.type}</div>
                  <div class="asset-prompt">${asset.prompt}</div>
                </div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
        <script>
            setTimeout(() => { window.print(); }, 1000);
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
