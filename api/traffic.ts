import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function authorized(req: VercelRequest, expected: string): boolean {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\\s+/i, '');
  const encoder = new TextEncoder();
  const a = encoder.encode(supplied);
  const b = encoder.encode(expected);
  return Boolean(supplied) && a.length === b.length && timingSafeEqual(a, b);
}

function normalizeDomain(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw.length > 253 || /[\\s/@?#]/.test(raw)) throw new Error('Informe somente o domínio, por exemplo: exemplo.com.br.');
  const host = raw.replace(/^https?:\\/\\//, '').replace(/^www\\./, '').replace(/\\.$/, '');
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$/.test(host)) {
    throw new Error('Domínio inválido. Não inclua caminho, parâmetros ou protocolo.');
  }
  return host;
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const expectedToken = process.env.AD_SPY_ACCESS_TOKEN;
  if (!expectedToken) return res.status(503).json({ error: 'Backend não configurado: falta AD_SPY_ACCESS_TOKEN na Vercel.' });
  if (!authorized(req, expectedToken)) return res.status(401).json({ error: 'Token de acesso inválido.' });

  const apiKey = process.env.SIMILARWEB_API_KEY;
  if (!apiKey) return res.status(503).json({
    error: 'A integração de tráfego está pronta, mas falta SIMILARWEB_API_KEY. Gere uma chave ativa em uma conta Similarweb com acesso à API e cadastre-a nas variáveis de ambiente da Vercel.'
  });

  let domain: string;
  try { domain = normalizeDomain((req.body as { domain?: unknown } | undefined)?.domain); }
  catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Domínio inválido.' }); }

  // Usa os seis meses completos mais recentes para evitar comparar um mês parcial.
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 5, 1));
  const params = new URLSearchParams({
    domain,
    metrics: 'visits,unique_visitors,page_views,bounce_rate,pages_per_visit,average_visit_duration',
    granularity: 'monthly',
    start_date: dateString(start),
    end_date: dateString(end),
    web_source: 'total',
    country: 'br',
    format: 'json'
  });

  try {
    const response = await fetch('https://api.similarweb.com/v5/website-analysis/websites/traffic-and-engagement?' + params, {
      method: 'GET',
      headers: { 'api-key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(18000)
    });
    const payload = await response.json().catch(() => ({})) as {
      meta?: Record<string, unknown>;
      data?: Array<Record<string, unknown>>;
      error?: string;
    };
    if (!response.ok) {
      const message = response.status === 401
        ? 'A chave Similarweb é inválida ou está desativada.'
        : response.status === 403 || response.status === 402
          ? 'A conta Similarweb não liberou este endpoint ou não possui créditos disponíveis.'
          : response.status === 404
            ? 'O Similarweb não encontrou dados suficientes para este domínio.'
            : 'O Similarweb respondeu com erro HTTP ' + response.status + '.';
      return res.status(response.status === 401 ? 401 : 502).json({ error: message });
    }
    if (!Array.isArray(payload.data)) return res.status(502).json({ error: 'Resposta do Similarweb sem série de tráfego. Verifique o plano e as métricas liberadas.' });
    return res.status(200).json({
      provider: 'Similarweb',
      metricType: 'estimated',
      domain,
      country: 'BR',
      period: { startDate: dateString(start), endDate: dateString(end), granularity: 'monthly' },
      data: payload.data,
      meta: payload.meta || null,
      fetchedAt: new Date().toISOString(),
      disclaimer: 'Visitas e engajamento são estimativas do Similarweb, não dados internos de analytics do domínio.'
    });
  } catch (error) {
    console.error('WL AD SPY LAB Similarweb error:', error);
    return res.status(502).json({ error: 'Não foi possível consultar o Similarweb. Tente novamente ou verifique a disponibilidade da API.' });
  }
}
