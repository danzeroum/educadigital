"""
Worker de ingestão de conteúdo de fontes externas.
Suporta: YouTube, upload de arquivo (PDF/texto)
"""
import uuid
from datetime import UTC, datetime

import httpx
import structlog

from app.workers.celery_app import celery_app

log = structlog.get_logger()

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


@celery_app.task(name="app.workers.ingestion.ingest_youtube", bind=True, max_retries=3)
def ingest_youtube(self, youtube_url: str, eja_level: str | None = None):
    """
    Ingere um vídeo do YouTube:
    1. Extrai metadados via YouTube Data API
    2. Cria registro Resource
    3. Baixa áudio e transcreve via Whisper
    4. Dispara enriquecimento por IA
    """
    import asyncio
    import re
    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.models.content import ContentSource, Resource, ResourceEnrichment

    async def _run():
        video_id_match = re.search(r"(?:v=|youtu\.be/)([^&\s]+)", youtube_url)
        if not video_id_match:
            raise ValueError(f"Não foi possível extrair video_id de: {youtube_url}")

        video_id = video_id_match.group(1)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{YOUTUBE_API_BASE}/videos",
                params={
                    "id": video_id,
                    "part": "snippet,contentDetails",
                    "key": settings.YOUTUBE_DATA_API_KEY,
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("items"):
            raise ValueError(f"Vídeo não encontrado: {video_id}")

        item = data["items"][0]
        snippet = item["snippet"]

        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            yt_source = await db.execute(
                select(ContentSource).where(ContentSource.name == "YouTube")
            )
            source = yt_source.scalar_one_or_none()
            if not source:
                source = ContentSource(
                    name="YouTube",
                    source_type="api_rest",
                    base_url="https://www.youtube.com",
                )
                db.add(source)
                await db.flush()

            resource = Resource(
                source_id=source.id,
                external_id=video_id,
                title=snippet["title"],
                media_type="video",
                original_url=youtube_url,
                thumbnail_url=snippet.get("thumbnails", {}).get("medium", {}).get("url"),
                eja_level=eja_level,
                license="YouTube Standard",
                author_credit=snippet.get("channelTitle"),
                status="processing",
            )
            db.add(resource)
            await db.flush()
            resource_id = str(resource.id)
            await db.commit()

        celery_app.send_task(
            "app.workers.ingestion.transcribe_youtube_audio",
            args=[resource_id, video_id],
        )

        return {"resource_id": resource_id, "status": "processing"}

    import asyncio
    try:
        return asyncio.run(_run())
    except Exception as exc:
        log.error("ingest_youtube_failed", url=youtube_url, error=str(exc))
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))


@celery_app.task(name="app.workers.ingestion.transcribe_youtube_audio", bind=True, max_retries=2)
def transcribe_youtube_audio(self, resource_id: str, video_id: str):
    """Baixa áudio do YouTube e transcreve com Whisper."""
    import asyncio
    import tempfile
    import os
    import yt_dlp
    from openai import OpenAI
    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.models.content import Resource, ResourceEnrichment
    from sqlalchemy import select

    async def _save_transcript(transcript_text: str):
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Resource).where(Resource.id == uuid.UUID(resource_id))
            )
            resource = result.scalar_one()

            enrichment = ResourceEnrichment(
                resource_id=resource.id,
                transcript=transcript_text,
            )
            db.add(enrichment)
            await db.commit()

        celery_app.send_task("app.workers.enrichment.enrich_resource", args=[resource_id])

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            audio_path = os.path.join(tmpdir, "audio.mp3")
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": os.path.join(tmpdir, "audio.%(ext)s"),
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "64",
                }],
                "quiet": True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            with open(audio_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model=settings.OPENAI_WHISPER_MODEL,
                    file=audio_file,
                    language="pt",
                    response_format="text",
                )

        asyncio.run(_save_transcript(transcript))
        return {"resource_id": resource_id, "status": "transcribed"}

    except Exception as exc:
        log.error("transcription_failed", resource_id=resource_id, error=str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.workers.ingestion.ingest_file", bind=True, max_retries=2)
def ingest_file(
    self,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    title: str,
    eja_level: str | None,
):
    """Ingere um arquivo PDF ou texto."""
    import asyncio
    import io
    from app.core.database import AsyncSessionLocal
    from app.models.content import ContentSource, Resource, ResourceEnrichment
    from sqlalchemy import select

    async def _run():
        text_content = ""
        if content_type == "application/pdf":
            import fitz
            doc = fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf")
            text_content = "\n".join(page.get_text() for page in doc)
        else:
            text_content = file_bytes.decode("utf-8", errors="replace")

        async with AsyncSessionLocal() as db:
            manual_source = await db.execute(
                select(ContentSource).where(ContentSource.name == "Upload Manual")
            )
            source = manual_source.scalar_one_or_none()
            if not source:
                source = ContentSource(name="Upload Manual", source_type="upload")
                db.add(source)
                await db.flush()

            resource = Resource(
                source_id=source.id,
                title=title,
                media_type="pdf" if content_type == "application/pdf" else "text",
                eja_level=eja_level,
                status="processing",
            )
            db.add(resource)
            await db.flush()

            enrichment = ResourceEnrichment(
                resource_id=resource.id,
                transcript=text_content[:10000],
            )
            db.add(enrichment)
            resource_id = str(resource.id)
            await db.commit()

        celery_app.send_task("app.workers.enrichment.enrich_resource", args=[resource_id])
        return {"resource_id": resource_id}

    try:
        return asyncio.run(_run())
    except Exception as exc:
        log.error("ingest_file_failed", filename=filename, error=str(exc))
        raise self.retry(exc=exc, countdown=30)
