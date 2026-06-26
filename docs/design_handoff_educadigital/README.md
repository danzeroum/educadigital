# Handoff: EducaDigital — Protótipo navegável (Aluno + Tutor)

## Overview
EducaDigital é uma PWA de educação adaptativa para o público **EJA** (Educação de Jovens e Adultos). Este handoff cobre o **protótipo navegável de alta fidelidade** com os dois portais:

- **Portal do Aluno** (mobile-first, offline-first): onboarding com diagnóstico multimodal, dashboard, player de vídeo interativo, chat com tutor IA, revisão SRS (flashcards), biblioteca, leitor de texto, perfil/gamificação.
- **Portal do Tutor** (desktop-first, data-dense): dashboard de KPIs, lista de alunos, aluno individual, alertas de risco e análises da turma.

A direção visual é **calorosa, ousada e gamificada** ("mais WhatsApp que lousa"), com a metáfora de **crescimento de planta** para a gamificação (semente → broto → muda → árvore).

---

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — um protótipo que demonstra a aparência e o comportamento pretendidos. **Não são código de produção para copiar diretamente.**

A tarefa é **recriar estas telas no codebase real** do EducaDigital, que já existe e usa:

- **Next.js (App Router / RSC)** — `apps/web` no monorepo (Turbo + pnpm)
- **Tailwind CSS 3** + **shadcn/ui**
- **Zustand** (`src/store/auth.store.ts`), **TanStack Query** (provider em `src/app/providers.tsx`)
- **Lucide React** para ícones
- Offline via IndexedDB (`src/lib/offline/db.ts`), SRS SM-2 (`src/lib/srs/sm2.ts`), client de API (`src/lib/api/client.ts`)

Implemente cada tela como componentes React server/client conforme o padrão do app, usando shadcn/ui como base e os tokens de design abaixo. Os "componentes de produto" (ExerciseCard, SrsCard, TutorChat, etc.) devem virar componentes reais em `src/components/`.

> **Nota sobre o protótipo:** ele é um único arquivo `.dc.html` autocontido com estado em uma classe JS e estilos inline. Isso é só para a demo navegável — **não reproduza a arquitetura de arquivo único nem os estilos inline**. Extraia tokens, layouts e comportamento; reconstrua com componentes idiomáticos.

---

## Fidelity
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento, raios e estados finais estão definidos. Recrie pixel-a-pixel usando as libs existentes. Onde o protótipo usa emoji (gamificação, conquistas, tipos de mídia), isso é **intencional** e faz parte da identidade — o brief autoriza emoji para gamificação/achievements. Ícones de UI "estruturais" (nav, voltar, busca, settings) podem migrar para **Lucide** equivalentes.

---

## Design Tokens

### Cores

**Base / neutros (tom quente)**
| Token | Hex | Uso |
|---|---|---|
| `paper` | `#FBF7EF` | Fundo do app (canvas) |
| `surface` | `#FFFFFF` | Cards, superfícies elevadas |
| `ink` | `#15241C` | Texto principal (preto esverdeado quente) |
| `ink-soft` | `#5B6B62` | Texto secundário |
| `ink-muted` | `#9AA89F` | Metadados, placeholders |
| `ink-faint` | `#B0B8B0` / `#A8B0A8` | Ícones inativos, desabilitado |
| `line` | `#ECE5D6` | Bordas de card |
| `line-2` | `#E1DAC9` | Bordas de input |
| `line-track` | `#EFE9DC` | Trilho de progress bar (claro) |
| `line-soft` | `#F0EBDF` / `#F3EEE2` | Divisores, chips neutros |
| `dot-empty` | `#E7E1D4` / `#D4E9DB` | Stepper/dots vazios |

**Marca — Verde (primário)**
| Token | Hex |
|---|---|
| `green-500` | `#22C55E` (gradiente claro) |
| `green` (primário) | `#16A34A` — **theme_color do manifest** |
| `green-700` | `#15803D` |
| `green-900` (deep) | `#0B5132` |
| `green-spring` | `#5BE39A` |
| `green-bright` | `#9BFFC4` / `#9BE8B8` (preenchimentos sobre escuro) |
| `green-tint` | `#EAF8EF` |
| `green-tint-2` | `#E4F8EC` |

