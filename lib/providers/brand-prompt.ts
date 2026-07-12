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

Ground every field in the actual business described. No placeholders, no generic filler.`;
}
