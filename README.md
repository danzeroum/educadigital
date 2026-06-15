# EducaDigital

Plataforma de educação adaptativa para alunos do EJA (Educação de Jovens e Adultos). Agrega conteúdo público de múltiplas fontes, enriquece cada recurso com IA, personaliza trilhas de aprendizado e oferece tutor virtual 24h.

---

## Visão Geral

O EJA atende 3,3 milhões de brasileiros que deixaram a escola e precisam de uma segunda chance — mas a maioria desiste antes de concluir. O EducaDigital resolve os três maiores obstáculos:

| Obstáculo | Solução |
|-----------|---------|
| Vergonha de perguntar | Tutor virtual com IA sem julgamento, disponível 24h |
| Falta de internet confiável | PWA offline-first — funciona em Android 7 com 2G |
| Conteúdo desconectado da vida | IA adapta linguagem e usa analogias do cotidiano do aluno |

---

## Funcionalidades V1

- **Diagnóstico Multimodal** — áudio (Whisper STT) + foto da escrita (OCR) + quiz contextual geram perfil do aluno sem "teste assustador"
- **Trilha Adaptativa** — LLM ordena recursos com base nos gaps detectados, pula o que o aluno já domina
- **Spaced Repetition (SM-2)** — roda offline no cliente em TypeScript; sincroniza quando reconectar
- **Vídeo Interativo** — checkpoints gerados por IA pausam o vídeo e injetam exercícios de múltipla escolha
- **Tutor Virtual Streaming** — Claude Sonnet com contexto do recurso + histórico + perfil do aluno (SSE)
- **Gamificação** — XP, streak, conquistas, certificados PDF com QR code verificável
- **Dashboard do Tutor** — alertas preditivos de risco de evasão gerados por Celery Beat diário

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE CLIENTE                          │
│  Next.js 14 PWA  ·  Service Worker (Workbox)  ·  IndexedDB (idb)   │
│  Android 7+ / iOS 14+ / Desktop                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS / SSE
┌─────────────────────────▼───────────────────────────────────────────┐
│                    FastAPI  (Python 3.12)                            │
│  /auth  /content  /diagnostic  /learning  /tutor                    │
│  /gamification  /dashboard  /ingest                                  │
└──────┬────────────────────────────────────┬────────────────────────-┘
       │                                    │
┌──────▼──────────────┐      ┌─────────────▼──────────────────────────┐
│  PostgreSQL 16       │      │          Celery Workers                │
│  + pgvector          │      │  ingestion · enrichment · diagnostic   │
│                      │      │  risk_prediction · srs_scheduler       │
│  Redis 7             │      └────────────────────────────────────────┘
│  (cache + broker)    │
│                      │      ┌─────────────────────────────────────── ┐
│  MinIO / S3          │      │  AI Services                           │
│  (áudios, PDFs,      │      │  Claude Sonnet  ·  Whisper (OpenAI)   │
│   certificados)      │      │  Tesseract OCR  ·  pgvector (RAG)     │
└──────────────────────┘      └────────────────────────────────────────┘
```

---

## Stack

### Backend — `apps/api`

| Tecnologia | Uso |
|------------|-----|
| FastAPI 0.115 | API async com OpenAPI automático |
| Python 3.12 | Runtime com type hints modernos |
| SQLAlchemy 2.0 async | ORM + migrations (Alembic) |
| PostgreSQL 16 + pgvector | Dados relacionais + embeddings |
| Redis 7 | Cache · sessions · broker Celery |
| Celery 5 | Workers async + Beat scheduler |
| Claude (Anthropic) | Enriquecimento · tutor · síntese diagnóstico |
| Whisper (OpenAI) | Transcrição de áudio |
| Tesseract OCR | Leitura de escrita manual |
| LightGBM | Predição de risco de evasão |
| uv | Gerenciador de pacotes Python (100x mais rápido) |

### Frontend — `apps/web`

| Tecnologia | Uso |
|------------|-----|
| Next.js 14 (App Router) | SSR + RSC + PWA via next-pwa |
| TypeScript 5 | Type safety end-to-end |
| Tailwind CSS + shadcn/ui | UI acessível e responsiva |
| TanStack Query 5 | Cache · revalidação · offline sync |
| Zustand 5 | Estado global (auth, player) |
| idb 8 | IndexedDB (recursos offline, fila de exercícios, SRS) |
| Workbox | Service Worker · Background Sync |
| Recharts | Gráficos do dashboard do tutor |

---

## Estrutura do Projeto

```
educadigital/
├── apps/
│   ├── api/                        # Backend FastAPI
│   │   ├── app/
│   │   │   ├── core/               # config · database · security
│   │   │   ├── models/             # SQLAlchemy: user · content · learning
│   │   │   │                       #   diagnostic · gamification · tutor
│   │   │   ├── routers/            # auth · content · diagnostic · learning
│   │   │   │                       #   tutor · gamification · dashboard · ingest
│   │   │   └── workers/            # celery_app · ingestion · enrichment
│   │   │                           #   diagnostic · risk_prediction · srs_scheduler
│   │   ├── alembic/                # Migrations versionadas
│   │   ├── tests/
│   │   ├── pyproject.toml
│   │   └── Dockerfile
│   │
│   └── web/                        # Frontend Next.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/         # login · register · diagnostic (onboarding)
│       │   │   ├── (student)/      # dashboard · library · resource/[id]
│       │   │   │                   #   review (SRS) · profile
│       │   │   └── (tutor)/        # students · alerts · analytics
│       │   ├── components/
│       │   │   ├── features/       # video-player · exercise · tutor
│       │   │   │                   #   gamification · diagnostic · dashboard
│       │   │   └── ui/             # shadcn/ui
│       │   ├── lib/
│       │   │   ├── api/            # cliente tipado com refresh automático
│       │   │   ├── offline/        # IndexedDB schema + sync
│       │   │   └── srs/            # SM-2 (roda 100% offline)
│       │   └── store/              # Zustand: auth · player · offline
│       ├── public/manifest.json    # PWA manifest
│       ├── next.config.js
│       └── Dockerfile
│
├── docker-compose.yml              # Dev local: postgres + redis + minio + api + web
├── turbo.json                      # Monorepo tasks
├── package.json                    # Workspaces root
├── .env.example                    # Template de variáveis de ambiente
├── .github/workflows/ci.yml        # CI: lint + type-check + test + docker build
└── CLAUDE.md                       # Plano técnico completo (12 seções)
```

---

## Quick Start

### Pré-requisitos

- Docker 24+ e Docker Compose V2
- Node.js 20+ e pnpm 9+
- Python 3.12+ e [uv](https://docs.astral.sh/uv/)
- `ffmpeg` e `tesseract` (para workers locais fora do Docker)

### 1. Clonar e configurar variáveis

```bash
git clone https://github.com/danzeroum/educadigital.git
cd educadigital