**Âmbar / mel (streak, XP, gamificação)**
| Token | Hex |
|---|---|
| `amber` | `#F59E0B` |
| `amber-bright` | `#FFB938` |
| `amber-deep` | `#B45309` (texto sobre tint) |
| `amber-deep-2` | `#A16207` |
| `amber-tint` | `#FEF1D6` |
| `amber-border` | `#FADFA8` |

**Coral (play / celebração / avatar da aluna)**
| `coral` `#FF6B5E` · `coral-light` `#FF8A5B` |

**Azul (info / leitura / tutor)**
| `sky` `#2D7FF9` · `sky-deep` `#1D5FBF` · `sky-tint` `#E8F1FF` |

**Roxo (acertos / Fund. I)** — `#8B5CF6` · `#7C3AED` · tint `#F3E8FF`
**Teal** — `#0EA5A5`

**Semânticos de risco**
| Nível | Texto | Fundo |
|---|---|---|
| Crítico | `#C5292E` / `#E5484D` | `#FDE7E7` / `#FDECEC` |
| Alto | `#B45309` | `#FEEBD6` |
| Atenção (médio) | `#A16207` | `#FEF6D6` |
| Em dia (baixo) | `#15803D` | `#EAF8EF` |

**Superfícies escuras**
| `bezel/sidebar` `#0B1410` · sidebar texto inativo `#AEBAB2` · sidebar item ativo bg `rgba(34,197,94,.16)` fg `#5BE39A` |

**Modo leitura (sépia)** — bg `#FBF3E4` · ink `#3A2F1A` · linha `#EBDFC4` · destaque-marca `#B45309`

#### Mapeamento shadcn (`globals.css :root`, valores HSL aproximados)
```css
:root {
  --background: 40 43% 96%;       /* #FBF7EF */
  --foreground: 150 25% 11%;      /* #15241C */
  --card: 0 0% 100%;
  --card-foreground: 150 25% 11%;
  --primary: 142 71% 36%;         /* #16A34A */
  --primary-foreground: 0 0% 100%;
  --secondary: 38 92% 50%;        /* #F59E0B  (gamificação/streak) */
  --secondary-foreground: 30 70% 20%;
  --muted: 40 30% 92%;
  --muted-foreground: 150 9% 39%; /* #5B6B62 */
  --border: 40 30% 88%;           /* #ECE5D6 */
  --input: 40 28% 84%;            /* #E1DAC9 */
  --ring: 142 71% 36%;
  --destructive: 358 64% 53%;     /* #E5484D */
  --radius: 1rem;                 /* 16px base; cards usam até 24-26px */
}
```

### Tipografia
Três famílias (Google Fonts). **Isto substitui o `Inter` atual** do `tailwind.config.js` — foi a decisão de direção visual (mais expressiva e legível para EJA).

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 700, 800 | Títulos de tela, números grandes (XP, KPIs), nome do aluno, conquistas |
| Body | **Plus Jakarta Sans** | 400/500/600/700/800 | Texto corrido, mensagens, botões, labels |
| Mono | **Space Mono** | 400, 700 | Timer de vídeo, horário, datas de certificado, códigos |

Escala (mínimo 16px para corpo — requisito EJA):
- 11–13px: labels/metadados · 14–15px: secundário · **16px base** · 17–18px: botões, exercícios · 20–24px: títulos de tela · 26–34px: números de gamificação/KPIs · clamp(34–60px): hero do launcher.
- `letter-spacing` em display: `-.02em` a `-.03em`. `text-wrap: balance/pretty` nos títulos.

```js
// tailwind.config.js → theme.extend.fontFamily
fontFamily: {
  display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
  sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
  mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
}
```

### Raios
Phone screen `44px` · cards principais `20–26px` · cards internos / inputs `14–18px` · botões `16–20px` · chips/badges/pills `999px` · avatares `15–21px` (squircle) ou `50%`.

