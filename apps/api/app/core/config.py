from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_PRIVATE_KEY_PATH: str = "./secrets/jwt_private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./secrets/jwt_public.pem"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # AI
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    LLM_MAX_RETRIES: int = 3
    LLM_TIMEOUT_SECONDS: int = 30

    # Storage
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_BUCKET: str = "educadigital-assets"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_REGION: str = "us-east-1"

    # External APIs
    YOUTUBE_DATA_API_KEY: str = ""

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_TASK_SOFT_TIME_LIMIT: int = 300
    CELERY_TASK_TIME_LIMIT: int = 600

    # Monitoring
    SENTRY_DSN: str = ""

    # Feature flags
    FEATURE_DIAGNOSTIC_ENABLED: bool = True
    FEATURE_TUTOR_STREAMING: bool = True
    FEATURE_RISK_PREDICTION: bool = False
    FEATURE_OFFLINE_COLLECTIVE: bool = False
    FEATURE_COMMUNITY_CONTENT: bool = False


settings = Settings()  # type: ignore[call-arg]
