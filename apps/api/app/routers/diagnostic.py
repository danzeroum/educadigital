import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.diagnostic import DiagnosticResult, DiagnosticSession
from app.workers.celery_app import celery_app

router = APIRouter()


class StartDiagnosticResponse(BaseModel):
    session_id: uuid.UUID
    message: str


class QuizResponse(BaseModel):
    question_id: str
    answer: str
    response_time_ms: int


class SubmitQuizRequest(BaseModel):
    session_id: uuid.UUID
    responses: list[QuizResponse]


class DiagnosticResultOut(BaseModel):
    session_id: uuid.UUID
    eja_level: str
    learning_style: str
    preferred_media: str
    oral_fluency_score: float | None
    writing_score: float | None
    numeracy_score: float | None
    reading_score: float | None
    gaps: list
    strengths: list
    recommended_daily_minutes: int | None
    model_config = {"from_attributes": True}


@router.post("/start", response_model=StartDiagnosticResponse, status_code=201)
async def start_diagnostic(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    session = DiagnosticSession(user_id=user_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return StartDiagnosticResponse(
        session_id=session.id,
        message="Sessão de diagnóstico iniciada. Envie o áudio para continuar.",
    )


@router.post("/submit-audio")
async def submit_audio(
    session_id: uuid.UUID,
    audio_file: UploadFile,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DiagnosticSession).where(DiagnosticSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    audio_bytes = await audio_file.read()

    # Dispatch async job: upload to S3 + transcribe + analyze
    task = celery_app.send_task(
        "app.workers.diagnostic.process_audio",
        args=[str(session_id), audio_bytes],
    )

    return {"job_id": task.id, "status": "processing"}


@router.post("/submit-photo")
async def submit_photo(
    session_id: uuid.UUID,
    photo_file: UploadFile,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DiagnosticSession).where(DiagnosticSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    photo_bytes = await photo_file.read()

    task = celery_app.send_task(
        "app.workers.diagnostic.process_handwriting",
        args=[str(session_id), photo_bytes],
    )

    return {"job_id": task.id, "status": "processing"}


@router.post("/submit-quiz")
async def submit_quiz(body: SubmitQuizRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DiagnosticSession).where(DiagnosticSession.id == body.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    celery_app.send_task(
        "app.workers.diagnostic.process_quiz",
        args=[str(body.session_id), [r.model_dump() for r in body.responses]],
    )

    return {"status": "processing"}


@router.get("/result/{session_id}", response_model=DiagnosticResultOut)
async def get_result(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DiagnosticResult).where(DiagnosticResult.session_id == session_id)
    )
    diagnostic_result = result.scalar_one_or_none()
    if not diagnostic_result:
        raise HTTPException(status_code=404, detail="Resultado ainda não disponível")
    return diagnostic_result