### Sombras
- soft: `0 6px 16px rgba(18,38,28,.05)`
- card: `0 6px 18px rgba(18,38,28,.05)` a `0 10px 30px rgba(18,38,28,.07)`
- elevada (modal/sheet/srs): `0 20px 50px rgba(18,38,28,.12)`
- coloridas (CTAs): verde `0 14px 30px rgba(22,163,74,.32)` · âmbar `0 14px 30px rgba(245,158,11,.3)` · coral `0 10px 24px rgba(255,107,94,.32)`

### Espaçamento
Padding de tela mobile `16–22px`. Gaps entre cards `8–16px`. Alvo de toque mínimo **44×44px** (já forçado no `globals.css`). Bottom nav `80px` + `env(safe-area-inset-bottom)`.

---

## Navegação global

**Aluno (mobile) — bottom nav fixa, 80px, blur, 5 tabs:**
Início (🏠 dash) · Explorar (🧭 biblioteca) · Revisão (🔄 SRS) · Tutor (💬 chat) · Perfil (👤).
A nav só aparece em telas "tab" (dash, biblioteca, perfil). Telas imersivas (onboarding, player, chat, revisão, leitor) são full-screen com botão "voltar" próprio.

**Tutor (desktop) — sidebar fixa 236px, fundo `#0B1410`:** Dashboard · Meus alunos · Alertas (badge de contagem) · Análises. Rodapé com avatar do tutor.

> No protótipo há um seletor flutuante no topo direito (Início/Aluno/Tutor + toggle de modo offline) **só para a demo** — não implementar no app.

---

## Screens / Views

> Medidas de referência do frame de celular: **384px** de largura, tela interna com cantos `44px`. Layouts são single-column com scroll. No desktop do aluno, seguir o brief (side nav 220px, grids 3–4 col); aqui o protótipo demonstra o mobile.

### Aluno

**A4–A8 · Diagnóstico (wizard, 5 passos)**
Chrome comum: botão voltar (squircle `#F0EBDF`), **stepper** de 5 barras (preenchidas = `#16A34A`, vazias = `#E7E1D4`), label "Passo X de 5 · <tarefa>" em verde.
- **Intro:** emoji grande (anima `bob`), título display, subtítulo, 5 dots, CTA gradiente verde "Vamos lá! 🚀".
- **Passo 1 — Áudio:** prompt, **waveform** (13 barras animando `wave` quando gravando), botão redondo 96px press-and-hold (idle `#FF6B5E` 🎤 / gravando `#E5484D` ⏸ com anel pulsante `ring`), cronômetro mono, "Continuar".
- **Passo 2 — Escrita:** preview de câmera escuro com **retângulo-guia** tracejado + cantos verdes; CTA "📷 Tirar foto".
- **Passo 3 — Quiz:** "Pergunta X de 5", barra de tempo, pergunta display, 4 opções (botões `min-height 56px`, tag A/B/C/D); selecionada = borda+tag verde, fundo `#EAF8EF`; **não revela acerto** — só avança. CTA "Próxima" desabilita (cinza) até selecionar.
- **Passo 4 — Leitura:** card com parágrafo (21px) para ler em voz alta + mesmo padrão de gravação.

**A9 · Aguardando resultado** — spinner circular (anel verde girando) com 🌱 pulsante; título "Estamos analisando…"; **mensagens rotativas** a cada ~1.5s ("Entendendo como você aprende melhor…", "Identificando seus pontos fortes…", "Montando sua trilha personalizada…"); auto-avança após ~4.6s.

**A10 · Resultado** — confetti (16 peças caindo); título "Sua trilha está pronta, [Nome]!"; 2 cards (Seu nível EJA em gradiente verde com 🌿 / Como aprende — "Visual + Vídeos" 🎬); pills de pontos fortes (BNCC); CTA gradiente "Começar trilha! 🚀".

**B1 · Dashboard** — header (avatar coral com inicial, "Bom dia, Ana 🌱", **StreakBadge** 🔥 em pill âmbar) · **XP card** gradiente verde (nível+nome de planta, "1.450 XP", chip "+10 hoje", **barra de XP** `#9BFFC4` a 78%, "50 XP para o Nível 4 · Arvorezinha 🌳") · **Trilha de hoje** (cards: thumb colorido por tipo + tipo + título + meta + status ✅/○) · **banner de revisão** gradiente âmbar ("5 revisões pra hoje", "+80% na memória") · **progresso do módulo** (6/12).

