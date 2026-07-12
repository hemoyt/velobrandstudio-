import type { BrandIdentity } from '@/types';

// Shared instruction for brand-identity generation so OpenAI and Gemini
// produce the same shape and quality of output.
export function brandIdentityInstruction(description: string): string {
  return `You are a senior brand strategist. Create a complete brand identity for this business:

"${description}"

Return a JSON object with exactly these fields:
- businessName: the business name (extract it from the description, or coin a fitting one)
- description: a polished 1-2 sentence positioning statement
- mission: a single-sentence brand mission
- values: 3-5 short core values (1-3 words each)
- personality: 3-4 personality adjectives (e.g. "warm", "precise")
- tagline: a memorable tagline under 8 words
- brandVoice: 1-2 sentences describing tone of voice with concrete guidance
- targetAudience: 1-2 sentences describing the primary audience
- colorPalette: 4-5 hex colors ordered primary → secondary → accents, chosen to fit the brand and work together
- typography: { "heading": a Google Font name for headings, "body": a Google Font name for body text } — a pairing that fits the brand
- elevatorPitch: a 1-2 sentence pitch you could say out loud in an elevator
- imageryStyle: 1-2 sentences describing photography/imagery direction (lighting, mood, composition)
- socialBios: { "instagram": string under 150 characters, "twitter": string under 160 characters, "linkedin": string under 220 characters } — ready-to-paste bios in the brand voice
- sampleCaptions: 2-3 example social captions written in the brand voice

Ground every field in the actual business described. No placeholders, no generic filler.`;
}

export type RegenerableField =
  | 'businessName'
  | 'description'
  | 'mission'
  | 'tagline'
  | 'brandVoice'
  | 'targetAudience'
  | 'elevatorPitch'
  | 'imageryStyle'
  | 'values'
  | 'personality'
  | 'sampleCaptions'
  | 'colorPalette'
  | 'typography'
  | 'socialBios';

export const REGENERABLE_FIELDS: RegenerableField[] = [
  'businessName',
  'description',
  'mission',
  'tagline',
  'brandVoice',
  'targetAudience',
  'elevatorPitch',
  'imageryStyle',
  'values',
  'personality',
  'sampleCaptions',
  'colorPalette',
  'typography',
  'socialBios',
];

const FIELD_GUIDANCE: Record<RegenerableField, string> = {
  businessName: 'A fitting business name. A JSON string.',
  description: 'A polished 1-2 sentence positioning statement. A JSON string.',
  mission: 'A single-sentence brand mission. A JSON string.',
  tagline: 'A memorable tagline under 8 words. A JSON string.',
  brandVoice: '1-2 sentences describing tone of voice with concrete guidance. A JSON string.',
  targetAudience: '1-2 sentences describing the primary audience. A JSON string.',
  elevatorPitch: 'A 1-2 sentence pitch you could say out loud in an elevator. A JSON string.',
  imageryStyle: '1-2 sentences describing photography/imagery direction: lighting, mood, composition. A JSON string.',
  values: '3-5 short core values (1-3 words each). A JSON array of strings.',
  personality: '3-4 personality adjectives. A JSON array of strings.',
  sampleCaptions: '2-3 example social captions written in the brand voice. A JSON array of strings.',
  colorPalette: '4-5 hex colors ordered primary → secondary → accents that work together and fit the brand. A JSON array of hex color strings like "#4A403A".',
  typography: 'A Google Font pairing. A JSON object: { "heading": string, "body": string } — both real Google Fonts names.',
  socialBios:
    'Ready-to-paste bios. A JSON object: { "instagram": string under 150 characters, "twitter": string under 160 characters, "linkedin": string under 220 characters }.',
};

/**
 * Prompt for regenerating a single field of an already-generated identity,
 * keeping it consistent with everything else. All providers are asked to
 * return `{ "value": <field value> }` regardless of the field's shape
 * (string / string[] / object) so the caller can parse uniformly.
 */
export function regenerateFieldInstruction(
  field: RegenerableField,
  description: string,
  identity: BrandIdentity,
): string {
  return `You are a senior brand strategist refining one part of an existing brand identity.

Business: "${description}"

Current brand identity (for context and consistency — keep the new value coherent with the rest):
${JSON.stringify(identity, null, 2)}

Generate a fresh alternative for ONLY the "${field}" field. ${FIELD_GUIDANCE[field]}
Make it meaningfully different from the current value, not a minor rewording.

Return a JSON object of exactly this shape: { "value": <the new ${field} value> }. No other keys, no commentary, no markdown.`;
}
