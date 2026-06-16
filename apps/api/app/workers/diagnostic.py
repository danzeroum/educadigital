"""Worker de processamento do diagnóstico multimodal."""

import json
import uuid
from datetime import UTC, datetime

import structlog

from app.workers.celery_app import celery_app

log = structlog.get_logger()

DIAGNOSTIC_SYNTHESIS_PROMPT = """
Você é um pedagogo especialista em EJA. Analise os dados do diagnóstico multimodal e
crie um perfil completo do aluno.

DADOS COLETADOS:
- Fluência oral: {oral_score}/10
- Escrita: {writing_score}/10
- Raciocínio numérico: {numeracy_score}/10
- Compreensão de leitura: {reading_score}/10
- Transcrição de áudio: "{audio_transcript}"
- Texto escrito (OCR): "{handwriting_text}"

INSTRUÇÕES:
1. Determine o nível EJA mais adequado: EJA_Fundamental_I, EJA_Fundamental_II ou EJA_Medio
2. Identifique o estilo de aprendizagem predominante: visual, auditory, kinesthetic ou mixed
3. Identifique a mídia preferida: video, text, exercise ou mixed
4. Liste os GAPS (competências a desenvolver) como códigos BNCC
5. Liste os PONTOS FORTES (competências já demonstradas)
6. Recomende quantos minutos diários de estudo são realistas para este perfil

Retorne APENAS JSON:
{{
  "eja_level": "EJA_Fundamental_I|EJA_Fundamental_II|EJA_Medio",
  "learning_style": "visual|auditory|kinesthetic|mixed",
  "preferred_media": "video|text|exercise|mixed",
  "gaps": ["EF01LP01", "EF01MA01"],
  "strengths": ["EF01CI01"],
  "recommended_daily_minutes": 30,
  "justification": "Breve explicação para o tutor (2-3 frases)"
}}
"""