**B2 · Biblioteca/Explorar** — título · busca (filtra em tempo real) · chips de filtro (Todos/Vídeo/Leitura/Exercício; ativo = pill `#15241C`) · **grid 2-col** de ResourceCards (thumb 84px colorido por tipo, badge de tipo, duração, título, badge de nível, dificuldade em ★, mini progress se iniciado). **Estado vazio:** 🔍 + "Nada por aqui ainda" quando a busca não acha.

**B3 · Player de vídeo interativo** — área de vídeo escura 236px (botão voltar, play central, fonte/licença + título; status bar em branco) · **barra de controle** abaixo (não sobreposta): progress com **marcador de checkpoint** losango âmbar pulsante (clicável → abre exercício) + checkpoint futuro cinza · timestamp mono · dica. Conteúdo abaixo: título, fonte, **tabs** [Resumo]/[Exercícios]/[Transcrição], card de resumo com toggle Básico/Intermediário. **FAB** "💬 Tirar dúvida" (canto inferior direito) → abre chat.
- **Overlay de exercício** (bottom sheet, slide-up): scrim `rgba(11,20,16,.55)`, card branco arredondado, badge "⬥ Desafio do checkpoint", pergunta, 4 opções; ao responder → **feedback** (acerto: card verde "Isso mesmo! 🎉 +10 XP" e opção certa marcada ✓; erro: opção do usuário em vermelho ✕, a certa em verde, card âmbar com explicação gentil), CTA "Continuar vídeo ▶".

**B4 · Leitor (PDF/Texto)** — tema sépia (`#FBF3E4`), header sticky (voltar, título, controles A-/A+), barra de progresso de leitura (`#B45309`), texto 19px line-height 1.7, **conceitos-chave** com sublinhado pontilhado verde, FAB do tutor.

**B5 · Chat — Edu** — header (voltar, avatar 🤖 gradiente, "Edu", "● Online · seu tutor", chip de contexto "📹 Frações") · lista de mensagens (aluno: direita, verde, `radius 18 18 5 18`; Edu: esquerda, branca, `18 18 18 5`) · indicador **"digitando"** (3 pontos `dots`) antes da resposta · **respostas rápidas** (chips) · input fixo (textarea + botão enviar ↑ redondo verde). **Offline:** input substituído por "📵 O Edu só está disponível com internet".

**B6 · Revisão SRS** — fundo gradiente suave verde→lilás. Header (X sair, "Revisão de hoje", "X de 3", barra de progresso). **Card frente:** badge de contexto, conceito (display 27px), dica "Pense na resposta…", CTA "Ver resposta 🔄". **Card verso (flip):** resposta, "Como você foi?" e **4 botões de auto-avaliação** mapeando para SM-2:
- 😵 "Não lembrei" — `#FDE7E7`/`#C5292E` — rating 0
- 😓 "Difícil" — `#FEEBD6`/`#B45309` — rating 3
- 😊 "Bom" — `#E4F8EC`/`#15803D` — rating 4
- 🤩 "Fácil ⭐" — sólido `#16A34A`/branco — rating 5

**B7 · Conclusão SRS** — confetti; "Revisão concluída!"; stats (3 cards revisados / +20 XP); "Você verá 3 cards de novo amanhã"; CTA "Voltar ao início 🏠".

**B8 · Perfil** — hero (avatar squircle coral, nome, badge nível EJA, editar) · **stats 2×2** (🔥 streak âmbar / ⭐ XP verde / 📚 módulos azul / ✅ acertos roxo) · **conquistas** grid 4-col (desbloqueadas coloridas / bloqueadas `grayscale(1)` opacity .42) · **certificado** card gradiente verde com QR + "⬇ PDF" + data mono · **configurações** (notificações toggle, downloads offline, tema, privacidade LGPD).

### Tutor

