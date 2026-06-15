"""
Worker de enriquecimento de conteúdo por IA.

Pipeline:
  1. Transcrição de vídeo/áudio via Whisper
  2. Resumo e análise via Claude
  3. Mapeamento de competências BNCC
  4. Geração de exercícios
  5. Geração de checkpoints para vídeos
"""
import json
import uuid
from datetime import UTC, datetime

import anthropic
import structlog

from app.core.config import settings
from app.workers.celery_app import celery_app

log = structlog.get_logger()

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

ENRICHMENT_PROMPT = """
Você é um especialista em conteúdo educacional para EJA (Educação de Jovens e Adultos).

Analise o seguinte conteúdo educacional e retorne um JSON com os campos abaixo.
Use linguagem acessível para adultos com baixa escolaridade.

CONTEÚDO:
Título: {title}
Tipo: {media_type}
Transcrição/Texto: {content}

Retorne APENAS o JSON, sem markdown, com esta estrutura:
{{
  "eja_level": "EJA_Fundamental_I" | "EJA_Fundamental_II" | "EJA_Medio",
  "difficulty_score": 1.0-5.0,
  "eja_adequacy_score": 0.0-1.0,
  "estimated_study_min": <inteiro>,
  "summary_basic": "<resumo em 3 frases, vocabulário EJA I>",
  "summary_intermediate": "<resumo em 5 frases, vocabulário EJA II>",
  "tags": ["<tag1>", "<tag2>", ...],
  "bncc_codes": [
    {{"code": "EF06MA07", "confidence": 0.9, "reason": "..."}},
    ...
  ]
}}
"""

EXERCISE_PROMPT = """
Crie {count} exercícios educacionais para alunos EJA sobre este conteúdo.
Nível de dificuldade: {difficulty}/5
Use linguagem simples e exemplos do cotidiano.

CONTEÚDO: {content_summary}

Retorne APENAS um JSON array, sem markdown:
[
  {{
    "type": "multiple_choice" | "cloze" | "true_false",
    "question": "<pergunta>",
    "options": ["<a>", "<b>", "<c>", "<d>"],
    "correct_answer": "<a>",
    "explanation": "<explicação clara de por que está correto>",
    "difficulty_level": 1-5,
    "bncc_codes": ["EF06MA07"]
  }}
]
"""

VIDEO_CHECKPOINT_PROMPT = """
Analise esta transcrição de vídeo educacional e identifique os momentos mais importantes
onde um aluno EJA pode ter dificuldade de compreensão.

Para cada momento, indique o timestamp aproximado (em segundos) e o conceito-chave.

Retorne APENAS JSON, sem markdown:
{{
  "checkpoints": [
    {{
      "timestamp_seconds": <inteiro>,
      "concept_key": "<conceito identificado>",
      "order": <1, 2, 3...>
    }}
  ]
}}

Transcrição com timestamps:
{transcript_with_timestamps}
"""


@celery_app.task(name="app.workers.enrichment.enrich_resource", bind=True, max_retries=3)
def enrich_resource(self, resource_id: str):
    """Enriquece um recurso com metadados gerados por IA."""
    import asyncio
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.core.database import AsyncSessionLocal
    from app.models.content import Resource, ResourceEnrichment, ResourceBnccMapping, ResourceTag

    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Resource)
                .options(selectinload(Resource.enrichment))
                .where(Resource.id == uuid.UUID(resource_id))
            )
            resource = result.scalar_one_or_none()
            if not resource:
                log.error("resource_not_found", resource_id=resource_id)
                return

            content_for_analysis = ""
            if resource.enrichment and resource.enrichment.transcript:
                content_for_analysis = resource.enrichment.transcript[:4000]
            elif resource.original_url:
                content_for_analysis = f"URL: {resource.original_url}"

            prompt = ENRICHMENT_PROMPT.format(
                title=resource.title,
                media_type=resource.media_type,
                content=content_for_analysis,
            )

            response = _client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            data = json.loads(response.content[0].text)

            if resource.enrichment:
                enrichment = resource.enrichment
            else:
                enrichment = ResourceEnrichment(resource_id=resource.id)
                db.add(enrichment)

            enrichment.summary_basic = data.get("summary_basic")
            enrichment.summary_intermediate = data.get("summary_intermediate")
            enrichment.difficulty_score = data.get("difficulty_score")
            enrichment.eja_adequacy_score = data.get("eja_adequacy_score")
            enrichment.estimated_study_min = data.get("estimated_study_min")
            enrichment.ai_model_used = "claude-sonnet-4-6"
            enrichment.enriched_at = datetime.now(UTC)

            resource.eja_level = data.get("eja_level")

            for tag in data.get("tags", []):
                db.add(ResourceTag(resource_id=resource.id, tag=tag))

            for bncc in data.get("bncc_codes", []):
                db.add(ResourceBnccMapping(
                    resource_id=resource.id,
                    bncc_code=bncc["code"],
                    confidence=bncc.get("confidence"),
                ))

            resource.status = "ready"
            await db.commit()
            log.info("resource_enriched", resource_id=resource_id, level=resource.eja_level)

    try:
        asyncio.run(_run())
    except Exception as exc:
        log.error("enrichment_failed", resource_id=resource_id, error=str(exc))
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
