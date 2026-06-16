"""
Worker de predição de risco de evasão.
Roda diariamente via Celery Beat.
"""

from datetime import date, timedelta
from typing import TYPE_CHECKING

import structlog

from app.workers.celery_app import celery_app

if TYPE_CHECKING:
    from app.models.tutor import StudentDailyMetrics

log = structlog.get_logger()

RISK_FEATURES = [
    "days_since_last_access",
    "engagement_trend_7d",
    "accuracy_rate_last_10",
    "avg_response_time_ms_7d",
    "content_variety_7d",
    "weekly_plan_completion",
    "tutor_interaction_7d",
    "repeated_error_count",
    "streak_broken",
]


def _extract_features(metrics: "list[StudentDailyMetrics]") -> list[float]:
    """Extrai features dos últimos 7 dias de métricas."""
    if not metrics:
        return [7.0, -0.5, 0.0, 5000.0, 0.0, 0.0, 0.0, 0.0, 1.0]

    today = date.today()
    last_access = max((m.metric_date for m in metrics), default=today - timedelta(days=7))
    days_since = (today - last_access).days

    total_attempts = sum(m.exercises_attempted for m in metrics)
    total_correct = sum(m.exercises_correct for m in metrics)
    accuracy = total_correct / total_attempts if total_attempts > 0 else 0.0

    types_accessed = len({m.resources_accessed for m in metrics if m.resources_accessed > 0})

    access_counts = [m.resources_accessed for m in metrics]
    if len(access_counts) >= 2:
        from statistics import mean

        mid = len(access_counts) // 2
        trend = mean(access_counts[mid:]) - mean(access_counts[:mid])
    else:
        trend = 0.0

    return [
        float(days_since),
        trend,
        accuracy,
        2000.0,  # avg response time (placeholder)
        float(types_accessed),
        0.5,  # weekly plan completion (placeholder)
        float(sum(m.tutor_interactions for m in metrics)),
        0.0,  # repeated error count (placeholder)
        1.0 if days_since > 2 else 0.0,
    ]


def _simple_risk_score(features: list[float]) -> float:
    """
    Modelo simplificado baseado em regras até que dados reais estejam disponíveis.
    Substituir por LightGBM após coletar 1000+ históricos de alunos.
    """
    days_since = features[0]
    trend = features[1]
    accuracy = features[2]
    streak_broken = features[8]

    score = 0.0

    if days_since >= 7:
        score += 0.50
    elif days_since >= 3:
        score += 0.25
    elif days_since >= 1:
        score += 0.10

    if trend < -0.5:
        score += 0.20
    elif trend < 0:
        score += 0.10

    if accuracy < 0.30:
        score += 0.20
    elif accuracy < 0.50:
        score += 0.10

    if streak_broken > 0:
        score += 0.10

    return min(score, 1.0)


def _risk_level(probability: float) -> str:
    if probability >= 0.80:
        return "critical"
    elif probability >= 0.60:
        return "high"
    elif probability >= 0.40:
        return "medium"
    return "low"


def _suggested_action(risk_level: str, days_since: float) -> tuple[str, str]:
    if risk_level == "critical":
        action = "Contato imediato necessário. O aluno está em risco iminente de evasão."
        message = f"Oi! Sentimos muito sua falta nos últimos {int(days_since)} dias. Está tudo bem? Estamos aqui para ajudar! 🌟"
    elif risk_level == "high":
        action = "Enviar mensagem de incentivo via WhatsApp dentro de 24h."
        message = "Olá! Você estava indo muito bem! Que tal retomar seus estudos hoje? Sua trilha está esperando 📚"
    elif risk_level == "medium":
        action = "Monitorar por mais 2 dias. Enviar lembrete motivacional se não acessar."
        message = "Continue assim! Cada dia de estudo conta para o seu futuro 💪"
    else:
        action = "Nenhuma ação necessária. Aluno engajado."
        message = ""
    return action, message


@celery_app.task(name="app.workers.risk_prediction.aggregate_daily_metrics")
def aggregate_daily_metrics():
    """Consolida métricas diárias de todos os alunos."""
    import asyncio

    from sqlalchemy import func, select

    from app.core.database import AsyncSessionLocal
    from app.models.learning import ExerciseResponse
    from app.models.tutor import StudentDailyMetrics, TutorConversation
    from app.models.user import User

    async def _run():
        target_date = date.today() - timedelta(days=1)
        async with AsyncSessionLocal() as db:
            students = await db.execute(
                select(User.id).where(User.role == "student", User.is_active)
            )
            student_ids = [r[0] for r in students.all()]

            for student_id in student_ids:
                existing = await db.execute(
                    select(StudentDailyMetrics).where(
                        StudentDailyMetrics.user_id == student_id,
                        StudentDailyMetrics.metric_date == target_date,
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                exercises = await db.execute(
                    select(
                        func.count(ExerciseResponse.id),
                        func.sum(ExerciseResponse.is_correct.cast("int")),
                    ).where(
                        ExerciseResponse.user_id == student_id,
                        func.date(ExerciseResponse.responded_at) == target_date,
                    )
                )
                exercise_data = exercises.one()

                tutor_count = await db.execute(
                    select(func.count(TutorConversation.id)).where(
                        TutorConversation.user_id == student_id,
                        func.date(TutorConversation.created_at) == target_date,
                    )
                )

                metric = StudentDailyMetrics(
                    user_id=student_id,
                    metric_date=target_date,
                    exercises_attempted=exercise_data[0] or 0,
                    exercises_correct=exercise_data[1] or 0,
                    tutor_interactions=tutor_count.scalar() or 0,
                )
                db.add(metric)

            await db.commit()
            log.info("daily_metrics_aggregated", date=str(target_date), students=len(student_ids))

    asyncio.run(_run())


@celery_app.task(name="app.workers.risk_prediction.run_risk_prediction_all")
def run_risk_prediction_all():
    """Roda predição de risco para todos os alunos."""
    import asyncio

    from sqlalchemy import select

    from app.core.database import AsyncSessionLocal
    from app.models.tutor import RiskAlert, StudentDailyMetrics
    from app.models.user import User

    async def _run():
        async with AsyncSessionLocal() as db:
            students = await db.execute(
                select(User.id).where(User.role == "student", User.is_active)
            )
            student_ids = [r[0] for r in students.all()]

            for student_id in student_ids:
                window_start = date.today() - timedelta(days=7)
                metrics_result = await db.execute(
                    select(StudentDailyMetrics).where(
                        StudentDailyMetrics.user_id == student_id,
                        StudentDailyMetrics.metric_date >= window_start,
                    )
                )
                metrics = metrics_result.scalars().all()

                features = _extract_features(list(metrics))
                probability = _simple_risk_score(features)
                level = _risk_level(probability)

                if level in ("low",):
                    continue

                action, message = _suggested_action(level, features[0])
                factors = []
                if features[0] >= 3:
                    factors.append(f"{int(features[0])} dias sem acessar")
                if features[1] < -0.3:
                    factors.append("Tendência de queda no engajamento")
                if features[2] < 0.4:
                    factors.append(f"Taxa de acerto baixa ({features[2] * 100:.0f}%)")

                alert = RiskAlert(
                    user_id=student_id,
                    risk_probability=probability,
                    risk_level=level,
                    contributing_factors=factors,
                    suggested_action=action,
                    suggested_message=message,
                )
                db.add(alert)

            await db.commit()
            log.info("risk_prediction_completed", students=len(student_ids))

    asyncio.run(_run())