**T1 · Dashboard** — saudação; **4 KPIs** (Total 30 / Ativos 22·73% verde / Em risco 4 em card vermelho / Média XP 240 âmbar) · **Alertas urgentes** (cards com borda-esquerda colorida por risco, avatar, nome, badge de risco, causa principal, "Ver") · **gráfico de engajamento 7 dias** (barras).

**T2 · Lista de alunos** — busca, chips (Todos / Em risco·4 / Ativos) · **grid 2-col** de StudentCards (avatar colorido, nome + badge de risco, nível + "ativo há X" colorido por recência, mini progress da trilha).

**T3 · Aluno individual** — voltar; header (avatar, nome + badge de risco, nível, stats rápidas streak/XP/módulos) · **gráfico de atividade 14 dias** (barras, com nota de queda) · card **"Fatores de risco ativos"** (vermelho) · card **"Conteúdos com dificuldade"** (% de erro).

**T4 · Alertas** — lista (max-width 760) de cards: avatar + nome + badge de risco + data + status (Pendente âmbar / ✓ Contato feito verde) · grid 2-col: **fatores contribuintes** (bullets IA) + **ação sugerida** (IA) | **mensagem sugerida** (template editável em card verde-claro + "📋 Copiar mensagem") · ações "✓ Já fiz contato" (resolve → card esmaece) / "Ignorar". **Estado vazio:** quando todos resolvidos, banner "✅ Nenhum alerta ativo!".

**T5 · Análises** — **donut** de distribuição por nível EJA (conic-gradient, centro com total) + legenda · **engajamento 4 semanas** (barras gradiente) · **conteúdos mais problemáticos** (lista ordenável: título + tipo + barra de % de erro colorida + nº de alunos).

---

## Interactions & Behavior

- **Navegação:** tabs trocam a tela ativa; telas imersivas têm voltar próprio. Toda transição é instantânea (sem animação de rota no protótipo; no app, fade/slide leve ≤150ms opcional).
- **Diagnóstico:** salvar progresso a cada passo (retomar de onde parou). Áudio = press-and-hold com permissão de microfone (tela intermediária se negada). Foto = preview de câmera com guia de enquadramento. Quiz não permite voltar e não revela acerto. Aguardando = mensagens rotativas + auto-avanço.
- **Player:** marcador de checkpoint clicável dispara **auto-pausa → overlay de exercício**. Feedback imediato (<200ms acerto / <1s erro com explicação). YouTube iframe (sem skin custom — o design ao redor é o diferencial). FAB do tutor abre bottom sheet sem cobrir o vídeo por completo.
- **Chat:** efeito typewriter/SSE palavra-a-palavra; estado "Edu está digitando"; offline desabilita input.
- **SRS:** flip frente↔verso (3D rotateY 400ms ease-in-out); os 4 ratings mapeiam para `sm2.ts` (0/3/4/5) e disparam slide para o próximo; última carta → tela de conclusão com XP/streak.
- **Tutor:** resolver alerta move o card para "contato feito" (esmaece) e some dos pendentes; estado vazio quando zerar.
- **Offline:** banner discreto no topo ("📵 Sem conexão — usando conteúdo salvo"); conteúdo não baixado fica bloqueado ("📥 Disponível quando online") e o baixado mostra ✅; exercícios e SRS funcionam offline e sincronizam ao reconectar.
- **prefers-reduced-motion:** desabilitar todas as animações abaixo, mantendo apenas opacity.

### Animações (durações de referência)
| Interação | Animação | Duração |
|---|---|---|
| Botão tap | scale .97→1 | 100ms |
| Card hover (desktop) | shadow + translateY(-2px) | 150ms |
| Flip do SRS | rotateY 3D | 400ms ease-in-out |
| Overlay de exercício | slide-up Y 40px→0 | 300ms |
| Barra de XP | width/scaleX | 600ms ease-out |
| Conquista desbloqueada | scale 0→1.12→1 + confetti | 500ms |
| Streak +1 | pulso scale 1→1.3→1 | 300ms |
| Typewriter tutor | chars 1 a 1 | ~30ms/char |
| Skeleton | shimmer L→R | 1.5s loop |
| Banner offline | slide-down do topo | 200ms |

