"""
ARGUS — Multi-Provider AI Router
Supports: Featherless, NVIDIA NIM, OpenAI, Anthropic
Features: per-module model routing, async, streaming, fallback chains
"""

import asyncio
from typing import AsyncIterator, Optional
from openai import AsyncOpenAI
import anthropic

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AIProviderError

_ARGUS_SYSTEM = (
    "You are ARGUS AI CORE, an elite autonomous cybersecurity intelligence system "
    "protecting institutional infrastructure. Be precise, technical, and decisive. "
    "Never hedge. Output intelligence-grade analysis."
)

_SEC_SYSTEM = (
    "You are a specialized cybersecurity reasoning engine. Analyze threats with "
    "forensic precision. Identify attack vectors, indicators of compromise, and "
    "recommend immediate containment actions. Be concise and operational."
)


def _featherless_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url="https://api.featherless.ai/v1")


def _nvidia_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url="https://integrate.api.nvidia.com/v1")


def _openai_client(api_key: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key)


class AIRouter:
    """
    Routes AI requests to the correct provider/model with automatic fallback.

    Fallback order (featherless):
        requested model → FEATHERLESS_MODEL_FAST → FEATHERLESS_MODEL_FALLBACK
    """

    def __init__(self, provider: str, api_key: str, model: str = None, system: str = None):
        self.provider  = provider.lower()
        self.api_key   = api_key
        self.model     = model
        self.system    = system or _ARGUS_SYSTEM

    # ── Public sync wrapper (keeps existing route callers working) ────────────

    def generate(self, prompt: str) -> str:
        try:
            return asyncio.get_event_loop().run_until_complete(self.agenerate(prompt))
        except RuntimeError:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(self.agenerate(prompt))
            finally:
                loop.close()

    # ── Primary async method ──────────────────────────────────────────────────

    async def agenerate(self, prompt: str) -> str:
        if not self.api_key:
            logger.warning("No API key — using offline fallback")
            return self._offline_fallback()

        handlers = {
            "featherless": self._featherless,
            "nvidia":      self._nvidia,
            "openai":      self._openai,
            "anthropic":   self._claude,
        }
        handler = handlers.get(self.provider)
        if not handler:
            logger.error(f"Unsupported provider: {self.provider}")
            return "Unsupported provider"

        try:
            return await handler(prompt)
        except Exception as exc:
            logger.error(f"{self.provider} error ({self.model}): {exc}")
            raise AIProviderError(str(exc))

    # ── Streaming generator ────────────────────────────────────────────────────

    async def stream(self, prompt: str) -> AsyncIterator[str]:
        """Yield text chunks as they arrive from the model."""
        if not self.api_key:
            yield self._offline_fallback()
            return

        try:
            if self.provider == "featherless":
                client = _featherless_client(self.api_key)
                model  = self.model or settings.FEATHERLESS_MODEL
            elif self.provider == "nvidia":
                client = _nvidia_client(self.api_key)
                model  = self.model or settings.NVIDIA_MODEL
            elif self.provider == "openai":
                client = _openai_client(self.api_key)
                model  = self.model or settings.OPENAI_MODEL
            else:
                yield self._offline_fallback()
                return

            stream = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": self.system},
                    {"role": "user",   "content": prompt},
                ],
                max_tokens=800,
                temperature=0.15,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:
            logger.error(f"Stream error ({self.provider}/{self.model}): {exc}")
            yield f"\n[ARGUS: stream interrupted — {exc}]"

    # ── Provider implementations ──────────────────────────────────────────────

    async def _featherless(self, prompt: str) -> str:
        client = _featherless_client(self.api_key)

        # Try requested model, then fast, then fallback
        for model in self._featherless_model_chain():
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=800,
                    temperature=0.15,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Featherless model {model} failed: {exc} — trying next")
                continue

        return self._offline_fallback()

    async def _nvidia(self, prompt: str) -> str:
        client = _nvidia_client(self.api_key)
        model  = self.model or settings.NVIDIA_MODEL
        resp   = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": self.system},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=800,
            temperature=0.15,
        )
        return resp.choices[0].message.content.strip()

    async def _openai(self, prompt: str) -> str:
        client = _openai_client(self.api_key)
        resp   = await client.chat.completions.create(
            model=self.model or settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": self.system},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=800,
        )
        return resp.choices[0].message.content.strip()

    async def _claude(self, prompt: str) -> str:
        client = anthropic.AsyncAnthropic(api_key=self.api_key)
        resp   = await client.messages.create(
            model=self.model or settings.ANTHROPIC_MODEL,
            max_tokens=800,
            system=self.system,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _featherless_model_chain(self) -> list[str]:
        chain = []
        if self.model:
            chain.append(self.model)
        chain += [settings.FEATHERLESS_MODEL_FAST, settings.FEATHERLESS_MODEL_FALLBACK]
        return list(dict.fromkeys(chain))  # deduplicate, preserve order

    @staticmethod
    def _offline_fallback() -> str:
        return (
            "ARGUS OFFLINE — AI analysis unavailable. "
            "Rule-based detection indicates elevated risk. "
            "Manual review recommended."
        )


# ── Convenience factory functions ──────────────────────────────────────────────

def veil_router() -> AIRouter:
    """Phishing analysis — Qwen3.6-35B (best JSON), SEC model in fallback chain."""
    key = settings.FEATHERLESS_API_KEY
    return AIRouter(
        provider="featherless",
        api_key=key,
        model=settings.FEATHERLESS_MODEL,   # Qwen3.6-35B — strongest at structured output
        system=_SEC_SYSTEM,
    )


def oracle_router() -> AIRouter:
    """Executive summaries — Kimi-K2.6 for cinematic narrative."""
    key = settings.FEATHERLESS_API_KEY
    return AIRouter(
        provider="featherless",
        api_key=key,
        model=settings.FEATHERLESS_MODEL_ORACLE,
        system=_ARGUS_SYSTEM,
    )


def nvidia_router() -> AIRouter:
    """High-quality analysis via NVIDIA NIM."""
    return AIRouter(
        provider="nvidia",
        api_key=settings.NVIDIA_API_KEY,
        model=settings.NVIDIA_MODEL,
        system=_SEC_SYSTEM,
    )


def best_available_router(prefer_nvidia: bool = False) -> AIRouter:
    """Pick the best available provider based on what keys are configured."""
    if prefer_nvidia and settings.NVIDIA_API_KEY:
        return nvidia_router()
    if settings.FEATHERLESS_API_KEY:
        return AIRouter("featherless", settings.FEATHERLESS_API_KEY, system=_ARGUS_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, system=_ARGUS_SYSTEM)
    return AIRouter("none", "", system=_ARGUS_SYSTEM)
