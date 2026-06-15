# EducaDigital — Plano Técnico V1 Produção

## 1. Visão Geral

Plataforma de educação adaptativa para alunos do EJA (Educação de Jovens e Adultos) que:

- Agrega conteúdo público de múltiplas fontes (Khan Academy, YouTube, MEC RED)
- Enriquece cada recurso com IA (transcrição, resumo, exercícios, tags BNCC)
- Personaliza trilhas de aprendizado com spaced repetition e adaptive learning
- Oferece tutor virtual conversacional disponível 24h
- Provê painel preditivo de acompanhamento para educadores

**Stack:** Next.js 14 (PWA) + FastAPI + PostgreSQL + Redis + Celery + Claude/OpenAI

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CAMADA DE CLIENTE                          │
│  Next.js 14 PWA (offline-first via Service Worker + IndexedDB)      │
│  Android 7+ / iOS 14+ / Desktop browsers                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────────────┐
│                         API GATEWAY (Nginx)                         │
│  Rate limiting · TLS termination · Load balancing                   │
└──────┬──────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│                        FastAPI (Python 3.12)                        │
│  /auth /content /diagnostic /learning /tutor /gamification          │
│  /dashboard /ingest                                                  │
│  Async · Pydantic v2 · SQLAlchemy 2.0 async                        │
└──────┬────────────────────────────────────┬────────────────────────-┘
       │                                    │
┌──────▼──────────────┐      ┌─────────────▼──────────────────────────┐
│   PostgreSQL 16      │      │          Celery Workers                │
│   + pgvector         │      │  (Async job queue via Redis)           │
│   (embeddings)       │      │  • AI enrichment pipeline              │
│                      │      │  • Content ingestion                   │
│   Redis 7            │      │  • Spaced repetition scheduler         │
│   (cache + sessions  │      │  • Risk prediction                     │
│    + Celery broker)  │      │  • Certificate generation              │
└──────────────────────┘      └────────────────────────────────────────┘
```

### Princípios Arquiteturais

- **Offline-first:** Service Worker + IndexedDB garante funcionalidade sem internet
- **Async-first:** FastAPI async + Celery para tarefas de IA (não bloquear a API)
- **AI-augmented, não AI-dependent:** toda feature funciona sem IA, IA a melhora
- **Privacy-by-design:** dados mínimos, consentimento explícito, LGPD desde o início
- **Progressive Enhancement:** funciona em Android 7 com 2G, melhora com conectividade

---

## 3. Stack Tecnológica (com justificativas)

### Frontend — `apps/web`

| Lib | Versão | Por quê |
|-----|--------|---------|
| Next.js | 14 (App Router) | SSR/SSG + RSC + PWA via `next-pwa`; melhor DX do ecossistema React |
| TypeScript | 5.x | Type safety end-to-end |
| Tailwind CSS | 3.x | Utilidade; evita CSS bundle grande no PWA |
| shadcn/ui | latest | Componentes acessíveis, não opinionado, ARIA compliant |
| TanStack Query | 5.x | Cache, revalidação, optimistic updates, offline sync |
| Zustand | 4.x | Estado global leve (user session, trailing progress) |
| idb | 8.x | IndexedDB com API promise (offline storage) |
| Workbox | via next-pwa | Service Worker, precaching, background sync |
| React Hook Form | 7.x | Formulários performáticos com Zod validation |
| Zod | 3.x | Schema validation compartilhado com backend |
| Lucide React | latest | Ícones acessíveis e consistentes |
| Recharts | 2.x | Gráficos no painel do tutor (leve, responsivo) |

### Backend — `apps/api`

| Lib | Versão | Por quê |
|-----|--------|---------|
| FastAPI | 0.115.x | Async nativo, OpenAPI automático, Pydantic v2 integrado |
| Python | 3.12 | Performance melhorada, melhor type system |
| SQLAlchemy | 2.0 async | ORM moderno com suporte a asyncpg |
| Alembic | 1.x | Migrations versionadas e reversíveis |
| asyncpg | 0.29.x | Driver PostgreSQL async ultra-rápido |
| redis[asyncio] | 5.x | Cache + rate limiting + pub/sub |
| Celery | 5.x | Task queue para jobs pesados de IA |
| LangChain | 0.3.x | Orquestração de LLM, RAG, chain of thought |
| anthropic | 0.40.x | Claude API (enriquecimento + tutor virtual) |
| openai | 1.x | Whisper STT + fallback |
| Pillow + pytesseract | latest | OCR para PDFs e fotos de escrita |
| httpx | 0.27.x | Cliente HTTP async para connectors externos |
| passlib + bcrypt | latest | Hash de senhas |
| python-jose | 3.x | JWT (access + refresh tokens) |
| pgvector | 0.3.x | Embeddings no PostgreSQL (busca semântica) |
| lightgbm | 4.x | Modelo de predição de evasão (tutor dashboard) |
| scikit-learn | 1.x | Pré-processamento e avaliação do modelo |
| structlog | 24.x | Logging estruturado (JSON → Grafana Loki) |
| sentry-sdk | 2.x | Error tracking em produção |

### Infraestrutura

| Componente | Tecnologia | Uso |
|------------|-----------|-----|
| Banco primário | PostgreSQL 16 + pgvector | Dados relacionais + embeddings |
| Cache + Broker | Redis 7 | Sessions, cache de API, fila Celery |
| Object Storage | MinIO (dev) / S3 (prod) | Vídeos offline, PDFs, áudios, certificados |
| Proxy reverso | Nginx 1.25 | TLS, rate limiting, WebSocket proxy |
| Container | Docker + Compose | Ambiente local e produção |
| CI/CD | GitHub Actions | Testes, linting, build, deploy |
| Monitoramento | Sentry + structlog | Erros + logs estruturados |

---

## 4. Schema do Banco de Dados

### 4.1 Usuários e Autenticação

```sql
-- Tabela central de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,               -- alternativa ao email para EJA
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student', -- student | tutor | admin
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tokens de refresh (invalidação granular)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_fingerprint VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil do estudante (criado após diagnóstico)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    eja_level VARCHAR(50),                  -- EJA_Fundamental_I | EJA_Fundamental_II | EJA_Medio
    learning_style VARCHAR(20),             -- visual | auditory | kinesthetic | mixed
    preferred_media VARCHAR(20),            -- video | text | exercise | mixed
    daily_study_minutes INTEGER DEFAULT 30,
    xp_total INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    streak_last_date DATE,
    lgpd_consented_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil do tutor
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    organization VARCHAR(200),
    max_students INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vínculo tutor-aluno
