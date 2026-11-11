# WL AD SPY LAB — V1

Extensão Chrome para organizar referências da Biblioteca de Anúncios, registrar anunciantes, estruturar oportunidades e solicitar análises de oferta com IA.

## O que já funciona nesta versão

- Extensão Chrome Manifest V3, com painel lateral aberto pelo ícone da extensão.
- Menu de contexto: selecione um texto em uma página ou clique com o botão direito sobre um link e escolha **Salvar seleção no WL AD SPY LAB** ou **Salvar link no WL AD SPY LAB**.
- O texto selecionado e a URL da página são enviados ao formulário de captura para revisão manual.
- Cadastro de anúncios, anunciantes, nicho, produto, formato, CTA, tags e observações.
- Biblioteca com busca, filtro por formato, favoritos e exclusão.
- Dashboard com indicadores do próprio banco local.
- Criação de oportunidades a partir de anúncios salvos.
- Configuração de backend de IA, com autorização de host solicitada somente para o endereço informado.
- Exportação JSON completa, exportação CSV e restauração de backup.

## Instalar no Chrome (sem compilar)

1. Extraia o arquivo ZIP.
2. Abra `chrome://extensions` no Google Chrome.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `extension-dist` que está dentro da pasta extraída.
6. Fixe o WL AD SPY LAB na barra de extensões.
7. Clique no ícone para abrir o painel lateral.

Para abrir o dashboard completo, use a seta no topo do painel lateral.

## Como capturar um anúncio

1. Abra a Biblioteca de Anúncios da Meta normalmente.
2. Selecione o texto do anúncio que deseja guardar.
3. Clique com o botão direito.
4. Escolha **Salvar seleção no WL AD SPY LAB**. Para capturar o destino de um link, clique com o botão direito sobre ele e escolha **Salvar link no WL AD SPY LAB**.
5. Revise o texto, complete anunciante, nicho ou produto e clique em **Salvar na minha biblioteca**.

A V1 não faz raspagem em massa, não baixa automaticamente criativos e não tenta contornar mecanismos da Meta. A captura é iniciada pelo usuário e deve respeitar os termos e permissões aplicáveis.

## Ativar análise com IA

A interface da extensão já chama `POST /api/analyze`. O backend foi publicado em produção na Vercel: `https://wl-ad-spy-lab.vercel.app`. A URL já vem preenchida nas Configurações da extensão.

**Estado atual:** o projeto e o deploy estão criados, mas a análise com IA ainda não está liberada. As variáveis `AD_SPY_ACCESS_TOKEN` e `AI_MODEL` precisam ser configuradas no projeto Vercel; a credencial do provedor/Gateway também pode ser necessária conforme a conta. Até isso ser feito, os endpoints retornam que o backend não está configurado.

### Publicar o backend na Vercel

1. Faça upload/importação desta pasta como um projeto no GitHub e importe o repositório na Vercel, ou use o fluxo de deploy de sua preferência.
2. Mantenha a raiz do projeto como diretório raiz da Vercel.
3. Configure as variáveis de ambiente:
   - `AD_SPY_ACCESS_TOKEN`: token longo e exclusivo para proteger seu endpoint pessoal.
   - `AI_MODEL`: ID de um modelo atualmente disponível no Vercel AI Gateway, no formato `provedor/modelo`.
   - `AI_GATEWAY_API_KEY`: configure quando sua implantação/conta exigir uma chave explícita. Em projetos Vercel com autenticação integrada do Gateway, siga a configuração OIDC atual da Vercel.
4. Faça o deploy.
5. No WL AD SPY LAB, abra **Configurações** e informe a URL do projeto e o mesmo `AD_SPY_ACCESS_TOKEN`.
6. Clique em **Salvar e autorizar conexão**. O Chrome pedirá permissão para conectar somente ao domínio informado.
7. Clique em **Testar conexão** para conferir se o endpoint e o modelo estão configurados.

Consulte o catálogo atual de modelos do Vercel AI Gateway antes de preencher `AI_MODEL`; os nomes e disponibilidades dos modelos mudam.

### Importante sobre o token

Esta V1 é direcionada a uso individual. O token de acesso ao backend fica armazenado no perfil local do Chrome e pode ser extraído por alguém que tenha acesso ao perfil/dispositivo. Não compartilhe o mesmo backend/token publicamente nem distribua esta compilação como serviço multiusuário. Para uso público, a próxima etapa deve implementar autenticação individual, rate limiting, quotas e gestão de usuários.

A chave do provedor de IA nunca deve ser colocada na extensão. Ela fica apenas nas variáveis de ambiente do backend.

## Arquitetura

A interface V1 usa HTML, CSS e JavaScript nativos para manter a extensão pequena, rápida e instalável diretamente pelo Chrome, sem etapa de compilação do frontend. O armazenamento usa IndexedDB. O backend de análise é separado e utiliza Vercel AI SDK + AI Gateway.

## Estrutura do projeto

```text
ad-spy-lab-v1/
├── api/
│   ├── analyze.ts
│   └── health.ts
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app.js
│   ├── background/service-worker.js
│   ├── dashboard/index.html
│   ├── lib/db.js
│   ├── sidepanel/index.html
│   └── styles/app.css
├── extension-dist/
├── scripts/build-extension.mjs
├── package.json
└── vercel.json
```

## Reconstruir a extensão

Requer Node.js 22 ou superior para o backend de IA. Não é necessário instalar dependências para montar os arquivos da extensão:

```bash
npm run build
```

A saída ficará em `extension-dist/`.

## Limitações conhecidas da V1

- O registro de anúncios é manual, com atalho para enviar texto selecionado e URL. Dados como anunciante, ID, data inicial e formato devem ser revisados/preenchidos pelo usuário.
- Não há acesso a vendas, investimento, ROAS, conversões ou faturamento de concorrentes.
- O score avalia a estrutura observável da oferta, não o desempenho comercial.
- A análise atual é textual. Análise multimodal de imagens/vídeos e leitura assistida de landing pages ficam para uma próxima versão.
- O banco é local a este perfil/navegador. A sincronização entre dispositivos ainda não está incluída.

## Próximos incrementos recomendados

1. Edição completa de anúncios e gestão de pastas/tags.
2. Histórico e comparação de análises.
3. Upload/análise de imagens de criativos.
4. Dossiê de landing page a partir de conteúdo fornecido pelo usuário.
5. Autenticação individual e sincronização segura.


## V0.2.0 — módulos locais de inteligência

A V0.2.0 adiciona uma central complementar aberta pelo botão **Inteligência**, sem substituir a identidade visual da interface principal.

- **Ofertas salvas:** registro local de oferta, URL, nicho e observações.
- **Palavras-chave:** coleções de termos por nicho e idioma.
- **Rastreamento manual:** histórico de observações de quantidade de anúncios e fonte.
- **Dossiê de domínios:** registro de métricas fornecidas pelo usuário, fonte e notas.
- **Transcrições:** armazenamento de texto transcrito/fornecido pelo usuário para consulta posterior.

Os registros novos ficam no armazenamento local do Chrome, separados do banco de anúncios V1. Eles não sincronizam entre dispositivos.

### Limites explícitos dos módulos

- Rastreamento não consulta anúncios da Meta automaticamente nem estima vendas.
- Dossiê de domínio não consulta um provedor de tráfego nesta versão; só organiza informações e fontes inseridas pelo usuário.
- A aba Transcrição aceita texto manual ou vídeo local: extrai apenas o áudio no navegador e solicita transcrição automática ao backend Vercel AI Gateway.
- O radar de checkouts e um ranking externo de ofertas escaladas ainda dependem de fontes de dados e integrações que não estão configuradas.
- A análise de IA continua condicionada à configuração das variáveis e credenciais no projeto Vercel.

### Atualização

Depois de carregar a pasta extension-dist no Chrome, abra chrome://extensions, localize WL AD SPY LAB e clique em Atualizar (ou recarregue a extensão). Não remova a extensão antiga antes de exportar um backup, pois os dados ficam no perfil local.


## V0.3.3 — limpeza de interface e transcrição automática

- A entrada antiga **Zenly/Zedly** é removida do painel lateral e do dashboard por uma rotina de limpeza do menu, inclusive quando a interface é renderizada dinamicamente.
- A aba **Transcrição** permite selecionar um arquivo de vídeo local. O navegador reproduz o vídeo localmente e extrai apenas a faixa de áudio em WebM/Opus; o vídeo original não é enviado ao backend.
- A transcrição é processada pelo modelo `openai/gpt-transcribe` no Vercel AI Gateway e o texto reconhecido é salvo automaticamente na biblioteca local de transcrições.
- Limites implementados: vídeo de até 12 minutos, arquivo original de até 250 MB e áudio extraído de até 2,5 MB por envio. O formato precisa ser reproduzido pelo Chrome.
- O backend usa o token individual `AD_SPY_ACCESS_TOKEN`. Na aba Transcrição, informe a URL do backend e o mesmo token; ele fica armazenado apenas no perfil local do Chrome.
- O projeto usa Node.js 22 e AI SDK 7. O Vercel AI Gateway precisa de autenticação OIDC habilitada no projeto ou de `AI_GATEWAY_API_KEY` como variável de ambiente. A chamada do modelo pode consumir créditos ou gerar cobrança na conta Vercel.
- Não coloque a chave do Gateway dentro da extensão. O token de acesso e a credencial de IA são diferentes.

### Baixar e instalar a versão atual

O ZIP pronto é publicado junto com o site: [Baixar WL AD SPY LAB v0.3.3](https://wl-ad-spy-lab.vercel.app/WL_AD_SPY_LAB_v0.3.3.zip). Extraia o arquivo, abra `chrome://extensions`, ative o Modo do desenvolvedor, clique em **Carregar sem compactação** e selecione a pasta extraída. Para substituir uma instalação anterior, atualize a pasta carregada e clique em **Recarregar**.

### Ativar a transcrição automática

1. Na Vercel, configure `AD_SPY_ACCESS_TOKEN` com um token longo e exclusivo.
2. Mantenha a autenticação OIDC habilitada para o projeto ou configure `AI_GATEWAY_API_KEY` como variável de ambiente.
3. Faça o deploy de produção.
4. Na extensão, abra **Inteligência → Transcrição**, informe `https://wl-ad-spy-lab.vercel.app` e o mesmo token definido na Vercel.
5. Clique em **1. Autorizar acesso ao backend** e permita o domínio no aviso do Chrome.
6. Selecione um vídeo e clique em **2. Transcrever vídeo automaticamente**. A autorização e a transcrição são ações separadas para o Chrome permitir a reprodução local do vídeo.

O sistema processa vídeos selecionados manualmente pelo usuário. Ele não acessa vídeos de outras páginas ou anúncios automaticamente.
