(() => {
  if (document.getElementById('wl-intel-launcher')) return;
  const KEY='wlSpyIntelV1';
  const state={tab:'offers',items:{offers:[],keywords:[],tracking:[],domains:[]}};
  const read=async()=>{const d=await chrome.storage.local.get(KEY);state.items={...state.items,...(d[KEY]||{})};};
  const save=async()=>chrome.storage.local.set({[KEY]:state.items});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root=document.createElement('div');root.id='wl-intel-launcher';document.body.append(root);
  const shadow=root.attachShadow({mode:'open'});
  shadow.innerHTML=`
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
  form{display:grid;gap:9px;background:#121a22;border:1px solid #293540;border-radius:12px;padding:13px;margin-bottom:16px}
  input,textarea,select{width:100%;background:#0b1117;border:1px solid #33404c;border-radius:8px;padding:10px;color:#edf2f6;font:inherit;font-size:13px}
  textarea{min-height:66px;resize:vertical}
  .primary{background:#2c7770;color:#fff;border:0;border-radius:8px;padding:10px 13px;font-weight:700}
  .item{border:1px solid #293540;background:#111922;border-radius:11px;padding:12px;margin:9px 0}
  .item b{display:block;font-size:13px;margin-bottom:5px}.item p{font-size:12px;color:#aab6c1;white-space:pre-wrap;overflow-wrap:anywhere;margin:5px 0}
  .meta{font-size:11px;color:#81909d}.actions{display:flex;justify-content:flex-end;gap:7px;margin-top:9px}
  .danger{background:transparent;color:#d99a9a;border:1px solid #654040;border-radius:7px;padding:5px 8px;font-size:11px}
  .empty{padding:24px;text-align:center;color:#81909d;border:1px dashed #34414c;border-radius:10px;font-size:13px}
  </style>
  <button class="launch" id="open">✦ Inteligência</button>
  <div class="veil" id="veil"><section class="panel" role="dialog" aria-label="Central de inteligência">
  <header><div><strong>WL AD SPY LAB</strong><small>Central de inteligência e organização</small></div><button class="close" id="close">Fechar</button></header>
  <nav id="tabs">
    <button data-tab="offers">Ofertas salvas</button><button data-tab="keywords">Palavras-chave</button><button data-tab="tracking">Rastreamento</button><button data-tab="domains">Domínios</button><button data-tab="transcript">Transcrição</button>
  </nav><main id="content"></main></section></div>`;
  const $=s=>shadow.querySelector(s);
  $('#open').onclick=()=>$('#veil').classList.add('open');
  $('#close').onclick=()=>$('#veil').classList.remove('open');
  $('#veil').addEventListener('click',e=>{if(e.target===$('#veil'))$('#veil').classList.remove('open')});
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;state.tab=b.dataset.tab;render()});
  const configs={
    offers:{title:'Ofertas salvas',hint:'Guarde referências encontradas pelo usuário. Os dados ficam neste perfil do Chrome.',fields:[['title','Nome da oferta'],['url','URL da página'],['niche','Nicho'],['notes','Observações','textarea']]},
    keywords:{title:'Palavras-chave',hint:'Organize termos de pesquisa por nicho e idioma para reutilizar na Biblioteca de Anúncios.',fields:[['term','Palavra ou expressão'],['niche','Nicho'],['language','Idioma'],['notes','Notas','textarea']]},
    tracking:{title:'Rastreamento manual',hint:'Registre observações periódicas feitas por você. O gráfico/histórico não consulta nem estima dados privados da Meta.',fields:[['name','Anúncio, página ou oferta'],['activeCount','Quantidade de anúncios observada','number'],['sourceUrl','URL da fonte'],['notes','Observações','textarea']]},
    domains:{title:'Dossiê de domínio',hint:'Registre dados e evidências que você coletou sobre um domínio. Não exibimos estimativas de tráfego sem uma fonte conectada.',fields:[['domain','Domínio'],['source','Fonte dos dados'],['metric','Métrica observada (opcional)'],['notes','Anotações','textarea']]}
  };
  function render(){
    $('#tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
    const c=$('#content');
    if(state.tab==='transcript'){
      c.innerHTML='<h3>Transcrição e roteiro</h3><p class="hint">Cole uma transcrição obtida com uma ferramenta de sua escolha. O WL organiza o texto para análise; esta versão não extrai áudio diretamente de vídeos.</p><form id="transForm"><input name="title" placeholder="Nome do anúncio ou vídeo" required><textarea name="transcript" placeholder="Cole aqui a transcrição..." required></textarea><button class="primary">Salvar transcrição</button></form><div id="transList"></div>';
      $('#transForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.items.transcripts ||= [];state.items.transcripts.unshift({id:crypto.randomUUID(),title:f.get('title'),transcript:f.get('transcript'),createdAt:new Date().toISOString()});await save();render()};
      $('#transList').innerHTML=(state.items.transcripts||[]).map(x=>card(x.title,x.transcript,x.createdAt,'transcripts',x.id)).join('')||'<div class="empty">Nenhuma transcrição salva.</div>';
      wireDeletes();return;
    }
    const cfg=configs[state.tab];
    c.innerHTML='<h3>'+cfg.title+'</h3><p class="hint">'+cfg.hint+'</p><form id="entry">'+cfg.fields.map(([name,label,type])=>type==='textarea'?'<textarea name="'+name+'" placeholder="'+label+'"></textarea>':'<input '+(type==='number'?'type="number" min="0"':'')+' name="'+name+'" placeholder="'+label+'" '+(['title','term','name','domain'].includes(name)?'required':'')+'>').join('')+'<button class="primary">Adicionar à biblioteca</button></form><div id="list"></div>';
    $('#entry').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const obj=Object.fromEntries(f.entries());obj.id=crypto.randomUUID();obj.createdAt=new Date().toISOString();state.items[state.tab].unshift(obj);await save();render()};
    $('#list').innerHTML=state.items[state.tab].map(x=>card(x.title||x.term||x.name||x.domain||'Registro',Object.entries(x).filter(([k])=>!['id','createdAt','title','term','name','domain'].includes(k)).map(([k,v])=>k+': '+v).join('\n'),x.createdAt,state.tab,x.id)).join('')||'<div class="empty">Nada salvo aqui ainda. Adicione seu primeiro registro acima.</div>';
    wireDeletes();
  }
  function card(title,body,date,store,id){return '<article class="item"><b>'+esc(title)+'</b><p>'+esc(body)+'</p><div class="meta">'+new Date(date).toLocaleString('pt-BR')+'</div><div class="actions"><button class="danger" data-delete="'+esc(store)+'" data-id="'+esc(id)+'">Excluir</button></div></article>'}
  function wireDeletes(){shadow.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{const arr=state.items[b.dataset.delete]||[];state.items[b.dataset.delete]=arr.filter(x=>x.id!==b.dataset.id);await save();render()})}
  read().then(render).catch(()=>{ $('#content').innerHTML='<p class="hint">Não foi possível acessar o armazenamento local do Chrome.</p>'});
})();