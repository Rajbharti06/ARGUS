"""
UniShield AI — Security Module Tests
"""

from unittest.mock import patch
from fastapi import HTTPException
import pytest
from app.security._auth import verify_token, optional_auth


@patch("app.security._auth.settings")
def test_verify_token_dev_mode(mock_settings):
    """Test the verify_token function in development mode."""
    mock_settings.AUTH0_DOMAIN = "your-domain.auth0.com"
    result = verify_token()
    assert result["sub"] == "dev|local-user"


@patch("app.security._auth.settings")
@patch("app.security._auth.jwt")
def test_verify_token_production_mode(mock_jwt, mock_settings):
    """Test the verify_token function in production mode."""
    mock_settings.AUTH0_DOMAIN = "test-domain.auth0.com"
    mock_jwt.get_unverified_claims.return_value = {"sub": "test-user"}

    class MockCredentials:
        credentials = "test_token"

    result = verify_token(MockCredentials())
    assert result["sub"] == "test-user"


@patch("app.security._auth.settings")
def test_verify_token_no_credentials(mock_settings):
    """Test the verify_token function with no credentials."""
    mock_settings.AUTH0_DOMAIN = "test-domain.auth0.com"
    with pytest.raises(HTTPException):
        verify_token(None)


@patch("app.security._auth.verify_token")
def test_optional_auth(mock_verify_token):
    """Test the optional_auth function."""
    mock_verify_token.return_value = {"sub": "test-user"}

    class MockCredentials:
        credentials = "test_token"

    result = optional_auth(MockCredentials())
    assert result["sub"] == "test-user"


def test_optional_auth_no_credentials():
    """Test the optional_auth function with no credentials."""
    result = optional_auth(None)
    assert result is None
