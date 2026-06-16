from contextlib import asynccontextmanager

import sentry_sdk
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import engine
from app.routers import auth, content, dashboard, diagnostic, gamification, ingest, learning, tutor

log = structlog.get_logger()

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
    )

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", environment=settings.ENVIRONMENT)
    yield
    await engine.dispose()
    log.info("shutdown")


app = FastAPI(
    title="EducaDigital API",
    version="1.0.0",
    description="Plataforma de educação adaptativa para EJA",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(content.router, prefix="/api/v1/content", tags=["content"])
app.include_router(diagnostic.router, prefix="/api/v1/diagnostic", tags=["diagnostic"])
app.include_router(learning.router, prefix="/api/v1/learning", tags=["learning"])
app.include_router(tutor.router, prefix="/api/v1/tutor", tags=["tutor"])
app.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingest"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