CREATE TABLE tutor_student_assignments (
    tutor_id UUID NOT NULL REFERENCES users(id),
    student_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tutor_id, student_id)
);
```

### 4.2 Diagnóstico Multimodal

```sql
CREATE TABLE diagnostic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress | completed | abandoned
    audio_url VARCHAR(500),                -- gravação de áudio (S3)
    handwriting_url VARCHAR(500),          -- foto da escrita (S3)
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE diagnostic_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES diagnostic_sessions(id),
    step_type VARCHAR(30) NOT NULL,        -- audio | handwriting | contextual_quiz | reading
    raw_content TEXT,                      -- transcrição, OCR output
    score NUMERIC(5,2),                   -- 0-100
    metadata JSONB NOT NULL DEFAULT '{}', -- scores por dimensão
    processed_at TIMESTAMPTZ
);

CREATE TABLE diagnostic_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL UNIQUE REFERENCES diagnostic_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    eja_level VARCHAR(50) NOT NULL,
    learning_style VARCHAR(20) NOT NULL,
    preferred_media VARCHAR(20) NOT NULL,
    oral_fluency_score NUMERIC(4,2),       -- 0-10
    writing_score NUMERIC(4,2),
    numeracy_score NUMERIC(4,2),
    reading_score NUMERIC(4,2),
    gaps JSONB NOT NULL DEFAULT '[]',      -- competências com gap
    strengths JSONB NOT NULL DEFAULT '[]', -- competências dominadas
    recommended_daily_minutes INTEGER,
    llm_analysis TEXT,                     -- análise completa do LLM
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 Conteúdo e Enriquecimento

