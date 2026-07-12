export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  originalPrompt?: string;
  type: 'logo' | 'mockup' | 'social_post' | 'business_card' | 'social_template';
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  thumbnailUrl?: string;
  hasSound?: boolean;
}

export interface BrandIdentity {
  businessName: string;
  description: string;
  colorPalette: string[];
  typography: {
    heading: string;
    body: string;
  };
  brandVoice: string;
  tagline: string;
  targetAudience: string;
  /** One-sentence brand mission. Optional: older saved projects predate it. */
  mission?: string;
  /** 3-5 core brand values. */
  values?: string[];
  /** 3-4 personality adjectives (e.g. "warm", "precise"). */
  personality?: string[];
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  TWITTER = 'Twitter (X)',
  FACEBOOK = 'Facebook',
  LINKEDIN = 'LinkedIn',
  STORY = 'IG/TikTok Story',
}

export enum IndustryType {
  GENERAL = 'General / Corporate',
  TECH = 'Tech / Startup',
  FASHION = 'Fashion / Apparel',
  RETAIL = 'Retail / Product',
  HOSPITALITY = 'Restaurant / Bar',
  COFFEE = 'Coffee Shop',
}

export enum LogoStyle {
  MINIMALIST = 'Minimalist',
  VINTAGE = 'Vintage / Retro',
  LUXURY = 'Luxury / Elegant',
  ABSTRACT = 'Abstract / Geometric',
  MASCOT = 'Mascot / Character',
  HAND_DRAWN = 'Hand-Drawn / Organic',
  CYBERPUNK = 'Cyberpunk / Futuristic',
  THREE_D = '3D / Glossy',
}

export interface SearchResult {
  title: string;
  url: string;
}
