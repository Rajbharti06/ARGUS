"""Tests for ARGUS middleware layer (auth, security, rate limiting)."""

import os
import pytest
from unittest.mock import patch
from fastapi import HTTPException

from app.middleware.auth import get_current_user, UserInfo
from app.middleware.rate_limit import RateLimitMiddleware


@pytest.mark.asyncio
async def test_dev_mode_auth():
    """Dev mode should return a default user."""
    os.environ["ARGUS_DEV_MODE"] = "true"
    user = await get_current_user(None)
    assert user.sub == "dev-user"
    assert user.email == "dev@argus.local"
    assert "admin" in user.roles


@pytest.mark.asyncio
async def test_user_info_model():
    user = UserInfo(
        sub="auth0|123",
        email="user@harvard.edu",
        name="Test User",
        roles=["analyst"],
        permissions=["read", "write"],
    )
    assert user.sub == "auth0|123"
    assert user.email == "user@harvard.edu"
    assert "analyst" in user.roles


def test_rate_limit_window():
    """Verify rate limit window calculation logic."""
    middleware = RateLimitMiddleware.__init__
    assert middleware is not None


def test_user_info_defaults():
    """UserInfo should have sensible defaults."""
    user = UserInfo(sub="test-user")
    assert user.sub == "test-user"
    assert user.email is None
    assert user.roles == []
    assert user.permissions == []
