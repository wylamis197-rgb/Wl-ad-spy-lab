import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const unknown = 'Não identificado no material enviado.';
const contains = (text: string, pattern: RegExp) => pattern.test(text);
const pickSentence = (sentences: string[], pattern: RegExp) => sentences.find(sentence => pattern.test(sentence)) || '';

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function authorized(req: VercelRequest, expected: string): boolean {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\\s+/i, '');
  const a = new TextEncoder().encode(supplied);
  const b = new TextEncoder().encode(expected);
  return Boolean(supplied) && a.length === b.length && timingSafeEqual(a, b);
}

function analyzeLocally(ad: Record<string, unknown>) {
  const copy = String(ad.copy || '').slice(0, 20000).trim();
  const product = String(ad.product || '').slice(0, 500).trim();
  const niche = String(ad.niche || '').slice(0, 300).trim();
  const ctaInput = String(ad.cta || '').slice(0, 300).trim();
  const type = String(ad.type || '').slice(0, 100).trim();
  const text = copy.toLowerCase();
  const sentences = copy.split(/(?<=[.!?])\\s+|\\n+/).map(s => s.trim()).filter(Boolean);
  const audienceSentence = pickSentence(sentences, /\\b(para|ideal para|feito para|destinado a)\\s+.{3,100}/i);
  const audienceMatch = copy.match(/\\b(?:para|ideal para|feito para|destinado a)\\s+([^.!?\\n]{3,120})/i);
  const painSentence = pickSentence(sentences, /\\b(dificuldade|problema|medo|dor|cansad[oa]|sofre|sofrendo|não consegue|nao consegue|sem tempo|endivid|ansied|preocup)/i);
  const desireSentence = pickSentence(sentences, /\\b(tenha|conquiste|consiga|aprenda|alcance|transforme|melhore|aumente|reduza|emagre|organize|economize|liberdade|resultado)/i);
  const mechanismSentence = pickSentence(sentences, /\\b(método|metodo|passo a passo|guia|sistema|plano|protocolo|programa|treinamento|curso|estratégia|estrategia|aulas)/i);
  const promiseSentence = pickSentence(sentences, /\\b(aprenda|descubra|consiga|tenha|alcance|transforme|reduza|aumente|elimine|faça|faca|emagrec|economize)\\b/i);
  const ctaMatch = copy.match(/([^.!?\\n]{0,80}\\b(compre agora|clique aqui|saiba mais|garanta|acesse|peça agora|peca agora|chame no whatsapp|envie uma mensagem|comece hoje)\\b[^.!?\\n]{0,80})/i);
  const proofTerms = /depoimento|avaliaç|avaliac|clientes|alunos|nota \\d|\\d+[.,]?\\d*%|antes e depois|casos reais|milhares de/i;
  const priceTerms = /r\\$\\s?\\d|\\d+[.,]\\d{2}\\s?reais|por apenas|de r\\$/i;
  const urgencyTerms = /hoje|somente hoje|só até|so ate|últim[oa]s?|ultim[oa]s?|encerra|prazo|até meia-noite|ate meia-noite|vagas limitadas/i;
  const scarcityTerms = /últimas? vagas|ultim[oa]s? vagas|poucas unidades|estoque limitado|vagas limitadas|somente \\d+|apenas \\d+/i;
  const bonusTerms = /bônus|bonus|grátis|gratis|presente|inclui também|inclui tambem/i;
  const guaranteeTerms = /garantia|reembolso|devolução|devolucao|dias para testar/i;
  const authorityTerms = /especialista|profissional|certificad[oa]|anos de experiência|anos de experiencia|autoridade/i;

  const audience = audienceMatch ? audienceMatch[0].replace(/\\s+/g, ' ').trim() : unknown;
  const pain = painSentence || unknown;
  const desire = desireSentence || unknown;
  const mechanism = mechanismSentence || unknown;
  const promise = promiseSentence || unknown;
  const cta = ctaInput || (ctaMatch ? ctaMatch[0].trim() : unknown);
  const proof = contains(text, proofTerms)
    ? 'O texto contém menção a prova social, números ou resultados. A autenticidade não foi verificada.'
    : unknown;

  const triggers = unique([
    contains(text, urgencyTerms) ? 'Urgência' : '',
    contains(text, scarcityTerms) ? 'Escassez' : '',
    contains(text, bonusTerms) ? 'Bônus ou item gratuito' : '',
    contains(text, guaranteeTerms) ? 'Garantia ou reembolso' : '',
    contains(text, authorityTerms) ? 'Autoridade' : '',
    contains(text, proofTerms) ? 'Prova social ou números citados' : '',
    contains(text, priceTerms) ? 'Preço ou condição comercial' : '',
    contains(text, /desconto|promoção|promocao|oferta especial|de r\\$/i) ? 'Desconto ou promoção' : ''
  ]);

  const angle = contains(text, /econom|barat|preço|preco|desconto|promoç|promoc/i) ? 'Preço e economia'
    : contains(text, /medo|risco|perigo|perder|problema|dor/i) ? 'Dor e prevenção'
    : contains(text, /rápid|rapido|em \\d+ dias|hoje|imediat/i) ? 'Rapidez e conveniência'
    : contains(text, /família|familia|filho|mãe|mae|pai|criança|crianca/i) ? 'Família e cuidado'
    : unknown;

  const detailScore = (condition: boolean, max: number, partial = 0) => condition ? max : partial;
  const audiencePainDesire = detailScore(Boolean(audienceMatch), 5) +
    detailScore(Boolean(painSentence), 7) + detailScore(Boolean(desireSentence), 8);
  const mechanismScore = detailScore(Boolean(mechanismSentence), 12, contains(text, /método|metodo|guia|curso|aulas/i) ? 5 : 0);
  const promiseScore = detailScore(Boolean(promiseSentence), /\\d+\\s?(dias|semanas|meses|passos|aulas|minutos|%)|em até|em ate/i.test(copy) ? 15 : 9, 0);
  const productScore = detailScore(Boolean(product), 7) + detailScore(Boolean(type), 4) + detailScore(copy.length > 120, 4);
  const offerScore = detailScore(contains(text, priceTerms), 4) + detailScore(contains(text, bonusTerms), 4) +
    detailScore(contains(text, guaranteeTerms), 4) + detailScore(Boolean(ad.cta), 3);
  const proofScore = detailScore(contains(text, proofTerms), /\\d+[.,]?\\d*%|\\d+ clientes|\\d+ alunos/i.test(text) ? 10 : 6);
  const ctaScore = detailScore(Boolean(ctaInput || ctaMatch), 10);
  const breakdown = [
    { criterion: 'Público, dor e desejo', score: audiencePainDesire, maxScore: 20, justification: 'Pontuação baseada na presença de sinais textuais de público, problema e resultado desejado.' },
    { criterion: 'Mecanismo', score: mechanismScore, maxScore: 15, justification: 'Verifica se há método, processo, guia ou forma de entrega identificável.' },
    { criterion: 'Promessa', score: promiseScore, maxScore: 15, justification: 'Considera a clareza da transformação e a presença de parâmetros concretos.' },
    { criterion: 'Clareza do produto', score: productScore, maxScore: 15, justification: 'Considera nome, formato informado e quantidade de conteúdo disponível para análise.' },
    { criterion: 'Composição da oferta', score: offerScore, maxScore: 15, justification: 'Verifica preço, bônus, garantia e chamada comercial informados.' },
    { criterion: 'Provas e credibilidade', score: proofScore, maxScore: 10, justification: 'Detecta apenas menções a provas; não autentica depoimentos nem resultados.' },
    { criterion: 'Clareza do CTA', score: ctaScore, maxScore: 10, justification: 'Verifica se há uma ação explícita para o leitor.' }
  ];
  const total = breakdown.reduce((sum, item) => sum + item.score, 0);

  const improvements: string[] = [];
  if (!audienceMatch) improvements.push('Deixe explícito para quem a oferta foi criada.');
  if (!painSentence) improvements.push('Mostre qual problema concreto a oferta resolve.');
  if (!desireSentence) improvements.push('Explique o resultado desejado em linguagem específica e verificável.');
  if (!mechanismSentence) improvements.push('Apresente como o produto funciona, sem depender apenas de uma promessa.');
  if (!promiseSentence) improvements.push('Torne o benefício central claro e mensurável, sem prometer resultados garantidos.');
  if (!contains(text, priceTerms)) improvements.push('Informe preço e condições comerciais de forma transparente.');
  if (!contains(text, guaranteeTerms)) improvements.push('Explique a política de garantia ou reembolso, caso exista.');
  if (!contains(text, proofTerms)) improvements.push('Inclua provas verificáveis e contextualizadas, caso existam.');
  if (!ctaInput && !ctaMatch) improvements.push('Finalize com uma chamada para ação objetiva.');
  if (!improvements.length) improvements.push('Revise se cada afirmação está sustentada por provas reais e se a página explica claramente o que o comprador recebe.');

  const evidence = [
    { field: 'Público', classification: audienceMatch ? 'observado' : 'não identificado', detail: audienceMatch ? audienceSentence || audience : 'Não há indicação textual suficientemente clara do público.' },
    { field: 'Dor', classification: painSentence ? 'observado' : 'não identificado', detail: pain },
    { field: 'Desejo', classification: desireSentence ? 'observado' : 'não identificado', detail: desire },
    { field: 'Mecanismo', classification: mechanismSentence ? 'observado' : 'não identificado', detail: mechanism },
    { field: 'Promessa', classification: promiseSentence ? 'observado' : 'não identificado', detail: promise },
    { field: 'Prova', classification: contains(text, proofTerms) ? 'observado' : 'não identificado', detail: proof },
    { field: 'CTA', classification: ctaInput || ctaMatch ? 'observado' : 'não identificado', detail: cta }
  ];

  const confidence = copy.length > 700 && evidence.filter(item => item.classification === 'observado').length >= 5
    ? 'alta'
    : copy.length > 180 && evidence.filter(item => item.classification === 'observado').length >= 3 ? 'média' : 'baixa';

  return {
    niche: niche || unknown,
    product: product || unknown,
    targetAudience: audience,
    pain,
    desire,
    mechanism,
    hook: sentences[0] || unknown,
    promise,
    angle,
    proof,
    offerSummary: [product, type, niche].filter(Boolean).join(' · ') || 'Os dados fornecidos não permitem resumir o produto com segurança.',
    cta,
    triggers,
    objections: [
      'O que exatamente está incluído no produto?',
      'Qual é o preço final e existem pagamentos adicionais?',
      'Há garantia ou política de reembolso?',
      'Quais evidências sustentam as afirmações e os resultados apresentados?'
    ],
    improvements,
    differentiationIdeas: [
      'Demonstre o mecanismo com uma sequência visual simples, em vez de repetir apenas a promessa.',
      'Organize a oferta por entregáveis concretos, mostrando o que a pessoa recebe após a compra.',
      'Use provas verificáveis, com contexto e autorização, e diferencie claramente fatos de expectativas.'
    ],
    confidence,
    evidence,
    score: {
      total,
      breakdown,
      rationale: 'Pontuação heurística baseada somente nos sinais textuais recebidos. Não é avaliação de vendas, conversão, faturamento ou desempenho comercial.'
    }
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const expectedToken = process.env.AD_SPY_ACCESS_TOKEN;
  if (!expectedToken) return res.status(503).json({ error: 'Backend não configurado: defina AD_SPY_ACCESS_TOKEN na Vercel.' });
  if (!authorized(req, expectedToken)) return res.status(401).json({ error: 'Token de acesso inválido.' });

  const ad = (req.body as { ad?: Record<string, unknown> } | undefined)?.ad;
  if (!ad || typeof ad !== 'object') return res.status(400).json({ error: 'Envie os dados do anúncio no campo ad.' });

  const normalized = {
    advertiser: String(ad.advertiser || '').slice(0, 300),
    pageUrl: String(ad.pageUrl || '').slice(0, 2000),
    copy: String(ad.copy || '').slice(0, 20000),
    niche: String(ad.niche || '').slice(0, 300),
    product: String(ad.product || '').slice(0, 500),
    type: String(ad.type || '').slice(0, 100),
    startDate: String(ad.startDate || '').slice(0, 100),
    cta: String(ad.cta || '').slice(0, 300),
    notes: String(ad.notes || '').slice(0, 4000)
  };
  if (!normalized.copy && !normalized.pageUrl && !normalized.product) {
    return res.status(400).json({ error: 'O anúncio precisa ter texto, link ou nome do produto para análise.' });
  }

  try {
    const analysis = analyzeLocally(normalized);
    return res.status(200).json({
      analysis,
      model: 'motor-local-regras-v1',
      provider: 'local',
      generatedAt: new Date().toISOString(),
      disclaimer: 'Análise automática por regras locais; não usa IA generativa nem consulta serviços pagos.'
    });
  } catch (error) {
    console.error('WL AD SPY LAB local analysis error:', error);
    return res.status(500).json({ error: 'Não foi possível processar os dados localmente.' });
  }
}