```sql
CREATE TABLE content_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,            -- "Khan Academy", "YouTube Edu", etc.
    source_type VARCHAR(30) NOT NULL,      -- api_rest | scraping | rss | upload | manual
    base_url VARCHAR(500),
    auth_config JSONB,                     -- armazenado encriptado
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modelo normalizado central — o "DNA" do conteúdo
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES content_sources(id),
    external_id VARCHAR(500),              -- ID na fonte original
    title VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL,       -- video | text | exercise | game | pdf | audio
    original_url VARCHAR(1000),
    cdn_url VARCHAR(1000),                 -- URL no nosso CDN (S3/MinIO)
    duration_min INTEGER,
    eja_level VARCHAR(50),                 -- EJA_Fundamental_I | II | Medio
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    license VARCHAR(100),                  -- CC-BY-NC-SA, etc.
    author_credit VARCHAR(500),
    thumbnail_url VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | processing | ready | failed
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

-- Enriquecimento gerado por IA (separado para re-enriquecer sem perder original)
CREATE TABLE resource_enrichments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL UNIQUE REFERENCES resources(id) ON DELETE CASCADE,
    transcript TEXT,                       -- transcrição de vídeo/áudio (Whisper)
    summary_basic TEXT,                    -- resumo nível básico
    summary_intermediate TEXT,
    difficulty_score NUMERIC(3,2),         -- 1.0-5.0 (escala IA)
    interactivity_score NUMERIC(3,2),      -- 0.0-1.0
    eja_adequacy_score NUMERIC(3,2),       -- 0.0-1.0 (adequação para público EJA)
    estimated_study_min INTEGER,
    ai_model_used VARCHAR(100),            -- qual modelo gerou
    enriched_at TIMESTAMPTZ,
    enrichment_version INTEGER NOT NULL DEFAULT 1
);

-- Mapeamento BNCC (many-to-many normalizado)
CREATE TABLE resource_bncc_mappings (
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    bncc_code VARCHAR(20) NOT NULL,        -- ex: "EF06MA07"
    confidence NUMERIC(3,2),              -- 0-1 (confiança do mapeamento IA)
    PRIMARY KEY (resource_id, bncc_code)
);

-- Tags de conteúdo
CREATE TABLE resource_tags (
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (resource_id, tag)
);

-- Checkpoints automáticos em vídeos (gerados por IA)
CREATE TABLE video_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    concept_key VARCHAR(300) NOT NULL,    -- conceito identificado pelo LLM
    checkpoint_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercícios gerados por IA para cada recurso
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    checkpoint_id UUID REFERENCES video_checkpoints(id),
    exercise_type VARCHAR(30) NOT NULL,   -- multiple_choice | cloze | open | true_false
    content JSONB NOT NULL,               -- questão, opções, resposta correta, explicação
    difficulty_level INTEGER NOT NULL,    -- 1-5
    bncc_codes JSONB NOT NULL DEFAULT '[]',
    generated_by VARCHAR(100),            -- modelo usado
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 Aprendizado e Progresso

```sql
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    eja_level VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active | completed | paused
    total_resources INTEGER NOT NULL DEFAULT 0,
    completed_resources INTEGER NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learning_path_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id),
    item_order INTEGER NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'locked', -- locked | available | in_progress | completed
    unlocked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE user_resource_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    resource_id UUID NOT NULL REFERENCES resources(id),
    completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0-100
    last_position_seconds INTEGER,         -- para vídeos (retomar de onde parou)
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, resource_id)
);

CREATE TABLE exercise_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    path_item_id UUID REFERENCES learning_path_items(id),
    response JSONB NOT NULL,               -- resposta do aluno
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    feedback TEXT,                         -- feedback personalizado do LLM
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.5 Spaced Repetition (algoritmo SM-2)

