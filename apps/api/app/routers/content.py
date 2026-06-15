import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.content import Exercise, Resource, ResourceEnrichment, VideoCheckpoint

router = APIRouter()


class ResourceOut(BaseModel):
    id: uuid.UUID
    title: str
    media_type: str
    original_url: str | None
    cdn_url: str | None
    duration_min: int | None
    eja_level: str | None
    language: str
    license: str | None
    thumbnail_url: str | None
    status: str
    difficulty_score: float | None = None
    summary_basic: str | None = None
    tags: list[str] = []
    bncc_codes: list[str] = []

    model_config = {"from_attributes": True}


@router.get("/resources", response_model=list[ResourceOut])
async def list_resources(
    level: str | None = Query(None),
    media_type: str | None = Query(None),
    tag: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Resource)
        .options(
            selectinload(Resource.enrichment),
            selectinload(Resource.tags),
            selectinload(Resource.bncc_mappings),
        )
        .where(Resource.status == "ready")
        .offset((page - 1) * size)
        .limit(size)
    )

    if level:
        query = query.where(Resource.eja_level == level)
    if media_type:
        query = query.where(Resource.media_type == media_type)

    result = await db.execute(query)
    resources = result.scalars().all()

    out = []
    for r in resources:
        enrichment = r.enrichment
        out.append(
            ResourceOut(
                id=r.id,
                title=r.title,
                media_type=r.media_type,
                original_url=r.original_url,
                cdn_url=r.cdn_url,
                duration_min=r.duration_min,
                eja_level=r.eja_level,
                language=r.language,
                license=r.license,
                thumbnail_url=r.thumbnail_url,
                status=r.status,
                difficulty_score=float(enrichment.difficulty_score) if enrichment and enrichment.difficulty_score else None,
                summary_basic=enrichment.summary_basic if enrichment else None,
                tags=[t.tag for t in r.tags],
                bncc_codes=[m.bncc_code for m in r.bncc_mappings],
            )
        )
    return out


@router.get("/resources/{resource_id}", response_model=ResourceOut)
async def get_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resource)
        .options(
            selectinload(Resource.enrichment),
            selectinload(Resource.tags),
            selectinload(Resource.bncc_mappings),
        )
        .where(Resource.id == resource_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")

    enrichment = resource.enrichment
    return ResourceOut(
        id=resource.id,
        title=resource.title,
        media_type=resource.media_type,
        original_url=resource.original_url,
        cdn_url=resource.cdn_url,
        duration_min=resource.duration_min,
        eja_level=resource.eja_level,
        language=resource.language,
        license=resource.license,
        thumbnail_url=resource.thumbnail_url,
        status=resource.status,
        difficulty_score=float(enrichment.difficulty_score) if enrichment and enrichment.difficulty_score else None,
        summary_basic=enrichment.summary_basic if enrichment else None,
        tags=[t.tag for t in resource.tags],
        bncc_codes=[m.bncc_code for m in resource.bncc_mappings],
    )


class CheckpointOut(BaseModel):
    id: uuid.UUID
    timestamp_seconds: int
    concept_key: str
    checkpoint_order: int
    model_config = {"from_attributes": True}


@router.get("/resources/{resource_id}/checkpoints", response_model=list[CheckpointOut])
async def get_checkpoints(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(VideoCheckpoint)
        .where(VideoCheckpoint.resource_id == resource_id)
        .order_by(VideoCheckpoint.checkpoint_order)
    )
    return result.scalars().all()
