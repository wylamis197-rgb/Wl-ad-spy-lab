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

Requer Node.js 20 ou superior. Não é necessário instalar dependências para montar os arquivos da extensão:

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