cp .env.example .env
# Edite .env com suas chaves de API (Anthropic, OpenAI, YouTube)
```

### 2. Gerar chaves JWT

```bash
mkdir -p secrets
openssl genrsa -out secrets/jwt_private.pem 2048
openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem
```

### 3. Subir infraestrutura

```bash
docker compose up -d postgres redis minio
```

### 4. Backend

```bash
cd apps/api

# Instalar dependências
uv sync

# Rodar migrations
uv run alembic upgrade head

# Iniciar API
uv run uvicorn app.main:app --reload --port 8000

# Em outro terminal: workers Celery
uv run celery -A app.workers.celery_app worker --loglevel=info

# Em outro terminal: beat scheduler (tarefas periódicas)
uv run celery -A app.workers.celery_app beat --loglevel=info
```

### 5. Frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

Acesse: `http://localhost:3000`  
Docs da API: `http://localhost:8000/api/docs`

### Ou tudo de uma vez (Docker Compose)

```bash
docker compose up
```

---

## Comandos do Dia a Dia

```bash
# Monorepo
pnpm dev                        # Inicia web + (api manual)
pnpm build                      # Build de todos os apps
pnpm lint                       # Lint de todos os apps
pnpm type-check                 # Type check de todos os apps

# Backend
cd apps/api
uv run alembic revision --autogenerate -m "add srs tables"   # Nova migration
uv run alembic upgrade head                                   # Aplicar migrations
uv run alembic downgrade -1                                   # Reverter última migration
uv run pytest tests/ -v --cov=app                            # Testes com cobertura
uv run ruff check . && uv run ruff format .                  # Lint + format

# Frontend
cd apps/web
pnpm dev                        # Dev server (localhost:3000)
pnpm test                       # Testes unitários (vitest)
pnpm lint                       # ESLint
pnpm type-check                 # tsc --noEmit

# Workers Celery (tarefas manuais)
cd apps/api
uv run celery -A app.workers.celery_app call \
  app.workers.ingestion.ingest_youtube \
  --args='["https://youtu.be/VIDEO_ID", "EJA_Fundamental_I"]'

# Inspecionar fila Celery
uv run celery -A app.workers.celery_app inspect active
uv run celery -A app.workers.celery_app inspect stats
```

---

## API — Endpoints Principais

Base URL: `http://localhost:8000/api/v1`  
Autenticação: `Authorization: Bearer <access_token>`

### Auth

```
POST  /auth/register          Cadastro com email ou telefone
POST  /auth/login             Login → {access_token, refresh_token}
POST  /auth/refresh           Renovar token (rotação automática)
POST  /auth/logout            Revogar refresh token
```