@celery_app.task(name="app.workers.diagnostic.process_audio", bind=True, max_retries=2)
def process_audio(self, session_id: str, audio_bytes: bytes):
    """Transcreve e analisa áudio do diagnóstico."""
    import asyncio
    import os
    import tempfile

    from openai import OpenAI

    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.models.diagnostic import DiagnosticResponse

    async def _run():
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            with open(tmp_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model=settings.OPENAI_WHISPER_MODEL,
                    file=audio_file,
                    language="pt",
                    response_format="text",
                )
        finally:
            os.unlink(tmp_path)

        oral_score = _score_orality(transcript)

        async with AsyncSessionLocal() as db:
            response = DiagnosticResponse(
                session_id=uuid.UUID(session_id),
                step_type="audio",
                raw_content=transcript,
                score=oral_score,
                step_metadata={"oral_score": oral_score},
                processed_at=datetime.now(UTC),
            )
            db.add(response)
            await db.commit()

        _check_and_synthesize(session_id)

    try:
        asyncio.run(_run())
    except Exception as exc:
        log.error("process_audio_failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc, countdown=30)


def _score_orality(transcript: str) -> float:
    """Score simples baseado em comprimento e vocabulário."""
    words = transcript.split()
    unique_ratio = len(set(words)) / max(len(words), 1)
    length_score = min(len(words) / 50, 1.0)
    return round((unique_ratio * 0.4 + length_score * 0.6) * 10, 2)


@celery_app.task(name="app.workers.diagnostic.process_handwriting", bind=True, max_retries=2)
def process_handwriting(self, session_id: str, photo_bytes: bytes):
    """OCR e análise da escrita manual."""
    import asyncio
    import io

    import pytesseract
    from PIL import Image

    from app.core.database import AsyncSessionLocal
    from app.models.diagnostic import DiagnosticResponse

    async def _run():
        image = Image.open(io.BytesIO(photo_bytes))
        text = pytesseract.image_to_string(image, lang="por")

        writing_score = _score_writing(text)

        async with AsyncSessionLocal() as db:
            response = DiagnosticResponse(
                session_id=uuid.UUID(session_id),
                step_type="handwriting",
                raw_content=text,
                score=writing_score,
                step_metadata={"writing_score": writing_score, "word_count": len(text.split())},
                processed_at=datetime.now(UTC),
            )
            db.add(response)
            await db.commit()

        _check_and_synthesize(session_id)

    try:
        asyncio.run(_run())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


def _score_writing(text: str) -> float:
    words = text.strip().split()
    if not words:
        return 0.0
    return min(len(words) / 20, 1.0) * 10


@celery_app.task(name="app.workers.diagnostic.process_quiz")
def process_quiz(session_id: str, responses: list[dict]):
    """Processa respostas do quiz contextual."""
    import asyncio

    from app.core.database import AsyncSessionLocal
    from app.models.diagnostic import DiagnosticResponse

    async def _run():
        correct = sum(1 for r in responses if r.get("is_correct"))
        score = (correct / len(responses)) * 10 if responses else 0.0

        async with AsyncSessionLocal() as db:
            response = DiagnosticResponse(
                session_id=uuid.UUID(session_id),
                step_type="contextual_quiz",
                score=score,
                step_metadata={
                    "total_questions": len(responses),
                    "correct": correct,
                    "avg_response_time_ms": sum(r.get("response_time_ms", 0) for r in responses)
                    // max(len(responses), 1),
                },
                processed_at=datetime.now(UTC),
            )
            db.add(response)
            await db.commit()

        _check_and_synthesize(session_id)

    asyncio.run(_run())


def _check_and_synthesize(session_id: str):
    """Se todas as etapas foram processadas, dispara síntese final."""
    import asyncio

    from sqlalchemy import func, select

    from app.core.database import AsyncSessionLocal
    from app.models.diagnostic import DiagnosticResponse

    async def _check():
        async with AsyncSessionLocal() as db:
            count = await db.execute(
                select(func.count(DiagnosticResponse.id)).where(
                    DiagnosticResponse.session_id == uuid.UUID(session_id)
                )
            )
            if (count.scalar() or 0) >= 3:
                celery_app.send_task(
                    "app.workers.diagnostic.synthesize_diagnostic",
                    args=[session_id],
                )

    asyncio.run(_check())


@celery_app.task(name="app.workers.diagnostic.synthesize_diagnostic", bind=True, max_retries=2)
def synthesize_diagnostic(self, session_id: str):
    """Sintetiza todos os dados do diagnóstico via LLM."""
    import asyncio

    import anthropic
    from sqlalchemy import select

    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.models.diagnostic import DiagnosticResponse, DiagnosticResult, DiagnosticSession

    async def _run():
        async with AsyncSessionLocal() as db:
            responses = await db.execute(
                select(DiagnosticResponse).where(
                    DiagnosticResponse.session_id == uuid.UUID(session_id)
                )
            )
            responses_list = responses.scalars().all()

            scores = {
                r.step_type: (r.score or 0, r.raw_content or "", r.step_metadata)
                for r in responses_list
            }
            audio_score, audio_transcript, _ = scores.get("audio", (0, "", {}))
            writing_score, handwriting_text, _ = scores.get("handwriting", (0, "", {}))
            numeracy_score = scores.get("contextual_quiz", (0, "", {}))[0]
            reading_score = scores.get("reading", (0, "", {}))[0]

            prompt = DIAGNOSTIC_SYNTHESIS_PROMPT.format(
                oral_score=audio_score,
                writing_score=writing_score,
                numeracy_score=numeracy_score,
                reading_score=reading_score,
                audio_transcript=audio_transcript[:500],
                handwriting_text=handwriting_text[:300],
            )

            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}],
            )
            data = json.loads(response.content[0].text)  # type: ignore[union-attr]

            session_result = await db.execute(
                select(DiagnosticSession).where(DiagnosticSession.id == uuid.UUID(session_id))
            )
            session = session_result.scalar_one()

            result = DiagnosticResult(
                session_id=uuid.UUID(session_id),
                user_id=session.user_id,
                eja_level=data["eja_level"],
                learning_style=data["learning_style"],
                preferred_media=data["preferred_media"],
                oral_fluency_score=audio_score,
                writing_score=writing_score,
                numeracy_score=numeracy_score,
                reading_score=reading_score,
                gaps=data.get("gaps", []),
                strengths=data.get("strengths", []),
                recommended_daily_minutes=data.get("recommended_daily_minutes", 30),
                llm_analysis=data.get("justification"),
            )
            db.add(result)
            session.status = "completed"
            session.completed_at = datetime.now(UTC)
            await db.commit()

        log.info("diagnostic_synthesized", session_id=session_id, level=data["eja_level"])

    try:
        asyncio.run(_run())
    except Exception as exc:
        log.error("synthesize_failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc, countdown=60)
