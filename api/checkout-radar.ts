import { timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLATFORM_RULES = [
  { name: 'Cakto', hosts: ['cakto.com.br'] },
  { name: 'Hotmart', hosts: ['hotmart.com'] },
  { name: 'Kiwify', hosts: ['kiwify.com.br', 'kiwify.app'] },
  { name: 'Eduzz', hosts: ['eduzz.com'] },
  { name: 'Ticto', hosts: ['ticto.com.br'] },
  { name: 'Greenn', hosts: ['greenn.com.br'] },
  { name: 'PerfectPay', hosts: ['perfectpay.com.br'] },
  { name: 'Monetizze', hosts: ['monetizze.com.br'] },
  { name: 'Kirvano', hosts: ['kirvano.com'] },
  { name: 'Yampi', hosts: ['yampi.com.br'] },
  { name: 'Appmax', hosts: ['appmax.com.br'] },
  { name: 'Braip', hosts: ['braip.com'] }
];

function authorized(req: VercelRequest, expected: string): boolean {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const encoder = new TextEncoder();
  const a = encoder.encode(supplied);
  const b = encoder.encode(expected);
  return Boolean(supplied) && a.length === b.length && timingSafeEqual(a, b);
}

function isPrivateIp(address: string): boolean {
  if (isIP(address) === 4) {
    const p = address.split('.').map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      p[0] >= 224;
  }
  if (isIP(address) === 6) {
    const ip = address.toLowerCase();
    return ip === '::' || ip === '::1' || ip.startsWith('fc') ||
      ip.startsWith('fd') || ip.startsWith('fe8') ||
      ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb') ||
      ip.startsWith('::ffff:');
  }
  return true;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Endereço local não permitido.');
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Endereço IP privado não permitido.');
    return;
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(record => isPrivateIp(record.address))) {
    throw new Error('O domínio não aponta exclusivamente para endereços públicos.');
  }
}

function classify(urlValue: string) {
  const url = new URL(urlValue);
  const host = url.hostname.toLowerCase();
  const match = PLATFORM_RULES.find(rule => rule.hosts.some(base => host === base || host.endsWith('.' + base)));
  if (match) return { platform: match.name, kind: 'plataforma', confidence: 'alta' };
  if (/(checkout|check-out|finalizar|finalizar-compra|\/pay(?:\/|$)|\/payment(?:\/|$)|\/order(?:\/|$)|\/cart(?:\/|$))/i.test(url.pathname)) {
    return { platform: 'Checkout próprio / não identificado', kind: 'checkout_proprio', confidence: 'média' };
  }
  return null;
}

function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function pageTitle(html: string): string {
  const og = html.match(/<meta[^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:title|twitter:title)["']/i);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities((og?.[1] || title?.[1] || '').replace(/<[^>]+>/g, '').trim()).slice(0, 240);
}

function pagePrice(html: string): string | null {
  const text = decodeEntities(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  const match = text.match(/R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/i) ||
    text.match(/R\$\s?\d+(?:,\d{2})?/i);
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('A página ultrapassou o limite de leitura de 1,2 MB.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks));
}

async function fetchPublicPage(startUrl: string) {
  let current = startUrl;
  for (let attempt = 0; attempt <= 4; attempt++) {
    const url = new URL(current);
    await assertPublicHost(url.hostname);
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'WL-AD-SPY-LAB-Link-Inspector/1.0 (+manual user-submitted URL)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2'
      },
      signal: AbortSignal.timeout(10000)
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('A página redirecionou sem informar o destino.');
      if (attempt === 4) throw new Error('A página excedeu o limite de redirecionamentos.');
      current = new URL(location, url).toString();
      continue;
    }
    const type = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error('A página respondeu HTTP ' + response.status + '.');
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      throw new Error('O endereço não retornou uma página HTML pública.');
    }
    const html = await readLimited(response, 1_200_000);
    return { html, finalUrl: response.url || current, status: response.status };
  }
  throw new Error('Não foi possível abrir o endereço informado.');
}

function extractCheckoutLinks(html: string, pageUrl: string) {
  const found = new Map<string, { url: string; platform: string; kind: string; confidence: string }>();
  const pattern = /<(?:a|form)\b[^>]*(?:href|action)\s*=\s*(["'])(.*?)\1[^>]*>/gis;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && found.size < 40) {
    const raw = decodeEntities(match[2].trim());
    if (!raw || /^(?:#|javascript:|mailto:|tel:|data:)/i.test(raw)) continue;
    try {
      const url = new URL(raw, pageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const classified = classify(url.toString());
      if (!classified) continue;
      found.set(url.toString(), {
        url: url.toString(),
        platform: classified.platform,
        kind: classified.kind,
        confidence: classified.confidence
      });
    } catch { /* ignora links inválidos */ }
  }
  return [...found.values()].slice(0, 20);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const expectedToken = process.env.AD_SPY_ACCESS_TOKEN;
  if (!expectedToken) return res.status(503).json({ error: 'Backend não configurado: falta AD_SPY_ACCESS_TOKEN.' });
  if (!authorized(req, expectedToken)) return res.status(401).json({ error: 'Token de acesso inválido.' });

  const rawUrl = String((req.body as { url?: unknown } | undefined)?.url || '').trim();
  if (!rawUrl || rawUrl.length > 2048) return res.status(400).json({ error: 'Informe uma URL pública válida.' });
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
  } catch {
    return res.status(400).json({ error: 'URL inválida. Use um endereço público iniciado por https:// ou http://.' });
  }

  try {
    const page = await fetchPublicPage(parsed.toString());
    const title = pageTitle(page.html);
    const price = pagePrice(page.html);
    const checkoutLinks = extractCheckoutLinks(page.html, page.finalUrl);
    const ownCheckout = classify(page.finalUrl);
    if (ownCheckout && !checkoutLinks.some(item => item.url === page.finalUrl)) {
      checkoutLinks.unshift({ url: page.finalUrl, platform: ownCheckout.platform, kind: ownCheckout.kind, confidence: ownCheckout.confidence });
    }
    return res.status(200).json({
      provider: 'WL AD SPY LAB · Radar de Checkout',
      sourceUrl: parsed.toString(),
      finalUrl: page.finalUrl,
      pageTitle: title || null,
      detectedPrice: price,
      checkoutDetected: checkoutLinks.length > 0,
      checkouts: checkoutLinks,
      checkedAt: new Date().toISOString(),
      limitations: [
        'A leitura é feita somente na URL enviada manualmente pelo usuário.',
        'Links montados por JavaScript, áreas autenticadas e conteúdo bloqueado podem não aparecer.',
        'A presença de um checkout não comprova vendas, faturamento ou volume de compradores.'
      ]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao inspecionar a página.';
    return res.status(422).json({ error: message });
  }
}
