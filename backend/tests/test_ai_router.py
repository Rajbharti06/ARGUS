"""
ARGUS — AI Router Tests
"""

from unittest.mock import AsyncMock, patch, MagicMock
import pytest
from app.services.ai_router import AIRouter


@patch("app.services.ai_router._featherless_client")
def test_featherless_model_override(mock_client_fn):
    create_mock = AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="Featherless response"))]))
    mock_client_fn.return_value.chat.completions.create = create_mock
    router = AIRouter("featherless", "test_key", model="moonshotai/Kimi-K2.6")
    result = router.generate("test prompt")
    assert result == "Featherless response"


@patch("app.services.ai_router._nvidia_client")
def test_nvidia_provider(mock_client_fn):
    create_mock = AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="NVIDIA response"))]))
    mock_client_fn.return_value.chat.completions.create = create_mock
    router = AIRouter("nvidia", "nvapi-test", model="nvidia/llama-3.3-nemotron-super-49b-v1")
    result = router.generate("test prompt")
    assert result == "NVIDIA response"


@patch("app.services.ai_router._openai_client")
def test_openai_provider(mock_client_fn):
    create_mock = AsyncMock(return_value=MagicMock(choices=[MagicMock(message=MagicMock(content="OpenAI response"))]))
    mock_client_fn.return_value.chat.completions.create = create_mock
    router = AIRouter("openai", "sk-test")
    result = router.generate("test prompt")
    assert result == "OpenAI response"


def test_unsupported_provider():
    router = AIRouter("unknown_provider", "test_key")
    result = router.generate("test prompt")
    assert result == "Unsupported provider"


def test_no_api_key():
    router = AIRouter("featherless", "")
    result = router.generate("test prompt")
    assert "ARGUS OFFLINE" in result


def test_no_api_key_none():
    router = AIRouter("openai", None)
    result = router.generate("test prompt")
    assert "ARGUS OFFLINE" in result
