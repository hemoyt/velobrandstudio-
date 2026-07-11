export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function randomSuffix(length = 4): string {
  return Math.random().toString(36).slice(2, 2 + length);
}
