import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_progress")
    audio_url: Mapped[str | None] = mapped_column(String(500))
    handwriting_url: Mapped[str | None] = mapped_column(String(500))
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    responses: Mapped[list["DiagnosticResponse"]] = relationship(back_populates="session")
    result: Mapped["DiagnosticResult | None"] = relationship(
        back_populates="session", uselist=False
    )


class DiagnosticResponse(Base):
    __tablename__ = "diagnostic_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("diagnostic_sessions.id")
    )
    step_type: Mapped[str] = mapped_column(String(30), nullable=False)
    raw_content: Mapped[str | None] = mapped_column(Text)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    step_metadata: Mapped[dict] = mapped_column(
        JSONB, name="metadata", nullable=False, default=dict
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    session: Mapped["DiagnosticSession"] = relationship(back_populates="responses")


class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("diagnostic_sessions.id"), unique=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    eja_level: Mapped[str] = mapped_column(String(50), nullable=False)
    learning_style: Mapped[str] = mapped_column(String(20), nullable=False)
    preferred_media: Mapped[str] = mapped_column(String(20), nullable=False)
    oral_fluency_score: Mapped[float | None] = mapped_column(Numeric(4, 2))
    writing_score: Mapped[float | None] = mapped_column(Numeric(4, 2))
    numeracy_score: Mapped[float | None] = mapped_column(Numeric(4, 2))
    reading_score: Mapped[float | None] = mapped_column(Numeric(4, 2))
    gaps: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    strengths: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    recommended_daily_minutes: Mapped[int | None] = mapped_column(Integer)
    llm_analysis: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    session: Mapped["DiagnosticSession"] = relationship(back_populates="result")
