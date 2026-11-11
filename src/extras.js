(() => {
  if (document.getElementById('wl-intel-launcher')) return;
  const KEY = 'wlSpyIntelV1';
  const DEFAULT_API = 'https://wl-ad-spy-lab.vercel.app';
  const state = { tab: 'offers', backendAuthorized: false, items: { offers: [], keywords: [], tracking: [], domains: [], transcripts: [] } };
  const read = async () => {
    const d = await chrome.storage.local.get(KEY);
    state.items = { ...state.items, ...(d[KEY] || {}) };
  };
  const save = async () => chrome.storage.local.set({ [KEY]: state.items });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('div');
  root.id = 'wl-intel-launcher';
  document.body.append(root);
  const shadow = root.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
  <style>
  :host{all:initial;font-family:Inter,Arial,sans-serif;color:#e8edf2}
  *{box-sizing:border-box}
  .launch{position:fixed;z-index:2147483000;right:18px;bottom:18px;border:1px solid #34404b;background:#111820;color:#e8edf2;border-radius:999px;padding:12px 16px;font-weight:700;box-shadow:0 8px 30px #0008;cursor:pointer}
  .veil{position:fixed;inset:0;background:#0009;z-index:2147483001;display:none;justify-content:flex-end}
  .veil.open{display:flex}
  .panel{width:min(560px,100vw);height:100%;background:#0d1218;border-left:1px solid #29343f;box-shadow:-12px 0 50px #0008;display:flex;flex-direction:column;color:#e8edf2}
  header{padding:18px 20px;border-bottom:1px solid #25303a;display:flex;justify-content:space-between;align-items:center}
  header strong{font-size:15px;letter-spacing:.08em} header small{display:block;color:#8d9aa7;margin-top:4px}
  button{font:inherit;cursor:pointer}.close{background:#1c2630;color:#dce5ec;border:1px solid #35414d;border-radius:9px;padding:7px 10px}
  nav{display:flex;gap:6px;padding:12px 16px;overflow:auto;border-bottom:1px solid #25303a}
  nav button{white-space:nowrap;background:#141d26;color:#aebbc7;border:1px solid #293541;border-radius:9px;padding:8px 10px;font-size:12px}
  nav button.active{background:#213b42;border-color:#3d7c79;color:#d7f7ee}
  main{padding:18px;overflow:auto;flex:1}
  .hint{color:#91a0ad;font-size:12px;line-height:1.5;margin:0 0 14px}
  form,.capture{display:grid;gap:9px;background:#121a22;border:1px solid #293540;border-radius:12px;padding:13px;margin-bottom:16px}
  input,textarea,select{width:100%;background:#0b1117;border:1px solid #33404c;border-radius:8px;padding:10px;color:#edf2f6;font:inherit;font-size:13px}
  input[type=file]{font-size:12px;padding:8px}
  textarea{min-height:66px;resize:vertical}
  label{display:grid;gap:6px;font-size:11px;color:#a9b6c2}
  .primary{background:#2c7770;color:#fff;border:0;border-radius:8px;padding:10px 13px;font-weight:700}
  .primary:disabled{opacity:.55;cursor:wait}
  .secondary{background:#1b2731;color:#dce5ec;border:1px solid #35414d;border-radius:8px;padding:9px 12px}
  .item{border:1px solid #293540;background:#111922;border-radius:11px;padding:12px;margin:9px 0}
  .item b{display:block;font-size:13px;margin-bottom:5px}.item p{font-size:12px;color:#aab6c1;white-space:pre-wrap;overflow-wrap:anywhere;margin:5px 0}
  .meta{font-size:11px;color:#81909d}.actions{display:flex;justify-content:flex-end;gap:7px;margin-top:9px}
  .danger{background:transparent;color:#d99a9a;border:1px solid #654040;border-radius:7px;padding:5px 8px;font-size:11px}
  .empty{padding:24px;text-align:center;color:#81909d;border:1px dashed #34414c;border-radius:10px;font-size:13px}
  .status{font-size:12px;line-height:1.5;color:#a8c8c2;min-height:18px;white-space:pre-wrap}
  .status.error{color:#e4a2a2}.status.good{color:#9ed6b8}
  .section-title{font-size:14px;margin:0 0 8px;color:#edf2f6}
  </style>
  <button class="launch" id="open">✦ Inteligência</button>
  <div class="veil" id="veil"><section class="panel" role="dialog" aria-label="Central de inteligência">
  <header><div><strong>WL AD SPY LAB</strong><small>Central de inteligência e organização</small></div><button class="close" id="close">Fechar</button></header>
  <nav id="tabs">
    <button data-tab="offers">Ofertas salvas</button><button data-tab="keywords">Palavras-chave</button><button data-tab="tracking">Rastreamento</button><button data-tab="domains">Domínios</button><button data-tab="transcript">Transcrição</button>
  </nav><main id="content"></main></section></div>`;
  const $ = s => shadow.querySelector(s);
  $('#open').onclick = () => $('#veil').classList.add('open');
  $('#close').onclick = () => $('#veil').classList.remove('open');
  $('#veil').addEventListener('click', e => { if (e.target === $('#veil')) $('#veil').classList.remove('open'); });
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; state.tab = b.dataset.tab; render(); });
  const configs = {
    offers: { title: 'Ofertas salvas', hint: 'Guarde referências encontradas pelo usuário. Os dados ficam neste perfil do Chrome.', fields: [['title','Nome da oferta'],['url','URL da página'],['niche','Nicho'],['notes','Observações','textarea']] },
    keywords: { title: 'Palavras-chave', hint: 'Organize termos de pesquisa por nicho e idioma para reutilizar na Biblioteca de Anúncios.', fields: [['term','Palavra ou expressão'],['niche','Nicho'],['language','Idioma'],['notes','Notas','textarea']] },
    tracking: { title: 'Rastreamento manual', hint: 'Registre observações periódicas feitas por você. O gráfico/histórico não consulta nem estima dados privados da Meta.', fields: [['name','Anúncio, página ou oferta'],['activeCount','Quantidade de anúncios observada','number'],['sourceUrl','URL da fonte'],['notes','Observações','textarea']] },
    domains: { title: 'Dossiê de domínio', hint: 'Registre dados e evidências que você coletou sobre um domínio. Não exibimos estimativas de tráfego sem uma fonte conectada.', fields: [['domain','Domínio'],['source','Fonte dos dados'],['metric','Métrica observada (opcional)'],['notes','Anotações','textarea']] }
  };

  function render() {
    $('#tabs').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === state.tab));
    const c = $('#content');
    if (state.tab === 'transcript') {
      const cfg = state.items.transcribeConfig || {};
      c.innerHTML = `
        <h3>Transcrição automática de vídeo</h3>
        <p class="hint">Selecione um vídeo salvo no computador. O navegador extrai somente o áudio e envia para transcrição. O arquivo de vídeo não é enviado ao servidor.</p>
        <section class="capture">
          <h4 class="section-title">Transcrever um anúncio</h4>
          <label>Arquivo de vídeo
            <input id="videoFile" type="file" accept="video/*,.mp4,.mov,.webm,.m4v" />
          </label>
          <input id="videoTitle" placeholder="Nome do anúncio ou vídeo" />
          <label>URL do backend
            <input id="apiBase" type="url" value="${esc(cfg.apiBase || DEFAULT_API)}" />
          </label>
          <label>Token de acesso do backend
            <input id="apiToken" type="password" autocomplete="off" placeholder="Cole o AD_SPY_ACCESS_TOKEN configurado na Vercel" />
          </label>
          <button class="secondary" id="authorizeBackend">1. Autorizar acesso ao backend</button>
          <button class="primary" id="runTranscribe">2. Transcrever vídeo automaticamente</button>
          <div class="status" id="transStatus" aria-live="polite"></div>
          <p class="hint">Limite desta versão: vídeos de até 12 minutos e áudio extraído de até 2,5 MB por envio. O processamento usa créditos do Vercel AI Gateway.</p>
        </section>
        <h3>Salvar transcrição manual</h3>
        <form id="transForm"><input name="title" placeholder="Nome do anúncio ou vídeo" required><textarea name="transcript" placeholder="Cole aqui uma transcrição..." required></textarea><button class="secondary">Salvar texto manualmente</button></form>
        <div id="transList"></div>`;
      $('#apiToken').value = cfg.token || '';
      $('#authorizeBackend').onclick = authorizeBackend;
      $('#runTranscribe').onclick = runTranscription;
      $('#transForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        state.items.transcripts ||= [];
        state.items.transcripts.unshift({ id: crypto.randomUUID(), title: f.get('title'), transcript: f.get('transcript'), createdAt: new Date().toISOString(), source: 'manual' });
        await save(); render();
      };
      $('#transList').innerHTML = (state.items.transcripts || []).map(x => card(x.title, x.transcript + (x.language ? '\n\nIdioma: ' + x.language : ''), x.createdAt, 'transcripts', x.id)).join('') || '<div class="empty">Nenhuma transcrição salva.</div>';
      wireDeletes();
      return;
    }
    const cfg = configs[state.tab];
    c.innerHTML = '<h3>' + cfg.title + '</h3><p class="hint">' + cfg.hint + '</p><form id="entry">' + cfg.fields.map(([name,label,type]) => type === 'textarea' ? '<textarea name="' + name + '" placeholder="' + label + '"></textarea>' : '<input ' + (type === 'number' ? 'type="number" min="0"' : '') + ' name="' + name + '" placeholder="' + label + '" ' + (['title','term','name','domain'].includes(name) ? 'required' : '') + '>').join('') + '<button class="primary">Adicionar à biblioteca</button></form><div id="list"></div>';
    $('#entry').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const obj = Object.fromEntries(f.entries());
      obj.id = crypto.randomUUID(); obj.createdAt = new Date().toISOString();
      state.items[state.tab].unshift(obj); await save(); render();
    };
    $('#list').innerHTML = state.items[state.tab].map(x => card(x.title || x.term || x.name || x.domain || 'Registro', Object.entries(x).filter(([k]) => !['id','createdAt','title','term','name','domain'].includes(k)).map(([k,v]) => k + ': ' + v).join('\n'), x.createdAt, state.tab, x.id)).join('') || '<div class="empty">Nada salvo aqui ainda. Adicione seu primeiro registro acima.</div>';
    wireDeletes();
  }

  async function authorizeBackend() {
    const button = $('#authorizeBackend');
    const status = $('#transStatus');
    const say = (message, type = '') => { status.textContent = message; status.className = 'status ' + type; };
    button.disabled = true;
    try {
      const apiBase = $('#apiBase').value.trim().replace(/\\/+$/, '');
      const origin = new URL(apiBase).origin;
      const granted = await chrome.permissions.request({ origins: [origin + '/*'] });
      if (!granted) throw new Error('A permissão de acesso ao backend não foi concedida.');
      state.backendAuthorized = true;
      say('Acesso autorizado. Agora clique em “2. Transcrever vídeo automaticamente”.', 'good');
    } catch (error) {
      say(error?.message || 'Não foi possível autorizar o backend.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function runTranscription() {
    const button = $('#runTranscribe');
    const status = $('#transStatus');
    const file = $('#videoFile').files?.[0];
    const title = $('#videoTitle').value.trim() || file?.name || 'Vídeo sem título';
    const apiBase = $('#apiBase').value.trim().replace(/\/+$/, '');
    const token = $('#apiToken').value.trim();
    const say = (message, type = '') => { status.textContent = message; status.className = 'status ' + type; };
    if (!file) return say('Selecione um arquivo de vídeo primeiro.', 'error');
    if (!token) return say('Informe o token configurado na variável AD_SPY_ACCESS_TOKEN da Vercel.', 'error');
    try {
      const url = new URL(apiBase);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URL do backend inválida.');
    } catch (e) { return say('Informe uma URL válida do backend (https://...).', 'error'); }
    if (file.size > 250 * 1024 * 1024) return say('O arquivo excede o limite de 250 MB nesta versão.', 'error');
    if (!state.backendAuthorized) return say('Clique primeiro em “1. Autorizar acesso ao backend”. Depois, clique novamente para transcrever.', 'error');

    button.disabled = true;
    let video, audioContext, recorder, timer, objectUrl;
    try {
      state.items.transcribeConfig = { apiBase, token };
      say('Preparando o vídeo e extraindo apenas o áudio...');
      objectUrl = URL.createObjectURL(file);
      video = document.createElement('video');
      video.preload = 'auto';
      video.playsInline = true;
      video.controls = false;
      video.style.cssText = 'position:fixed;left:-10000px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;';
      video.src = objectUrl;
      document.body.append(video);
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mime)) throw new Error('Este Chrome não oferece gravação de áudio WebM/Opus.');
      recorder = new MediaRecorder(destination.stream, { mimeType: mime, audioBitsPerSecond: 24000 });
      const chunks = [];
      recorder.addEventListener('dataavailable', e => { if (e.data?.size) chunks.push(e.data); });
      const metadata = video.readyState >= 1 ? Promise.resolve() : new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', resolve, { once: true });
        video.addEventListener('error', () => reject(new Error('Não foi possível ler o formato deste vídeo no Chrome.')), { once: true });
      });
      const ended = new Promise((resolve, reject) => {
        video.addEventListener('ended', resolve, { once: true });
        video.addEventListener('error', () => reject(new Error('Falha ao reproduzir o vídeo para extrair o áudio.')), { once: true });
      });
      const audioContextReady = audioContext.resume();
      const playback = video.play();
      recorder.start(1000);
      const persistConfig = save();
      await Promise.all([metadata, audioContextReady, playback, persistConfig]);
      if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('Não foi possível identificar a duração do vídeo.');
      if (video.duration > 12 * 60) throw new Error('Este vídeo passa de 12 minutos. Reduza o trecho e tente novamente.');
      timer = setInterval(() => {
        const pct = Math.min(99, Math.floor((video.currentTime / video.duration) * 100));
        say('Extraindo áudio localmente: ' + pct + '% · não feche esta janela.');
      }, 400);
      await ended;
      if (timer) clearInterval(timer);
      const stopped = new Promise(resolve => recorder.addEventListener('stop', resolve, { once: true }));
      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;
      const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (!audioBlob.size) throw new Error('Nenhum áudio foi extraído. Confirme se o vídeo possui faixa de áudio.');
      if (audioBlob.size > 2.5 * 1024 * 1024) throw new Error('O áudio extraído ficou acima de 2,5 MB. Reduza a duração/qualidade do vídeo e tente novamente.');
      say('Enviando áudio para transcrição com IA...');
      const bytes = new Uint8Array(await audioBlob.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
      const audioBase64 = btoa(binary);
      const response = await fetch(apiBase + '/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ audioBase64, mediaType: audioBlob.type || 'audio/webm', fileName: 'wl-ad-spy-audio.webm' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Erro HTTP ' + response.status + ' no serviço de transcrição.');
      if (!payload.transcript?.trim()) throw new Error('A IA não identificou fala neste vídeo.');
      state.items.transcripts ||= [];
      state.items.transcripts.unshift({
        id: crypto.randomUUID(),
        title,
        transcript: payload.transcript,
        language: payload.language || '',
        durationInSeconds: payload.durationInSeconds || video.duration,
        model: payload.model || 'openai/gpt-transcribe',
        source: 'video',
        createdAt: new Date().toISOString()
      });
      await save();
      say('Transcrição concluída e salva na biblioteca.', 'good');
      render();
    } catch (error) {
      say(error?.message || 'Não foi possível transcrever este vídeo.', 'error');
    } finally {
      if (timer) clearInterval(timer);
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch {}
      try { if (audioContext && audioContext.state !== 'closed') await audioContext.close(); } catch {}
      try { video?.pause(); video?.remove(); } catch {}
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      button.disabled = false;
    }
  }

  function card(title, body, date, store, id) {
    return '<article class="item"><b>' + esc(title) + '</b><p>' + esc(body) + '</p><div class="meta">' + new Date(date).toLocaleString('pt-BR') + '</div><div class="actions"><button class="danger" data-delete="' + esc(store) + '" data-id="' + esc(id) + '">Excluir</button></div></article>';
  }
  function wireDeletes() {
    shadow.querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => {
      const arr = state.items[b.dataset.delete] || [];
      state.items[b.dataset.delete] = arr.filter(x => x.id !== b.dataset.id);
      await save(); render();
    });
  }
  read().then(render).catch(() => { $('#content').innerHTML = '<p class="hint">Não foi possível acessar o armazenamento local do Chrome.</p>'; });
})();
