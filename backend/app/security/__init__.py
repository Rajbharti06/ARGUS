"""
UniShield AI — Security Module
Exposes authentication and authorization functions for the application.
"""

from ._auth import verify_token, optional_auth

__all__ = ["verify_token", "optional_auth"]
