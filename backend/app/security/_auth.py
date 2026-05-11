"""
UniShield AI — Auth0 Authentication Middleware
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.core.logging import logger

security = HTTPBearer(auto_error=False)

AUTH0_ALGORITHMS = ["RS256"]


def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Verify the JWT token from Auth0."""
    if settings.AUTH0_DOMAIN == "your-domain.auth0.com":
        logger.warning("Auth0 is not configured. Using mock user.")
        return {
            "sub": "dev|local-user",
            "email": "dev@unishield.local",
            "name": "Development User",
        }

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.get_unverified_claims(token)
        if not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject claim",
            )
        return payload

    except JWTError as e:
        logger.error(f"Invalid authentication token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def optional_auth(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Optional authentication."""
    if not creds:
        return None
    try:
        return verify_token(creds)
    except HTTPException:
        return None
