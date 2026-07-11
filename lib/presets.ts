import { IndustryType, LogoStyle } from '@/types';

// Mapping user-friendly styles to technical prompt keywords.
export const STYLE_DEFINITIONS: Record<LogoStyle, string> = {
  [LogoStyle.MINIMALIST]: 'minimalist, flat vector, swiss design, geometric, sans-serif, high contrast, reductionist, svg style, less is more',
  [LogoStyle.VINTAGE]: 'vintage, retro, badge style, textured, serif typography, 1950s aesthetic, distressed, stamp effect, linocut',
  [LogoStyle.LUXURY]: 'luxury, elegant, sophisticated, serif, thin line weight, monogram, heraldic, high-end fashion, gold foil aesthetic',
  [LogoStyle.ABSTRACT]: 'abstract, conceptual, geometric shapes, fluid forms, modern art, negative space, tech, mathematical',
  [LogoStyle.MASCOT]: 'mascot character, vector illustration, bold outlines, friendly, vibrant, e-sports style, character design',
  [LogoStyle.HAND_DRAWN]: 'hand-drawn, organic, sketch, ink lines, imperfect, artistic, watercolor texture, raw, doodle style',
  [LogoStyle.CYBERPUNK]: 'cyberpunk, neon, futuristic, glitch, high tech, dark background, glowing, sci-fi, matrix',
  [LogoStyle.THREE_D]: '3D render, glossy, volumetric lighting, isometric, depth, plastic material, blender, cinema4d',
};

export interface MockupPreset {
  id: string;
  label: string;
  prompt: string;
  ratio: string;
}

// Expanded mockup presets, one set per industry.
export const MOCKUP_PRESETS: Record<IndustryType, MockupPreset[]> = {
  [IndustryType.GENERAL]: [
    { id: 'stationery', label: 'Stationery Set', prompt: 'High-end branding stationery set including business cards, letterhead, and envelope arranged on a marble desk, soft natural lighting.', ratio: '3:4' },
    { id: 'signage', label: '3D Glass Sign', prompt: 'Modern 3D glass office signage mounted on a textured concrete wall, cinematic depth of field.', ratio: '16:9' },
    { id: 'merch', label: 'Cotton T-Shirt', prompt: 'Minimalist premium cotton t-shirt mockup on a wooden hanger, studio lighting.', ratio: '3:4' },
    { id: 'idcard', label: 'ID Lanyard', prompt: 'Corporate ID card and lanyard mockup resting on a clean office desk.', ratio: '1:1' },
    { id: 'notebook', label: 'Leather Notebook', prompt: 'Embossed logo on a premium leather notebook, focused close-up shot.', ratio: '3:4' },
    { id: 'wall', label: 'Reception Wall', prompt: 'Large brushed metal logo mounted on a clean white reception wall in a modern office lobby.', ratio: '16:9' },
  ],
  [IndustryType.TECH]: [
    { id: 'laptop', label: 'Laptop Sticker', prompt: 'MacBook Pro on a modern developer desk with the logo applied as a premium vinyl sticker, coding environment background.', ratio: '16:9' },
    { id: 'app', label: 'Mobile App Splash', prompt: 'Modern bezel-less smartphone held in hand displaying the logo on a sleek app splash screen, UI/UX context.', ratio: '9:16' },
    { id: 'hoodie', label: 'Startup Hoodie', prompt: 'Tech developer wearing a black startup hoodie with the logo printed on the chest, modern office background.', ratio: '3:4' },
    { id: 'smartwatch', label: 'Smart Watch', prompt: 'Smart watch displaying the logo on the screen, on a wrist, shallow depth of field.', ratio: '1:1' },
    { id: 'monitor', label: 'Desktop Monitor', prompt: 'Ultrawide desktop monitor displaying the logo on a dark mode dashboard, rgb lighting background.', ratio: '16:9' },
    { id: 'server', label: 'Server Rack', prompt: 'Logo sticker on a high-tech server rack in a datacenter, blue neon lighting.', ratio: '3:4' },
  ],
  [IndustryType.FASHION]: [
    { id: 'tag', label: 'Clothing Tag', prompt: 'Macro shot of a premium clothing hang tag with embossed logo resting on textured fabric.', ratio: '1:1' },
    { id: 'tote', label: 'Canvas Tote', prompt: '[TARGET_AUDIENCE] walking down a city street carrying a canvas tote bag featuring the logo.', ratio: '3:4' },
    { id: 'storefront', label: 'Store Front', prompt: 'Luxury fashion boutique storefront with the logo decal on the glass window, evening lighting.', ratio: '4:3' },
    { id: 'cap', label: 'Embroidered Cap', prompt: 'Baseball cap with 3D embroidered logo sitting on a shelf.', ratio: '1:1' },
    { id: 'shoebox', label: 'Shoe Box', prompt: 'Premium minimalist shoe box packaging design.', ratio: '3:4' },
    { id: 'lookbook', label: 'Lookbook Cover', prompt: 'Fashion lookbook magazine cover featuring the logo overlay.', ratio: '3:4' },
  ],
  [IndustryType.RETAIL]: [
    { id: 'packaging', label: 'Product Packaging', prompt: 'Minimalist sustainable cardboard product packaging box on a podium, studio product photography.', ratio: '1:1' },
    { id: 'bag', label: 'Shopping Bag', prompt: 'Premium paper shopping bag with rope handles held by a customer, blurred retail background.', ratio: '3:4' },
    { id: 'shelf', label: 'Retail Shelf', prompt: 'Products displayed neatly on a wooden retail shelf, soft focus background.', ratio: '16:9' },
    { id: 'van', label: 'Delivery Van', prompt: 'Delivery van with large branding wrap driving on a city street.', ratio: '16:9' },
    { id: 'window', label: 'Window Decal', prompt: 'Vinyl window decal on a shop window, reflection of the street.', ratio: '4:3' },
    { id: 'receipt', label: 'Digital Receipt', prompt: 'Close up of a printed receipt with the logo at the top.', ratio: '3:4' },
  ],
  [IndustryType.HOSPITALITY]: [
    { id: 'menu', label: 'Menu Design', prompt: 'Elegant textured paper menu on a fine dining restaurant table, accompanied by silverware and a wine glass.', ratio: '3:4' },
    { id: 'coaster', label: 'Drink Coaster', prompt: 'Top-down view of a drink coaster under a cocktail glass, bar counter texture.', ratio: '1:1' },
    { id: 'apron', label: 'Staff Apron', prompt: 'Barista or chef wearing a canvas apron with the embroidered logo, busy kitchen depth of field.', ratio: '3:4' },
    { id: 'matchbook', label: 'Matchbook', prompt: 'Vintage style matchbook with logo on a bar counter.', ratio: '16:9' },
    { id: 'napkin', label: 'Cloth Napkin', prompt: 'Embroidered logo on a linen napkin, fine dining setting.', ratio: '1:1' },
    { id: 'neon', label: 'Neon Sign', prompt: 'Bright neon sign of the logo on a brick wall, night ambiance.', ratio: '16:9' },
  ],
  [IndustryType.COFFEE]: [
    { id: 'cup', label: 'Coffee Cup', prompt: 'Paper coffee cup with sleeve held in hand against a blurred city street background, steam rising, warm morning light.', ratio: '3:4' },
    { id: 'beanbag', label: 'Coffee Bag', prompt: 'Kraft paper coffee bean bag packaging standing on a wooden counter next to coffee beans.', ratio: '3:4' },
    { id: 'sign', label: 'Shop Sign', prompt: 'Round wooden hanging shop sign outside a cozy cafe, ivy on brick wall background.', ratio: '1:1' },
    { id: 'mug', label: 'Ceramic Mug', prompt: 'Ceramic mug with logo on a wooden table, cozy atmosphere.', ratio: '1:1' },
    { id: 'machine', label: 'Espresso Machine', prompt: 'Espresso machine with logo decal, barista background.', ratio: '16:9' },
    { id: 'sleeve', label: 'Cup Sleeve', prompt: 'Close up of cardboard cup sleeve with stamped logo.', ratio: '1:1' },
  ],
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

/** Runs promises with a concurrency cap, invoking onResult as each settles. */
export async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onResult: (result: T) => void,
): Promise<void> {
  const queue = [...tasks];

  const worker = async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        try {
          onResult(await task());
        } catch (e) {
          console.error('Generation task failed', e);
        }
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
}
