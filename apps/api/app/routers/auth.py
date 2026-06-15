import hashlib
import secrets
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class RegisterRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email ou telefone é obrigatório")

    existing = await db.execute(
        select(User).where(
            (User.email == body.email) if body.email else (User.phone == body.phone)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Usuário já cadastrado")

    user = User(
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        role="student",
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(str(user.id), {"role": user.role})
    refresh_token_raw = secrets.token_urlsafe(64)
    refresh_token_obj = RefreshToken(
        user_id=user.id,
        token_hash=hashlib.sha256(refresh_token_raw.encode()).hexdigest(),
        expires_at=datetime.now(UTC).replace(day=datetime.now(UTC).day + 30),
    )
    db.add(refresh_token_obj)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token_raw)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    query = select(User).where(
        (User.email == body.email) if body.email else (User.phone == body.phone)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")

    access_token = create_access_token(str(user.id), {"role": user.role})
    refresh_token_raw = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(refresh_token_raw.encode()).hexdigest()

    refresh_token_obj = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(UTC).replace(day=datetime.now(UTC).day + 30),
    )
    db.add(refresh_token_obj)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token_raw)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(UTC),
        )
    )
    token_obj = result.scalar_one_or_none()
    if not token_obj:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    # Rotate: revoke old, issue new
    token_obj.revoked_at = datetime.now(UTC)

    user_result = await db.execute(select(User).where(User.id == token_obj.user_id))
    user = user_result.scalar_one()

    new_access = create_access_token(str(user.id), {"role": user.role})
    new_refresh_raw = secrets.token_urlsafe(64)
    new_token = RefreshToken(
        user_id=user.id,
        token_hash=hashlib.sha256(new_refresh_raw.encode()).hexdigest(),
        expires_at=datetime.now(UTC).replace(day=datetime.now(UTC).day + 30),
    )
    db.add(new_token)
    await db.commit()

    return TokenResponse(access_token=new_access, refresh_token=new_refresh_raw)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    token_obj = result.scalar_one_or_none()
    if token_obj:
        token_obj.revoked_at = datetime.now(UTC)
        await db.commit()