```sql
CREATE TABLE srs_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    resource_id UUID REFERENCES resources(id),
    exercise_id UUID REFERENCES exercises(id),
    concept_label VARCHAR(300) NOT NULL,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50, -- SM-2: 1.3-2.5
    repetitions INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE srs_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES srs_cards(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,               -- 0-5 (SM-2: 0=blackout, 5=perfect)
    prev_interval_days INTEGER NOT NULL,
    new_interval_days INTEGER NOT NULL,
    prev_ease_factor NUMERIC(4,2) NOT NULL,
    new_ease_factor NUMERIC(4,2) NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.6 Gamificação

```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),
    xp_reward INTEGER NOT NULL DEFAULT 0,
    condition_type VARCHAR(50) NOT NULL,   -- modules_completed | streak_days | exercises_correct | etc.
    condition_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,               -- pode ser negativo (penalidade rara)
    source_type VARCHAR(50) NOT NULL,      -- exercise_correct | module_complete | streak | etc.
    source_id UUID,                        -- FK para o objeto que gerou o XP
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    certificate_type VARCHAR(50) NOT NULL, -- eja_i | eja_ii | module | achievement
    title VARCHAR(300) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pdf_url VARCHAR(1000),
    verification_code VARCHAR(50) NOT NULL UNIQUE,
    is_valid BOOLEAN NOT NULL DEFAULT true
);
```

### 4.7 Tutor Virtual

```sql
CREATE TABLE tutor_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    resource_id UUID REFERENCES resources(id),
    learning_path_item_id UUID REFERENCES learning_path_items(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

CREATE TABLE tutor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,             -- user | assistant
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.8 Dashboard do Tutor — Predição de Risco

```sql
CREATE TABLE student_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    metric_date DATE NOT NULL,
    resources_accessed INTEGER NOT NULL DEFAULT 0,
    exercises_attempted INTEGER NOT NULL DEFAULT 0,
    exercises_correct INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    tutor_interactions INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, metric_date)
);

CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risk_probability NUMERIC(4,3) NOT NULL,  -- 0.0-1.0
    risk_level VARCHAR(10) NOT NULL,          -- low | medium | high | critical
    contributing_factors JSONB NOT NULL DEFAULT '[]',
    suggested_action TEXT NOT NULL,
    suggested_message TEXT,                   -- texto pronto para o tutor enviar
    tutor_action VARCHAR(30),                 -- pending | dismissed | acted
    tutor_id UUID REFERENCES users(id),
    acted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);
```

---

## 5. Design de API

### Convenções

- Base URL: `/api/v1`
- Autenticação: `Authorization: Bearer <access_token>`
- Paginação: `?page=1&size=20`
- Formato de erro: `{"error": {"code": "RESOURCE_NOT_FOUND", "message": "...", "details": {...}}}`
- Rate limiting: 100 req/min por IP, 300 req/min por usuário autenticado

### 5.1 Auth

```
POST   /auth/register              Cadastro (email ou phone)
POST   /auth/login                 Login → {access_token, refresh_token}
POST   /auth/refresh               Renovar access token
POST   /auth/logout                Revogar refresh token
POST   /auth/request-otp           OTP via SMS (aluno sem email)
POST   /auth/verify-otp            Verificar OTP
```

### 5.2 Diagnóstico Multimodal

```
POST   /diagnostic/start           Iniciar sessão
POST   /diagnostic/submit-audio    Upload áudio (multipart) → job_id
POST   /diagnostic/submit-photo    Upload foto da escrita → job_id
POST   /diagnostic/submit-quiz     Respostas do quiz contextual
POST   /diagnostic/submit-reading  Áudio de resposta à leitura
GET    /diagnostic/status/{id}     Status do job de análise (SSE)
GET    /diagnostic/result/{id}     Resultado completo da sessão
```

### 5.3 Conteúdo

```
GET    /content/resources          Lista com filtros: ?level=EJA_I&type=video&tag=frações
GET    /content/resources/{id}     Detalhe do recurso + enrichments
GET    /content/resources/{id}/exercises  Exercícios do recurso
GET    /content/search?q=          Busca full-text (pgvector semântica)
POST   /content/resources/{id}/progress  Atualizar progresso (completion_pct, position)
GET    /content/resources/{id}/checkpoints  Checkpoints do vídeo com timestamps
```

### 5.4 Trilha de Aprendizado

```
GET    /learning/path              Trilha ativa do usuário
POST   /learning/path/generate     Gerar nova trilha (usa resultado do diagnóstico)
GET    /learning/path/next         Próximo item recomendado
POST   /learning/path/items/{id}/complete  Marcar item como concluído
GET    /learning/history           Histórico de recursos estudados
```

### 5.5 Exercícios e Spaced Repetition

```
POST   /exercises/{id}/respond     Responder exercício
GET    /srs/due-cards              Cartões com revisão pendente hoje
POST   /srs/cards/{id}/review      Registrar revisão (rating 0-5)
GET    /srs/schedule               Calendário de revisões próximas 7 dias
```

### 5.6 Tutor Virtual

```
POST   /tutor/conversations        Criar conversa (contexto: resource_id)
POST   /tutor/conversations/{id}/messages  Enviar mensagem → stream SSE
GET    /tutor/conversations/{id}   Histórico da conversa
```

### 5.7 Gamificação

```
GET    /gamification/profile       XP, nível, streak
GET    /gamification/achievements  Todas achievements + earned_at ou null
GET    /gamification/leaderboard   Top 10 da semana (opcional, opt-in)
GET    /gamification/certificates  Certificados do usuário
GET    /gamification/certificates/{id}/download  PDF do certificado
```

### 5.8 Dashboard do Tutor

```
GET    /dashboard/students         Lista de alunos com métricas de risco
GET    /dashboard/students/{id}    Timeline detalhada de um aluno
GET    /dashboard/risk-alerts      Alertas ativos (filtro: level, status)
POST   /dashboard/risk-alerts/{id}/act  Marcar alerta como tratado
GET    /dashboard/analytics        Métricas agregadas da turma
GET    /dashboard/analytics/hardest-content  Conteúdos com maior taxa de erro
```

### 5.9 Ingestão de Conteúdo

```
POST   /ingest/youtube             Ingerir vídeo do YouTube (url + metadados)
POST   /ingest/resource            Upload manual (PDF, texto)
POST   /ingest/resource/enrich/{id}  Forçar re-enriquecimento
GET    /ingest/jobs/{id}           Status do job de ingestão
GET    /ingest/jobs                Lista de jobs ativos/recentes
```

---

## 6. Pipeline de IA

### 6.1 Fluxo de Enriquecimento de Conteúdo

```
TRIGGER: POST /ingest/youtube → task_id
         Celery worker inicia job assíncrono

PASSO 1 — Download & Extração (worker: content_processor)
  ├─ Vídeo: youtube-dl → extrair áudio MP3
  ├─ PDF: PyMuPDF → texto; se escaneado → Tesseract OCR
  └─ Texto: limpeza HTML, normalização unicode

PASSO 2 — Transcrição (worker: transcription_worker)
  ├─ Áudio < 25MB → Whisper API (OpenAI)
  ├─ Áudio > 25MB → Whisper local via ONNX
  └─ Output: transcrição segmentada com timestamps

PASSO 3 — Enriquecimento LLM (worker: enrichment_worker)
  └─ Prompt estruturado para Claude Sonnet:
     - Classificação EJA level
     - Mapeamento BNCC (RAG: consulta tabela BNCC vetorizada)
     - Score de dificuldade 1-5
     - Score de adequação EJA (0-1)
     - Resumo em 3 versões (básico / intermediário / avançado)
     - 5-10 tags relevantes
     - Estimativa de tempo de estudo

PASSO 4 — Geração de Exercícios (worker: exercise_generator)
  └─ Por recurso: gera 5-8 exercícios variados
     ├─ Para vídeos: 1 questão por checkpoint (múltipla escolha)
     ├─ Para textos: 2-3 cloze tests + 1 questão dissertativa
     └─ Para todos: mapeamento para competências BNCC

PASSO 5 — Indexação (worker: indexer)
  ├─ Embeddings com text-embedding-3-small (pgvector)
  └─ Full-text search PostgreSQL (tsvector pt-BR)

STATUS: resource.status = 'ready' → notificação via webhook
```

### 6.2 Diagnóstico Multimodal

```python
# Orquestração via LangChain (pseudocódigo)
class DiagnosticPipeline:
    async def process(self, session: DiagnosticSession) -> DiagnosticResult:
        
        # Passo 1: Processar áudio
        audio_transcript = await whisper.transcribe(session.audio_url)
        oral_scores = await llm.analyze_orality(audio_transcript)
        
        # Passo 2: Processar escrita manual (OCR)
        handwriting_text = await tesseract.ocr(session.handwriting_url)
        writing_scores = await llm.analyze_writing(handwriting_text)
        
        # Passo 3: Processar quiz contextual
        quiz_scores = calculate_quiz_scores(session.quiz_responses)
        
        # Passo 4: Síntese por LLM
        profile = await llm.synthesize_profile({
            "oral": oral_scores,
            "writing": writing_scores,
            "numeracy": quiz_scores,
            "reading": session.reading_scores,
        })
        
        return DiagnosticResult(
            eja_level=profile.eja_level,
            learning_style=profile.style,       # visual | auditivo | cinestésico
            preferred_media=profile.media,       # video | text | exercise
            gaps=profile.gaps,
            strengths=profile.strengths,
            recommended_daily_minutes=profile.daily_minutes,
        )
```

### 6.3 Geração de Trilha Adaptativa

```python
class LearningPathGenerator:
    async def generate(self, user: User, diagnostic: DiagnosticResult) -> LearningPath:
        
        # 1. Buscar recursos compatíveis (pgvector + filtros)
        candidate_resources = await resource_repo.search(
            eja_level=diagnostic.eja_level,
            preferred_media=diagnostic.preferred_media,
            exclude_bncc_codes=diagnostic.strengths,  # pular o que já sabe
            limit=50,
        )
        
        # 2. LLM ordena e justifica a sequência
        ordered_path = await llm.sequence_resources(
            resources=candidate_resources,
            gaps=diagnostic.gaps,
            profile=diagnostic,
        )
        
        # 3. Criar entidade + agendar SRS cards iniciais
        path = await path_repo.create(user_id=user.id, items=ordered_path)
        await srs_service.schedule_initial_cards(user.id, path)
        
        return path
```

### 6.4 Tutor Virtual (Streaming)

```python
class VirtualTutor:
    async def respond_stream(
        self,
        conversation: TutorConversation,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        
        # Contexto injetado automaticamente
        resource = await resource_repo.get(conversation.resource_id)
        enrichment = await enrichment_repo.get(resource.id)
        history = await message_repo.get_last(conversation.id, limit=10)
        student = await student_repo.get(conversation.user_id)
        
        system_prompt = f"""
        Você é um tutor educacional especializado em EJA (Educação de Jovens e Adultos).
        Seu aluno está estudando: "{resource.title}"
        Nível do aluno: {student.eja_level}
        Transcrição do recurso (contexto): {enrichment.transcript[:2000]}
        
        Regras:
        - Use linguagem simples e acolhedora
        - Nunca dê a resposta diretamente, guie com perguntas
        - Use analogias do cotidiano (trabalho, casa, família)
        - Se o aluno errar, reforce: errar faz parte do aprendizado
        - Responda em pt-BR, máximo 3 parágrafos curtos
        """
        
        async for chunk in anthropic_client.messages.stream(
            model="claude-sonnet-4-6",
            system=system_prompt,
            messages=self._format_history(history, user_message),
            max_tokens=500,
        ):
            yield chunk.delta.text
```

### 6.5 Predição de Risco de Evasão

```python
RISK_FEATURES = [
    "days_since_last_access",
    "engagement_trend_7d",         # slope de regressão linear dos acessos
    "accuracy_rate_last_10",       # % de acerto nos últimos 10 exercícios
    "avg_response_time_ms_7d",     # tempo médio de resposta (cansaço → lentidão)
    "content_variety_7d",          # diversidade de tipos de conteúdo
    "weekly_plan_completion",      # % da meta semanal concluída
    "tutor_interaction_7d",        # pedidos de ajuda ao tutor virtual
    "repeated_error_concept",      # erro no mesmo conceito > 3x
    "streak_broken",               # quebrou streak (boolean)
]

# LightGBM treinado com dados históricos (k-fold cross-validation)
# Inferência diária via Celery beat (scheduled task)
# Threshold: probabilidade > 0.60 → alerta "high", > 0.80 → "critical"
```

---

## 7. Arquitetura Frontend (PWA Offline-First)

### 7.1 Estrutura de Diretórios

```
apps/web/src/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Grupo de rotas sem layout principal
│   │   ├── login/
│   │   ├── register/
│   │   └── diagnostic/            # Fluxo de diagnóstico onboarding
│   ├── (student)/                 # Layout do estudante
│   │   ├── dashboard/             # Tela principal (trilha do dia)
│   │   ├── library/               # Biblioteca de recursos
│   │   ├── resource/[id]/         # Recurso + exercícios + tutor
│   │   ├── review/                # Spaced repetition cards
│   │   └── profile/               # Perfil + conquistas + certificados
│   ├── (tutor)/                   # Portal do tutor
│   │   ├── students/
│   │   ├── alerts/
│   │   └── analytics/
│   ├── layout.tsx                 # Root layout com providers
│   └── manifest.json              # PWA manifest
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── features/
│   │   ├── diagnostic/            # DiagnosticWizard, AudioRecorder, etc.
│   │   ├── video-player/          # InteractiveVideoPlayer + checkpoints
│   │   ├── exercise/              # ExerciseCard, FeedbackToast, etc.
│   │   ├── tutor/                 # TutorChat, MessageBubble, etc.
│   │   ├── gamification/          # XPBar, AchievementCard, Certificate, etc.
│   │   └── dashboard/             # TutorRiskAlert, StudentTimeline, etc.
│   └── layout/                    # Header, Sidebar, BottomNav (mobile)
├── lib/
│   ├── api/                       # API client (typed fetch com TanStack Query)
│   ├── offline/                   # IndexedDB schema + sync logic
│   │   ├── db.ts                  # idb database setup
│   │   ├── sync.ts                # Background sync (Service Worker → API)
│   │   └── mutations.ts           # Optimistic updates
│   ├── auth/                      # Auth context + token management
│   └── srs/                       # SM-2 algorithm (roda offline)
├── store/                         # Zustand stores
│   ├── auth.store.ts
│   ├── player.store.ts            # Estado do video player
│   └── offline.store.ts           # Queue de ações offline
└── service-worker/
    ├── sw.ts                      # Service Worker principal (Workbox)
    └── strategies/                # Caching strategies por rota
```

### 7.2 Estratégia Offline-First

```
RECURSOS QUE FUNCIONAM OFFLINE:
├─ Vídeos (pre-downloaded): IndexedDB → Cache Storage (Blob)
├─ Exercícios pendentes: IndexedDB queue
├─ Respostas SRS: gravadas localmente → sincronizadas quando online
├─ Trilha do aluno: snapshot cacheado (JSON)
└─ Progresso de leitura: localStorage

ESTRATÉGIAS DE CACHE (Workbox):
├─ API calls: Network-First com fallback para cache (5min TTL)
├─ Assets estáticos (JS/CSS): Cache-First
├─ Vídeos download: Background Fetch API
└─ Progresso: Background Sync quando reconectar

CONFLITO DE DADOS:
├─ Respostas de exercícios: timestamp wins (mais recente prevalece)
└─ Progresso: merge max(local, server) — nunca reduz
```

---

## 8. Roadmap V1 Produção — Sprints

### Sprint 0 (3 dias) — Fundação
- [ ] Monorepo Turborepo configurado
- [ ] Docker Compose local (Postgres + Redis + MinIO)
- [ ] CI/CD GitHub Actions (lint + type-check + test)
- [ ] Branches: `main` (produção), `develop` (staging), `feature/*`
- [ ] Secrets management (.env.example completo)
- [ ] Pre-commit hooks: ruff + eslint + prettier

### Sprint 1-2 (2 semanas) — Auth & Usuário
- [ ] Schema inicial de usuários (migration #001)
- [ ] `POST /auth/register` e `POST /auth/login` (JWT)
- [ ] Refresh token com rotação
- [ ] Login via OTP SMS (para alunos sem email)
- [ ] Middleware de autenticação e RBAC (student, tutor, admin)
- [ ] UI: telas de login, cadastro, perfil básico
- [ ] Rate limiting (slowapi)

### Sprint 3-4 (2 semanas) — Pipeline de Conteúdo
- [ ] Schema de content (migration #002)
- [ ] YouTube Data API connector + normalização
- [ ] Celery setup com Redis broker
- [ ] Worker de transcrição Whisper
- [ ] Worker de enriquecimento Claude (resumo, dificuldade, tags)
- [ ] Worker de geração de exercícios
- [ ] `GET /content/resources` + filtros
- [ ] UI: Biblioteca básica de conteúdo

### Sprint 5-6 (2 semanas) — Diagnóstico Multimodal
- [ ] Schema de diagnóstico (migration #003)
- [ ] Fluxo de gravação de áudio (PWA MediaRecorder API)
- [ ] Upload de foto da escrita + OCR (Tesseract)
- [ ] Quiz contextual adaptativo
- [ ] LLM pipeline para síntese de perfil
- [ ] UI: wizard de diagnóstico 5 passos
- [ ] Diagnóstico 100% funcional offline-first

### Sprint 7-8 (2 semanas) — Trilha Adaptativa
- [ ] Schema de learning path + SRS (migration #004)
- [ ] Geração de trilha por LLM pós-diagnóstico
- [ ] SM-2 algorithm (TypeScript para rodar offline)
- [ ] `GET /srs/due-cards` + `POST /srs/cards/{id}/review`
- [ ] Agendador Celery beat para revisões SRS
- [ ] UI: tela principal com trilha do dia + progress bars

### Sprint 9-10 (2 semanas) — Vídeo Interativo + Exercícios
- [ ] YouTube iframe API com checkpoints automáticos
- [ ] Pausa no timestamp → inject ExerciseCard
- [ ] Feedback imediato com explicação do LLM
- [ ] Geração sob demanda de exercícios adicionais
- [ ] Histórico de respostas por usuário
- [ ] UI: player interativo + overlay de exercício

### Sprint 11-12 (2 semanas) — Tutor Virtual + Gamificação
- [ ] SSE streaming para respostas do tutor
- [ ] Contexto automático (recurso + histórico + perfil)
- [ ] Sistema de XP + streak + achievements
- [ ] Geração de certificados PDF (reportlab)
- [ ] Verificação de certificado via QR code
- [ ] UI: chat do tutor + painel de conquistas

### Sprint 13-14 (2 semanas) — PWA + Dashboard do Tutor
- [ ] Service Worker (Workbox) com cache-first
- [ ] Background Sync para ações offline
- [ ] Download de vídeos para offline (Background Fetch API)
- [ ] Portal do tutor: lista de alunos + alertas
- [ ] Motor preditivo LightGBM (treinado com dados sintéticos)
- [ ] `GET /dashboard/risk-alerts` com sugestões de ação
- [ ] Push notifications (Web Push API)

### Sprint 15-16 (2 semanas) — Hardening & Produção
- [ ] Security review: OWASP Top 10, SQL injection, XSS
- [ ] Testes de carga (Locust): 500 usuarios simultâneos
- [ ] Observabilidade: Sentry + structlog JSON + health checks
- [ ] Documentação OpenAPI gerada + Postman collection
- [ ] LGPD: endpoint de exportação e exclusão de dados
- [ ] Revisão de acessibilidade WCAG 2.1 AA
- [ ] Smoke tests de produção

---

## 9. Segurança & LGPD

### Segurança
- Senhas: bcrypt com custo 12
- JWT: RS256 (par de chaves assimétricas), access token 15min, refresh 30 dias
- Refresh token rotation: cada uso invalida o anterior (previne replay)
- Rate limiting: 5 tentativas de login por 15min por IP
- SQL injection: ORM obrigatório, zero raw SQL sem parâmetros
- XSS: CSP headers + sanitização de inputs do tutor virtual
- Uploads: validação de MIME type no servidor, scan antivirus básico
- Secrets: variáveis de ambiente, nunca no código ou logs

### LGPD
- Consentimento granular no cadastro (analytics, WhatsApp, dados biométricos)
- `GET /user/me/export` → JSON com todos os dados do usuário
- `DELETE /user/me` → soft-delete + anonimização em 30 dias
- Logs sem PII: user_id em vez de email nos logs de sistema
- Dados de diagnóstico (áudio, foto) deletados após processamento (7 dias)
- Política de privacidade em linguagem simples (nível EJA)

---

## 10. Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/educadigital
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_PRIVATE_KEY_PATH=/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt_public.pem

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...                    # Whisper fallback
OPENAI_WHISPER_MODEL=whisper-1

# Storage
S3_ENDPOINT=http://minio:9000
S3_BUCKET=educadigital-assets
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# External APIs
YOUTUBE_DATA_API_KEY=AIza...

# Worker
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=INFO

# Feature Flags (desativar features em rollout gradual)
FEATURE_DIAGNOSTIC_ENABLED=true
FEATURE_TUTOR_STREAMING=true
FEATURE_RISK_PREDICTION=false           # ativa na sprint 14
```

---

## 11. Comandos do Dia a Dia

```bash
# Desenvolvimento local
docker compose up -d          # sobe Postgres + Redis + MinIO
cd apps/api && uv run uvicorn app.main:app --reload
cd apps/web && pnpm dev

# Migrations
cd apps/api && uv run alembic upgrade head
cd apps/api && uv run alembic revision --autogenerate -m "add srs tables"

# Workers
cd apps/api && uv run celery -A app.workers.celery_app worker --loglevel=info
cd apps/api && uv run celery -A app.workers.celery_app beat --loglevel=info

# Testes
cd apps/api && uv run pytest tests/ -v --cov=app
cd apps/web && pnpm test

# Linting
cd apps/api && uv run ruff check . && uv run ruff format .
cd apps/web && pnpm lint && pnpm type-check
```

---

## 12. Decisões Técnicas Relevantes

| Decisão | Alternativa considerada | Justificativa |
|---------|------------------------|---------------|
| pgvector em vez de Elasticsearch | Elasticsearch | Menos infra para V1; Elasticsearch entra na V2 se a busca semântica exigir |
| FastAPI em vez de Django | Django REST | Async nativo é crucial para streaming do tutor e jobs de IA |
| SQLAlchemy 2 async em vez de Tortoise ORM | Tortoise, SQLModel | Maturidade, RAW SQL quando necessário, melhor ecossistema |
| Claude Sonnet para enriquecimento | GPT-4o | Melhor relação custo/performance para textos longos em pt-BR |
| Celery em vez de arq/dramatiq | arq | Ecosystem maior, beat scheduler integrado, melhor observabilidade |
| SM-2 em vez de FSRS | FSRS (mais moderno) | SM-2 tem implementação TypeScript simples (roda offline); FSRS entra na V2 |
| Next.js App Router em vez de Pages | Pages Router | RSC = menos JS no bundle = PWA mais leve; crucial para Android 7+ |
| pnpm em vez de npm/yarn | npm, yarn | Disk efficiency em monorepo; Turborepo tem integração nativa |
| uv em vez de pip/poetry | poetry, pip | 10-100x mais rápido; lock file determinístico |
