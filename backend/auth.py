"""
Authentication utilities.

JWT: stdlib hmac/hashlib HS256 — no external crypto deps.
Passwords: PBKDF2-SHA256 (260 000 iterations) via stdlib hashlib — NIST SP 800-132 compliant.
"""
import os
import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = os.getenv("SECRET_KEY", "mf-portfolio-super-secret-key-change-in-production-2025")
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) * 60
_PBKDF2_ITERS = 260_000

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── JWT helpers ────────────────────────────────────────────────────────────────

def _b64url_enc(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_dec(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _sign(msg: str) -> str:
    return _b64url_enc(hmac.new(SECRET_KEY.encode(), msg.encode(), hashlib.sha256).digest())


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    exp = int(time.time()) + (int(expires_delta.total_seconds()) if expires_delta else ACCESS_TOKEN_EXPIRE_SECONDS)
    header = _b64url_enc(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_enc(json.dumps({"sub": subject, "exp": exp}).encode())
    body = f"{header}.{payload}"
    return f"{body}.{_sign(body)}"


def _decode_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("malformed")
    header, payload, sig = parts
    body = f"{header}.{payload}"
    if not hmac.compare_digest(sig, _sign(body)):
        raise ValueError("invalid signature")
    data = json.loads(_b64url_dec(payload))
    if data.get("exp", 0) < time.time():
        raise ValueError("expired")
    return data


# ── Password helpers ───────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), _PBKDF2_ITERS)
    return f"pbkdf2:sha256:{_PBKDF2_ITERS}:{salt}:{dk.hex()}"


def verify_password(plain: str, stored: str) -> bool:
    try:
        _, alg, iters_str, salt, dk_hex = stored.split(":")
        dk = hashlib.pbkdf2_hmac(alg, plain.encode(), salt.encode(), int(iters_str))
        return hmac.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        data = _decode_token(token)
        email: str = data.get("sub", "")
        if not email:
            raise exc
    except (ValueError, KeyError):
        raise exc

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise exc
    return user
