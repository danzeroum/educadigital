import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.gamification import Achievement, Certificate, UserAchievement
from app.models.user import StudentProfile

router = APIRouter()


class GamificationProfile(BaseModel):
    xp_total: int
    level: int
    streak_days: int
    xp_to_next_level: int


class AchievementOut(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    icon_url: str | None
    xp_reward: int
    earned_at: str | None = None
    model_config = {"from_attributes": True}


class CertificateOut(BaseModel):
    id: uuid.UUID
    certificate_type: str
    title: str
    issued_at: str
    pdf_url: str | None
    verification_code: str
    model_config = {"from_attributes": True}


def _xp_for_level(level: int) -> int:
    return level * 500


@router.get("/profile", response_model=GamificationProfile)
async def get_profile(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    return GamificationProfile(
        xp_total=profile.xp_total,
        level=profile.level,
        streak_days=profile.streak_days,
        xp_to_next_level=_xp_for_level(profile.level + 1) - profile.xp_total,
    )


@router.get("/achievements", response_model=list[AchievementOut])
async def list_achievements(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    all_achievements = await db.execute(select(Achievement))
    achievements = all_achievements.scalars().all()

    earned = await db.execute(select(UserAchievement).where(UserAchievement.user_id == user_id))
    earned_map = {ua.achievement_id: ua.earned_at for ua in earned.scalars().all()}

    return [
        AchievementOut(
            id=a.id,
            slug=a.slug,
            name=a.name,
            description=a.description,
            icon_url=a.icon_url,
            xp_reward=a.xp_reward,
            earned_at=earned_map[a.id].isoformat() if a.id in earned_map else None,
        )
        for a in achievements
    ]


@router.get("/certificates", response_model=list[CertificateOut])
async def list_certificates(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Certificate).where(Certificate.user_id == user_id, Certificate.is_valid)
    )
    certs = result.scalars().all()
    return [
        CertificateOut(
            id=c.id,
            certificate_type=c.certificate_type,
            title=c.title,
            issued_at=c.issued_at.isoformat(),
            pdf_url=c.pdf_url,
            verification_code=c.verification_code,
        )
        for c in certs
    ]
