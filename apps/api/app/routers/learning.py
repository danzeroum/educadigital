import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.learning import LearningPath, LearningPathItem, SrsCard

router = APIRouter()


class PathItemOut(BaseModel):
    id: uuid.UUID
    resource_id: uuid.UUID
    item_order: int
    is_required: bool
    status: str
    model_config = {"from_attributes": True}


class LearningPathOut(BaseModel):
    id: uuid.UUID
    title: str
    eja_level: str
    status: str
    total_resources: int
    completed_resources: int
    items: list[PathItemOut] = []
    model_config = {"from_attributes": True}


class SrsCardOut(BaseModel):
    id: uuid.UUID
    concept_label: str
    due_date: date
    resource_id: uuid.UUID | None
    exercise_id: uuid.UUID | None
    model_config = {"from_attributes": True}


class SrsReviewRequest(BaseModel):
    rating: int  # 0-5 (SM-2 scale)


def sm2_next_interval(
    rating: int,
    repetitions: int,
    ease_factor: float,
    interval_days: int,
) -> tuple[int, float, int]:
    """SM-2 algorithm. Returns (new_interval, new_ease_factor, new_repetitions)."""
    if rating < 3:
        new_reps = 0
        new_interval = 1
    else:
        new_reps = repetitions + 1
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval_days * ease_factor)

    new_ef = max(1.3, ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    return new_interval, new_ef, new_reps


@router.get("/path", response_model=LearningPathOut)
async def get_active_path(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.items))
        .where(LearningPath.user_id == user_id, LearningPath.status == "active")
        .order_by(LearningPath.generated_at.desc())
        .limit(1)
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Nenhuma trilha ativa encontrada")
    return path


@router.post("/path/items/{item_id}/complete", status_code=200)
async def complete_item(item_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LearningPathItem).where(LearningPathItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    item.status = "completed"
    item.completed_at = datetime.now(UTC)
    await db.commit()
    return {"status": "completed"}


@router.get("/srs/due-cards", response_model=list[SrsCardOut])
async def get_due_cards(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SrsCard)
        .where(SrsCard.user_id == user_id, SrsCard.due_date <= date.today())
        .limit(20)
    )
    return result.scalars().all()


@router.post("/srs/cards/{card_id}/review")
async def review_card(
    card_id: uuid.UUID,
    body: SrsReviewRequest,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    if not (0 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating deve estar entre 0 e 5")

    result = await db.execute(select(SrsCard).where(SrsCard.id == card_id))
    card = result.scalar_one_or_none()
    if not card or card.user_id != user_id:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")

    new_interval, new_ef, new_reps = sm2_next_interval(
        body.rating,
        card.repetitions,
        float(card.ease_factor),
        card.interval_days,
    )

    card.interval_days = new_interval
    card.ease_factor = new_ef
    card.repetitions = new_reps
    card.last_reviewed_at = datetime.now(UTC)
    card.due_date = date.today().replace(day=date.today().day + new_interval)
    await db.commit()

    return {
        "card_id": str(card_id),
        "next_review_in_days": new_interval,
        "ease_factor": round(new_ef, 2),
    }
