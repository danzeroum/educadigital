from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "educadigital",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.ingestion",
        "app.workers.enrichment",
        "app.workers.diagnostic",
        "app.workers.risk_prediction",
        "app.workers.srs_scheduler",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_soft_time_limit=settings.CELERY_TASK_SOFT_TIME_LIMIT,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Calcular métricas diárias dos alunos
        "aggregate-daily-metrics": {
            "task": "app.workers.risk_prediction.aggregate_daily_metrics",
            "schedule": crontab(hour=1, minute=0),
        },
        # Rodar predição de risco diariamente
        "run-risk-prediction": {
            "task": "app.workers.risk_prediction.run_risk_prediction_all",
            "schedule": crontab(hour=2, minute=0),
        },
        # Agendar revisões SRS para o dia seguinte
        "schedule-srs-reviews": {
            "task": "app.workers.srs_scheduler.schedule_daily_reviews",
            "schedule": crontab(hour=6, minute=0),
        },
    },
)