### Diagnóstico Multimodal

```
POST  /diagnostic/start              Iniciar sessão de diagnóstico
POST  /diagnostic/submit-audio       Upload áudio (multipart) → job_id
POST  /diagnostic/submit-photo       Upload foto da escrita → job_id
POST  /diagnostic/submit-quiz        Respostas do quiz contextual
GET   /diagnostic/result/{id}        Resultado completo (após processamento)
```

### Conteúdo

```
GET   /content/resources             Lista com filtros: ?level=EJA_I&type=video
GET   /content/resources/{id}        Recurso + enrichments + tags + BNCC
GET   /content/resources/{id}/checkpoints  Checkpoints do vídeo com timestamps
GET   /content/search?q=             Busca semântica (pgvector)
POST  /content/resources/{id}/progress    Atualizar progresso (% + posição)
```

### Trilha Adaptativa + SRS

```
GET   /learning/path                 Trilha ativa do usuário
POST  /learning/path/generate        Gerar trilha pós-diagnóstico (LLM)
GET   /learning/path/next            Próximo recurso recomendado
POST  /learning/path/items/{id}/complete   Marcar concluído
GET   /learning/srs/due-cards        Cartões com revisão pendente hoje
POST  /learning/srs/cards/{id}/review    Rating 0-5 → SM-2 calcula próxima revisão
```

### Tutor Virtual

```
POST  /tutor/conversations                     Criar conversa (contexto: resource_id)
POST  /tutor/conversations/{id}/messages       Mensagem → stream SSE
GET   /tutor/conversations/{id}                Histórico da conversa
```

### Gamificação

```
GET   /gamification/profile          XP · nível · streak
GET   /gamification/achievements     Todas + earned_at (ou null)
GET   /gamification/certificates     Certificados do usuário
GET   /gamification/certificates/{id}/download  PDF do certificado
```

### Dashboard do Tutor

```
GET   /dashboard/students                    Alunos com métricas de risco
GET   /dashboard/risk-alerts                 Alertas ativos (filtro: level, status)
POST  /dashboard/risk-alerts/{id}/act        Marcar alerta como tratado
GET   /dashboard/analytics                   Métricas agregadas da turma
```

### Ingestão

```
POST  /ingest/youtube          Ingerir vídeo do YouTube → job_id
POST  /ingest/resource         Upload manual (PDF, texto)
GET   /ingest/jobs/{id}        Status do job de ingestão
```

---

## Pipeline de IA

### Ingestão de Conteúdo

```
POST /ingest/youtube
  └── Celery: ingest_youtube
        ├── YouTube Data API v3 → metadados
        ├── yt-dlp → download áudio MP3
        ├── Whisper API → transcrição segmentada
        └── Claude Sonnet → enriquecimento:
              • Classificação EJA level
              • Mapeamento BNCC (RAG com tabela vetorizada)
              • Score de dificuldade (1-5) e adequação EJA (0-1)
              • Resumo em 2 versões (básico / intermediário)
              • 5-10 tags relevantes
              • Checkpoints de vídeo com timestamps
              • 5-8 exercícios gerados automaticamente
```

### Diagnóstico Multimodal

```
Sessão de ~10 minutos (sem "teste assustador"):
  ├── Áudio: Whisper transcreve → Claude analisa fluência oral
  ├── Foto da escrita: Tesseract OCR → análise de ortografia e estrutura
  ├── Quiz contextual: situações reais (troco, preços, receita)
  └── Síntese LLM: gera perfil com nível EJA · estilo · gaps · pontos fortes
```

### Predição de Risco (Celery Beat 02h00)

```
Features coletadas dos últimos 7 dias:
  • Dias sem acessar  •  Tendência de engajamento (slope linear)
  •  Taxa de acerto   •  Variedade de conteúdo consumido
  •  Conclusão do plano semanal  •  Interações com o tutor

Score > 0.40 → alerta medium  |  > 0.60 → high  |  > 0.80 → critical
Sugestão de mensagem WhatsApp gerada automaticamente para o tutor
```

---

## Offline-First

O PWA funciona completamente sem internet para as ações mais críticas:

| Funcionalidade | Comportamento offline |
|---------------|----------------------|
| Recursos baixados | Cache Storage (Blob) via Background Fetch API |
| Exercícios | Fila no IndexedDB → sincroniza quando reconectar |
| Revisões SRS | Calculadas localmente (SM-2 em TypeScript) → sync posterior |
| Trilha do aluno | Snapshot em IndexedDB (atualizado a cada sync) |
| Tutor virtual | Indisponível offline (requer LLM) — mensagem clara ao usuário |

**Estratégias Workbox:**
- API calls → Network-First com fallback (TTL 5min)
- Assets estáticos → Cache-First (imutáveis pelo hash)
- Progresso e respostas → Background Sync na reconexão

