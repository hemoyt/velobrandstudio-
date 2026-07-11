import dns from 'dns/promises';
import net from 'net';

const MAX_BYTES = 500_000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_TEXT_CHARS = 6000;

/**
 * Basic SSRF guard: resolves the hostname up front and rejects anything in a
 * private/loopback/link-local range before fetching. This blocks the obvious
 * cases (localhost, 169.254.169.254 cloud metadata, internal hostnames) but
 * `fetch()` re-resolves DNS on its own, so a DNS-rebinding attack could still
 * slip a request past this check — see README "Known limitations". Callers
 * must already require editor+ team access before reaching this.
 */
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  return lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd');
}

export async function fetchWebsiteText(rawUrl: string): Promise<{ title: string; text: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('That does not look like a valid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https URLs are supported');
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new Error('Could not resolve that hostname');
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error('That URL points to a private/internal address and cannot be imported');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'VeloBrandStudio-Import/1.0' },
    });
    if (!res.ok) throw new Error(`The site returned an error (HTTP ${res.status})`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('That URL did not return an HTML page');
    }

    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_BYTES) break;
        chunks.push(value);
      }
    }

    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
    return extractText(html);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Timed out fetching that URL');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';

  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const text = decodeEntities(withoutNoise.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  return { title, text };
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
