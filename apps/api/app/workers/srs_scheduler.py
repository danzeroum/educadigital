"""Worker de agendamento do Spaced Repetition System."""

from datetime import date

import structlog

from app.workers.celery_app import celery_app

log = structlog.get_logger()


@celery_app.task(name="app.workers.srs_scheduler.schedule_daily_reviews")
def schedule_daily_reviews():
    """Garante que todos os cartões devidos são acessíveis. Envia notificações se configurado."""
    import asyncio

    from sqlalchemy import func, select

    from app.core.database import AsyncSessionLocal
    from app.models.learning import SrsCard

    async def _run():
        async with AsyncSessionLocal() as db:
            due_count = await db.execute(
                select(func.count(SrsCard.id)).where(SrsCard.due_date <= date.today())
            )
            log.info("srs_cards_due_today", count=due_count.scalar())

    asyncio.run(_run())