---

## Banco de Dados

Schema completo documentado em [`CLAUDE.md`](./CLAUDE.md). Tabelas principais:

```
users                     Usuários (aluno | tutor | admin)
student_profiles          Nível EJA · estilo · XP · streak
content_sources           Fontes: YouTube · MEC RED · upload
resources                 DNA do conteúdo (normalizado)
resource_enrichments      Enriquecimento IA (separado para re-processar)
resource_bncc_mappings    Competências BNCC com score de confiança
video_checkpoints         Timestamps de conceitos-chave (gerados por IA)
exercises                 Exercícios gerados (multiple_choice | cloze | open)
diagnostic_sessions       Sessões de diagnóstico multimodal
diagnostic_results        Perfil sintetizado pelo LLM
learning_paths            Trilha personalizada por aluno
srs_cards                 Cartões SM-2 por aluno
risk_alerts               Alertas preditivos para tutores
tutor_conversations       Conversas com o tutor virtual
```

---

## Segurança

- **Senhas:** bcrypt custo 12
- **JWT:** RS256 (chaves assimétricas), access token 15min, refresh 30 dias
- **Refresh token rotation:** cada uso invalida o anterior (previne replay attack)
- **Rate limiting:** 5 tentativas de login por IP / 15min (slowapi)
- **SQL injection:** ORM obrigatório em todo o código (zero raw SQL sem parâmetros)
- **XSS:** CSP headers + sanitização de inputs do tutor virtual
- **Uploads:** validação de MIME type no servidor + limite de 50MB
- **Secrets:** apenas em variáveis de ambiente, nunca no código ou logs

---

## LGPD

- Consentimento granular no cadastro (analytics, WhatsApp, dados biométricos)
- `GET /user/me/export` → JSON com todos os dados do usuário
- `DELETE /user/me` → soft-delete + anonimização em 30 dias
- Logs sem PII: `user_id` em vez de email nos logs de sistema
- Dados de diagnóstico (áudio, foto) deletados após processamento (7 dias)

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`):

```
Push para qualquer branch:
  api-lint-test
    └── ruff check + ruff format + mypy + pytest (com Postgres e Redis reais)
  web-lint-typecheck
    └── tsc --noEmit + eslint + vitest

Push para main / develop:
  docker-build
    └── docker build apps/api + apps/web (valida que as imagens sobem)
```

Cobertura de testes publicada no Codecov.

---

## Roadmap

| Sprint | Duração | Entrega |
|--------|---------|---------|
| Sprint 0 | 3 dias | Fundação: monorepo, Docker, CI/CD |
| Sprint 1-2 | 2 sem | Auth completo: JWT, OTP SMS, RBAC |
| Sprint 3-4 | 2 sem | Pipeline de conteúdo: YouTube + AI enrichment |
| Sprint 5-6 | 2 sem | Diagnóstico Multimodal |
| Sprint 7-8 | 2 sem | Trilha Adaptativa + Spaced Repetition |
| Sprint 9-10 | 2 sem | Vídeo Interativo + Exercícios automáticos |
| Sprint 11-12 | 2 sem | Tutor Virtual streaming + Gamificação |
| Sprint 13-14 | 2 sem | PWA offline + Dashboard preditivo do tutor |
| Sprint 15-16 | 2 sem | Hardening, load test, LGPD, WCAG 2.1 AA |

**Total estimado: 8 meses para V1 em produção.**

Detalhe completo de cada sprint em [`CLAUDE.md`](./CLAUDE.md).

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
# Banco
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/educadigital
REDIS_URL=redis://localhost:6379/0

# Auth (gerado com openssl genrsa)
JWT_PRIVATE_KEY_PATH=./secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt_public.pem

# IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...         # Whisper

# Storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=educadigital-assets

# APIs externas
YOUTUBE_DATA_API_KEY=AIza...

# Feature flags
FEATURE_DIAGNOSTIC_ENABLED=true
FEATURE_TUTOR_STREAMING=true
FEATURE_RISK_PREDICTION=false   # ativa no sprint 14
```

---

## Contribuindo

```
main        → produção (deploy automático)
develop     → staging (integração contínua)
feature/*   → novas features (PR para develop)
fix/*       → correções (PR para develop)
```

1. Crie sua branch a partir de `develop`
2. Siga o padrão de commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
3. Garanta que `pnpm lint` e `pytest` passam antes do PR
4. PRs sem testes para lógica nova serão pedidos para revisar

---

## Licença

Proprietário — todos os direitos reservados. Código-fonte destinado ao desenvolvimento interno.

---

*Dúvidas técnicas? Consulte [`CLAUDE.md`](./CLAUDE.md) para a documentação arquitetural completa.*
