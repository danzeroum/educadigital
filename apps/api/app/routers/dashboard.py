import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.tutor import RiskAlert, StudentDailyMetrics
from app.models.user import StudentProfile, TutorStudentAssignment

router = APIRouter()


class StudentSummary(BaseModel):
    user_id: uuid.UUID
    display_name: str
    eja_level: str | None
    streak_days: int
    risk_level: str | None = None
    risk_probability: float | None = None
    last_access: date | None = None


class RiskAlertOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    risk_level: str
    risk_probability: float
    contributing_factors: list
    suggested_action: str
    suggested_message: str | None
    generated_at: str
    tutor_action: str | None


class ClassroomAnalytics(BaseModel):
    total_students: int
    active_last_7d: int
    avg_completion_rate: float
    at_risk_count: int
    engagement_rate: float


@router.get("/students", response_model=list[StudentSummary])
async def list_students(tutor_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    assignments = await db.execute(
        select(TutorStudentAssignment).where(TutorStudentAssignment.tutor_id == tutor_id)
    )
    student_ids = [a.student_id for a in assignments.scalars().all()]

    if not student_ids:
        return []

    profiles = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id.in_(student_ids))
    )

    alerts = await db.execute(
        select(RiskAlert)
        .where(
            RiskAlert.user_id.in_(student_ids),
            RiskAlert.tutor_action.is_(None),
        )
        .order_by(RiskAlert.risk_probability.desc())
    )
    alert_map = {a.user_id: a for a in alerts.scalars().all()}

    result = []
    for profile in profiles.scalars().all():
        alert = alert_map.get(profile.user_id)
        result.append(
            StudentSummary(
                user_id=profile.user_id,
                display_name=profile.display_name,
                eja_level=profile.eja_level,
                streak_days=profile.streak_days,
                risk_level=alert.risk_level if alert else None,
                risk_probability=float(alert.risk_probability) if alert else None,
            )
        )

    return sorted(result, key=lambda s: s.risk_probability or 0, reverse=True)


@router.get("/risk-alerts", response_model=list[RiskAlertOut])
async def list_risk_alerts(
    tutor_id: uuid.UUID,
    level: str | None = Query(None),
    status: str | None = Query(None, alias="alert_status"),
    db: AsyncSession = Depends(get_db),
):
    assignments = await db.execute(
        select(TutorStudentAssignment).where(TutorStudentAssignment.tutor_id == tutor_id)
    )
    student_ids = [a.student_id for a in assignments.scalars().all()]

    query = select(RiskAlert).where(RiskAlert.user_id.in_(student_ids))
    if level:
        query = query.where(RiskAlert.risk_level == level)
    if status == "pending":
        query = query.where(RiskAlert.tutor_action.is_(None))
    elif status == "acted":
        query = query.where(RiskAlert.tutor_action.is_not(None))

    result = await db.execute(query.order_by(RiskAlert.risk_probability.desc()).limit(50))
    alerts = result.scalars().all()

    return [
        RiskAlertOut(
            id=a.id,
            user_id=a.user_id,
            risk_level=a.risk_level,
            risk_probability=float(a.risk_probability),
            contributing_factors=a.contributing_factors,
            suggested_action=a.suggested_action,
            suggested_message=a.suggested_message,
            generated_at=a.generated_at.isoformat(),
            tutor_action=a.tutor_action,
        )
        for a in alerts
    ]


@router.post("/risk-alerts/{alert_id}/act", status_code=200)
async def act_on_alert(
    alert_id: uuid.UUID,
    tutor_id: uuid.UUID,
    action: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    from datetime import UTC, datetime

    result = await db.execute(select(RiskAlert).where(RiskAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alerta não encontrado"}

    alert.tutor_action = action
    alert.tutor_id = tutor_id
    alert.acted_at = datetime.now(UTC)
    await db.commit()
    return {"status": "updated"}
