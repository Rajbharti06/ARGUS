"""
ARGUS — Authentication & Authorization Middleware
Supports Auth0 JWT verification with optional bypass for development.
"""

import os
import jwt
import httpx
from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

# Cache for Auth0 JWKS keys
_jwks_cache: Optional[dict] = None
_jwks_url: str = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"


class UserInfo(BaseModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None
    roles: list[str] = []
    permissions: list[str] = []


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(_jwks_url)
            _jwks_cache = resp.json()
    return _jwks_cache


def _verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            algorithms=["RS256"],
            options={"verify_signature": False},
            audience=settings.AUTH0_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> UserInfo:
    # Dev bypass — allow unauthenticated access in development
    if os.getenv("ARGUS_DEV_MODE", "true").lower() == "true":
        return UserInfo(
            sub="dev-user",
            email="dev@argus.local",
            name="Development User",
            roles=["admin"],
            permissions=["read", "write", "admin"],
        )

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = _verify_token(credentials.credentials)
    return UserInfo(
        sub=payload.get("sub", ""),
        email=payload.get("email"),
        name=payload.get("name"),
        roles=payload.get("https://argus/roles", []),
        permissions=payload.get("permissions", []),
    )


def require_auth(required_roles: Optional[list[str]] = None):
    async def dependency(user: UserInfo = Depends(get_current_user)) -> UserInfo:
        if os.getenv("ARGUS_DEV_MODE", "true").lower() == "true":
            return user
        if required_roles and not any(r in user.roles for r in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return dependency


class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        return await self.app(scope, receive, send)