> No protótipo, animações que **iniciam em opacity:0** foram removidas dos contêineres principais para evitar conteúdo invisível durante captura — no app, use `animation-fill-mode: both` ou `forwards` para que terminem visíveis.

---

## State Management
Estado por contexto (sugestão; alinhar com Zustand/TanStack existentes):
- **Sessão/auth:** já em `src/store/auth.store.ts`.
- **Diagnóstico:** `step (0–6)`, gravações/foto por passo, seleção do quiz, persistido localmente (IndexedDB).
- **Player:** `currentTime`, `checkpoints`, `showExercise`, `selectedAnswer`, `answered`.
- **Chat:** `messages[]`, `isTyping`, stream SSE.
- **SRS:** `queue[]`, `cardIndex`, `flipped`, `ratings` → SM-2 (`src/lib/srs/sm2.ts`) calcula próxima revisão.
- **Gamificação:** `xp`, `level`, `streak`, `achievements[]` (derivar nível/planta do XP).
- **Tutor:** `students[]`, `alerts[]` (com `status`), `kpis`, filtros de lista, `selectedStudent`.
- **Rede:** `isOnline` (banner + bloqueios + fila de sync).
- **Dados:** TanStack Query para recursos, trilha, alunos, alertas, análises (RSC pré-renderiza onde possível — evitar flash de layout vazio; usar **skeletons**, não spinners).

## Gamificação (visual)
Níveis por XP com metáfora de planta: Nível 1 (0–499, semente 🌱, cinza) · 2 (500–999, broto, verde) · 3 (1000–1499, muda 🌿) · 5 (2000–2499, árvore jovem, azul) · 10 (4500+, árvore frondosa 🌳, dourado).
Streak 🔥 muda de cor com os dias: cinza(0)→amarelo(1–6)→laranja(7–13)→vermelho(14–29)→roxo(30+). Conquistas com ícone illustrated/emoji; bloqueadas em `grayscale` opacity .42. Perda de streak = mensagem gentil ("…hoje é um novo começo! 🌱").

## Responsividade
Breakpoints Tailwind padrão. Mobile (<640) = coluna única + bottom nav. Tablet (640–1023) = grid 2-col, side nav estreita. Desktop aluno (≥1024) = side nav 220px, biblioteca 3–4 col, player max-width 960, chat em sidebar direita 320px. Tutor (≥1280) = sidebar 220 + main + painel de detalhe; análises em 3 col. Respeitar `env(safe-area-inset-bottom)` na bottom nav (PWA).

## Assets
Nenhuma imagem real — o protótipo usa **emoji** (gamificação/tipos/avatares) e **placeholders** (área de vídeo escura, preview de câmera, QR do certificado em CSS). No app: thumbnails de vídeo (YouTube), avatares (iniciais como fallback — já no padrão), ícones de UI via **Lucide**. Ícones do PWA (`/icon-192.png`, `/icon-512.png`) ainda precisam ser produzidos (referenciados em `public/manifest.json`).

## Files
- `EducaDigital.dc.html` — protótipo navegável completo (todas as telas + estado + comportamento). Abra em um navegador; use o seletor no topo direito para alternar Aluno/Tutor e o toggle de modo offline. **Referência de design — não é código de produção.**

### Onde implementar no repo (`apps/web/src`)
- Tokens → `tailwind.config.js` (cores/fontes) + `app/globals.css` (vars shadcn). Carregar as 3 fontes via `next/font/google`.
- Telas do aluno → rotas/segmentos em `app/` (onboarding, dashboard, `resource/[id]`, revisão, tutor, perfil).
- Telas do tutor → `app/(tutor)/…`.
- Componentes de produto → `src/components/` (ResourceCard, ExerciseCard, SrsCard, RatingButtons, TutorChat, MessageBubble, InteractivePlayer, CheckpointMarker, XPBar, StreakBadge, AchievementBadge, CertificateCard, RiskAlertCard, StudentCard, MetricCard, OfflineBanner).
- Lógica SRS → `src/lib/srs/sm2.ts` (já existe). Offline → `src/lib/offline/db.ts` (já existe).
