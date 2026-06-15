import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ContentSource(Base):
    __tablename__ = "content_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(500))
    auth_config: Mapped[dict | None] = mapped_column(JSONB)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    resources: Mapped[list["Resource"]] = relationship(back_populates="source")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("content_sources.id")
    )
    external_id: Mapped[str | None] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)
    original_url: Mapped[str | None] = mapped_column(String(1000))
    cdn_url: Mapped[str | None] = mapped_column(String(1000))
    duration_min: Mapped[int | None] = mapped_column(Integer)
    eja_level: Mapped[str | None] = mapped_column(String(50))
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="pt-BR")
    license: Mapped[str | None] = mapped_column(String(100))
    author_credit: Mapped[str | None] = mapped_column(String(500))
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    source: Mapped["ContentSource | None"] = relationship(back_populates="resources")
    enrichment: Mapped["ResourceEnrichment | None"] = relationship(
        back_populates="resource", uselist=False
    )
    bncc_mappings: Mapped[list["ResourceBnccMapping"]] = relationship(back_populates="resource")
    tags: Mapped[list["ResourceTag"]] = relationship(back_populates="resource")
    checkpoints: Mapped[list["VideoCheckpoint"]] = relationship(back_populates="resource")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="resource")


class ResourceEnrichment(Base):
    __tablename__ = "resource_enrichments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), unique=True
    )
    transcript: Mapped[str | None] = mapped_column(Text)
    summary_basic: Mapped[str | None] = mapped_column(Text)
    summary_intermediate: Mapped[str | None] = mapped_column(Text)
    difficulty_score: Mapped[float | None] = mapped_column(Numeric(3, 2))
    interactivity_score: Mapped[float | None] = mapped_column(Numeric(3, 2))
    eja_adequacy_score: Mapped[float | None] = mapped_column(Numeric(3, 2))
    estimated_study_min: Mapped[int | None] = mapped_column(Integer)
    ai_model_used: Mapped[str | None] = mapped_column(String(100))
    enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    enrichment_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    resource: Mapped["Resource"] = relationship(back_populates="enrichment")


class ResourceBnccMapping(Base):
    __tablename__ = "resource_bncc_mappings"

    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True
    )
    bncc_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    confidence: Mapped[float | None] = mapped_column(Numeric(3, 2))

    resource: Mapped["Resource"] = relationship(back_populates="bncc_mappings")


class ResourceTag(Base):
    __tablename__ = "resource_tags"

    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True
    )
    tag: Mapped[str] = mapped_column(String(100), primary_key=True)

    resource: Mapped["Resource"] = relationship(back_populates="tags")


class VideoCheckpoint(Base):
    __tablename__ = "video_checkpoints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE")
    )
    timestamp_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    concept_key: Mapped[str] = mapped_column(String(300), nullable=False)
    checkpoint_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    resource: Mapped["Resource"] = relationship(back_populates="checkpoints")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="checkpoint")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE")
    )
    checkpoint_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("video_checkpoints.id")
    )
    exercise_type: Mapped[str] = mapped_column(String(30), nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False)
    bncc_codes: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    generated_by: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    resource: Mapped["Resource"] = relationship(back_populates="exercises")
    checkpoint: Mapped["VideoCheckpoint | None"] = relationship(back_populates="exercises")
