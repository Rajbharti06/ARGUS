"""
ARGUS — Custom Exceptions
"""


class ArgusError(Exception):
    """Base exception for the application."""
    pass


class AIProviderError(ArgusError):
    """Raised when an AI provider fails."""
    pass


class InvalidInputError(ArgusError):
    """Raised when the input is invalid."""
    pass
