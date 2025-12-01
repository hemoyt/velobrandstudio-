

export enum AppState {
  AGENCY_HUB = 'AGENCY_HUB',
  INPUT = 'INPUT',
  LOGO_GENERATION = 'LOGO_GENERATION',
  LOGO_SELECTION = 'LOGO_SELECTION',
  BRAND_GENERATION = 'BRAND_GENERATION',
  DASHBOARD = 'DASHBOARD',
  VIDEO_STUDIO = 'VIDEO_STUDIO'
}

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
  targetAudience: string; // Added for better context awareness
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export enum SocialPlatform {
  INSTAGRAM = 'Instagram',
  TWITTER = 'Twitter (X)',
  FACEBOOK = 'Facebook',
  LINKEDIN = 'LinkedIn',
  STORY = 'IG/TikTok Story'
}

export enum IndustryType {
  GENERAL = 'General / Corporate',
  TECH = 'Tech / Startup',
  FASHION = 'Fashion / Apparel',
  RETAIL = 'Retail / Product',
  HOSPITALITY = 'Restaurant / Bar',
  COFFEE = 'Coffee Shop'
}

export enum LogoStyle {
  MINIMALIST = 'Minimalist',
  VINTAGE = 'Vintage / Retro',
  LUXURY = 'Luxury / Elegant',
  ABSTRACT = 'Abstract / Geometric',
  MASCOT = 'Mascot / Character',
  HAND_DRAWN = 'Hand-Drawn / Organic',
  CYBERPUNK = 'Cyberpunk / Futuristic',
  THREE_D = '3D / Glossy'
}

export enum ProjectStatus {
  DRAFT = 'Draft',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  ARCHIVED = 'Archived'
}

export interface AgencyProject {
  id: string;
  clientName: string;
  industry: IndustryType;
  status: ProjectStatus;
  lastModified: Date;
  thumbnailUrl?: string;
  data?: {
    brandIdentity: BrandIdentity;
    selectedLogo: GeneratedImage;
    assets: GeneratedImage[];
    socialPlatform: SocialPlatform;
    videos?: GeneratedVideo[];
  }
}

export interface SearchResult {
  title: string;
  url: string;
}