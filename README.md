# WL AD SPY LAB — V0.5.0 (edição sem APIs pagas)

Extensão Chrome para pesquisa manual de anúncios, organização de referências, análise textual por regras locais e inspeção de links de checkout encontrados em páginas públicas.

## O que esta versão oferece

- Biblioteca de anúncios e referências salva no próprio Chrome.
- Captura manual de texto selecionado e links pelo menu de contexto.
- Dashboard com indicadores do banco local.
- Ofertas salvas, palavras-chave, rastreamento manual e dossiê de domínios.
- Análise automática por regras locais: identifica sinais de público, dor, desejo, mecanismo, promessa, provas mencionadas, gatilhos e CTA. Não usa IA generativa.
- Radar de checkout: inspeciona a URL pública informada manualmente e tenta reconhecer links de plataformas de pagamento visíveis no HTML.
- Biblioteca de transcrições manuais: permite colar e organizar textos de vídeos/anúncios.
- Exportação JSON/CSV e restauração de backup.

## O que foi removido para evitar custos

- Similarweb e a variável `SIMILARWEB_API_KEY`: removidos. Não há consulta de estimativas de tráfego de terceiros.
- Vercel AI Gateway e modelos de IA: removidos da análise e da transcrição. A análise agora usa regras locais, sem cobrança por tokens.
- Transcrição automática de áudio/vídeo por IA: removida. A biblioteca aceita transcrições coladas manualmente.
- Nenhuma chave de API paga é necessária.

O módulo **Dossiê de domínio** continua disponível para você registrar manualmente informações e fontes que encontrou. O sistema não inventa estimativas de visitas ou vendas.

## Instalação no Chrome

1. Extraia o ZIP.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `extension-dist`.
6. Fixe WL AD SPY LAB na barra do Chrome.

Para atualizar uma instalação existente, substitua os arquivos da pasta carregada e clique em **Recarregar** na página de extensões. Faça um backup JSON antes de atualizar.

## Configuração do backend gratuito

O backend mantém apenas o Radar de checkout e a análise heurística. Ele não consulta Similarweb nem chama provedores de IA.

1. O projeto está preparado para deploy na Vercel.
2. Configure somente `AD_SPY_ACCESS_TOKEN` como variável Sensitive em Production.
3. Não configure `SIMILARWEB_API_KEY`, `AI_GATEWAY_API_KEY`, `AI_MODEL` ou `TRANSCRIBE_MODEL`.
4. Faça o deploy e informe a URL do backend e o token na configuração local da extensão quando o radar solicitar.

A chave de acesso fica no servidor e o token é armazenado localmente no seu perfil do Chrome. Não compartilhe esse token.

### Atenção sobre o plano gratuito da Vercel

A Vercel anuncia o Hobby por US$ 0, mas seus termos atuais limitam esse plano a projetos de uso pessoal e não comercial. Ele também possui limites de uso. Portanto, o código não depende de APIs pagas, mas não posso garantir hospedagem gratuita para uso comercial dentro do Hobby. Não faça upgrade nem habilite serviços pagos sem conferir os custos e as condições do plano.

## Capturar anúncios

1. Abra a Biblioteca de Anúncios da Meta normalmente.
2. Selecione o texto do anúncio.
3. Clique com o botão direito e escolha **Salvar seleção no WL AD SPY LAB**.
4. Revise os dados e salve na biblioteca.

A extensão não faz raspagem em massa, não baixa criativos automaticamente e não tenta contornar os mecanismos da Meta.

## Limites importantes

- O radar só inspeciona a URL pública enviada manualmente. Conteúdo carregado por JavaScript, páginas autenticadas ou protegidas pode não ser detectado.
- A presença de um checkout não comprova vendas, faturamento ou quantidade de compradores.
- O score da análise mede sinais textuais observáveis, não desempenho comercial.
- A biblioteca e os registros ficam no perfil local do Chrome. A sincronização entre dispositivos não está incluída.
- A extensão não fornece números de tráfego de concorrentes sem uma fonte confiável.

## Reconstruir a extensão

Requer Node.js 22 ou superior:

```bash
npm run build
```

O ZIP é gerado em `extension-dist/WL_AD_SPY_LAB_v0.5.0.zip`.


## V0.6.0 — interface black & gold
- Navegação principal do dashboard em barra horizontal superior.
- Cartões de anúncios mais compactos, com até cinco colunas em telas largas.
- Paleta black/gold champagne, preservando a identidade WL AD SPY LAB.
- O clique no ícone da extensão abre o painel completo em uma aba do Chrome; os atalhos de captura pelo botão direito continuam abrindo o painel lateral.
- Nenhuma API paga foi reativada.

A atualização reorganiza e estiliza os módulos já existentes. Não adiciona busca ao vivo na Biblioteca de Anúncios da Meta, métricas externas de tráfego nem transcrição automática por IA.
