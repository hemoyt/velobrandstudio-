import type { BrandIdentity, GeneratedImage } from '@/types';
import { renderBrandGuidelinesHTML } from './brand-guidelines-html';

/**
 * Renders a full brand guidelines document (cover, strategy, logo usage
 * rules, color/type system, and the generated asset library) into a print
 * window so users can save it as a PDF via the browser's print dialog.
 */
export function exportBrandKitPDF(brandIdentity: BrandIdentity, assets: GeneratedImage[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the brand guidelines');
    return;
  }

  const htmlContent = renderBrandGuidelinesHTML(brandIdentity, assets, { autoPrint: true });

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
