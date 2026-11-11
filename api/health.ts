import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });

  const expectedToken = process.env.AD_SPY_ACCESS_TOKEN;
  if (!expectedToken) return res.status(503).json({ error: 'Backend ainda não configurado.' });
  const suppliedToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const suppliedBuffer = new TextEncoder().encode(suppliedToken);
  const expectedBuffer = new TextEncoder().encode(expectedToken);
  if (!suppliedToken || suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Token de acesso inválido.' });
  }

  return res.status(200).json({
    ok: true,
    analysisMode: 'motor-local-regras-v1',
    localAnalysisConfigured: true,
    aiModelConfigured: false,
    aiModel: null,
    transcriptionModelConfigured: false,
    trafficConfigured: false,
    checkoutRadarConfigured: true,
    paidExternalProviders: false
  });
}
