import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.workers.celery_app import celery_app

router = APIRouter()


class YouTubeIngestRequest(BaseModel):
    youtube_url: str
    eja_level: str | None = None
    force_reenrich: bool = False


class IngestJobResponse(BaseModel):
    job_id: str
    resource_id: uuid.UUID | None = None
    status: str
    message: str


@router.post("/youtube", response_model=IngestJobResponse, status_code=202)
async def ingest_youtube(
    body: YouTubeIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    if "youtube.com" not in body.youtube_url and "youtu.be" not in body.youtube_url:
        raise HTTPException(status_code=400, detail="URL do YouTube inválida")

    task = celery_app.send_task(
        "app.workers.ingestion.ingest_youtube",
        args=[body.youtube_url, body.eja_level],
    )

    return IngestJobResponse(
        job_id=task.id,
        status="queued",
        message="Ingestão em fila. Use GET /ingest/jobs/{job_id} para acompanhar.",
    )


@router.post("/resource", response_model=IngestJobResponse, status_code=202)
async def ingest_resource(
    file: UploadFile,
    title: str,
    eja_level: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    allowed_types = ["application/pdf", "text/plain", "application/msword"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo não suportado: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 50MB)")

    task = celery_app.send_task(
        "app.workers.ingestion.ingest_file",
        args=[file_bytes, file.filename, file.content_type, title, eja_level],
    )

    return IngestJobResponse(
        job_id=task.id,
        status="queued",
        message="Upload em fila. Use GET /ingest/jobs/{job_id} para acompanhar.",
    )


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    result = celery_app.AsyncResult(job_id)
    return {
        "job_id": job_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }
