import { timingSafeEqual } from 'node:crypto';
import { transcribe } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' }
  }
};

function validToken(supplied: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(supplied);
  const b = encoder.encode(expected);
  return Boolean(supplied) && a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const expectedToken = process.env.AD_SPY_ACCESS_TOKEN;
  if (!expectedToken) return res.status(503).json({ error: 'Backend não configurado: defina AD_SPY_ACCESS_TOKEN na Vercel.' });
  const suppliedToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!validToken(suppliedToken, expectedToken)) return res.status(401).json({ error: 'Token de acesso inválido.' });

  const hasGatewayAuth = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
  if (!hasGatewayAuth) return res.status(503).json({ error: 'Autenticação do Vercel AI Gateway indisponível. Habilite OIDC no projeto ou configure AI_GATEWAY_API_KEY.' });

  const body = (req.body || {}) as { audioBase64?: unknown; mediaType?: unknown; fileName?: unknown };
  const encoded = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
  if (!encoded || encoded.length > 3_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    return res.status(400).json({ error: 'Áudio ausente ou acima do limite de envio de 2,5 MB.' });
  }

  const audio = Buffer.from(encoded, 'base64');
  if (!audio.length || audio.length > 2.5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Áudio acima do limite de 2,5 MB.' });
  }

  const model = process.env.TRANSCRIBE_MODEL || 'openai/gpt-transcribe';
  try {
    const result = await transcribe({
      model: gateway.transcriptionModel(model),
      audio,
      maxRetries: 1
    });
    if (!result.text?.trim()) return res.status(422).json({ error: 'Nenhuma fala foi reconhecida no áudio.' });
    return res.status(200).json({
      transcript: result.text,
      language: result.language || null,
      durationInSeconds: result.durationInSeconds || null,
      model
    });
  } catch (error) {
    console.error('WL AD SPY LAB transcription error:', error);
    return res.status(502).json({ error: 'A transcrição falhou no provedor de IA. Verifique os créditos, o modelo e o limite de tamanho do arquivo.' });
  }
}
