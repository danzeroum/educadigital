from datetime import UTC, datetime, timedelta
from pathlib import Path

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _load_key(path: str) -> str:
    return Path(path).read_text()


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, extra: dict | None = None) -> str:
    payload = {
        "sub": subject,
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
        **(extra or {}),
    }
    return jwt.encode(payload, _load_key(settings.JWT_PRIVATE_KEY_PATH), algorithm="RS256")


def create_refresh_token(subject: str) -> str:
    payload = {
        "sub": subject,
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, _load_key(settings.JWT_PRIVATE_KEY_PATH), algorithm="RS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            _load_key(settings.JWT_PUBLIC_KEY_PATH),
            algorithms=["RS256"],
        )
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
