"""
ARGUS — Multi-Provider AI Router v6.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provider stack (priority order):

  1. NVIDIA NIM        FREE tier · 49B param flagship · build.nvidia.com
  2. Claude Opus 4.7   Anthropic · World's best reasoning & threat analysis
  3. GPT-4o / o4-mini  OpenAI · Gold standard · platform.openai.com
  4. Gemini 2.5 Pro    Google · 1M token context · FREE tier available
  5. Grok-3            xAI · Live X/internet access · console.x.ai
  6. Perplexity Sonar  Live web search · Real-time CVE & IOC lookups
  7. Ollama            100% local · free · offline · privacy-first

Task-optimized routing:
  VEIL         → NVIDIA → Claude Sonnet → GPT-4o → Gemini Flash → Grok Mini
  ORACLE       → Claude Opus → GPT o4-mini → Gemini Pro → Grok
  THREAT INTEL → Perplexity (live web) → Grok → Claude → GPT → NVIDIA
  BREACH-IQ    → Claude Opus → GPT-4o → Gemini Pro → Grok → NVIDIA
  HUNT         → NVIDIA → Claude Sonnet → GPT-4o → Gemini Flash
  IEM          → Claude Opus → GPT o4-mini → Gemini Pro → Grok → NVIDIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import asyncio
import httpx
import json
from typing import AsyncIterator
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import logger

# ── System Prompts ─────────────────────────────────────────────────────────────

_ARGUS_SYSTEM = (
    "You are ARGUS AI CORE — an elite autonomous cybersecurity intelligence system "
    "protecting institutional infrastructure. Be precise, technical, and decisive. "
    "Never hedge. Output intelligence-grade analysis in third-person operational style."
)

_SEC_SYSTEM = (
    "You are a specialized cybersecurity reasoning engine operating within ARGUS. "
    "Analyze threats with forensic precision. Identify attack vectors, indicators of "
    "compromise, MITRE ATT&CK TTPs, and recommend immediate containment actions. "
    "Be concise, operational, and authoritative."
)

_INTEL_SYSTEM = (
    "You are ARGUS THREAT INTELLIGENCE — an elite cyber threat analyst. "
    "Identify threat actors, TTPs, active campaigns, and emerging vulnerabilities "
    "relevant to university and enterprise environments. Cite specific threat groups, "
    "CVEs, and IOCs where available. Use live data where accessible."
)

# ── Provider client factories ──────────────────────────────────────────────────

def _nvidia_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.NVIDIA_API_KEY or "none",
        base_url="https://integrate.api.nvidia.com/v1"
    )

def _openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

def _gemini_client() -> AsyncOpenAI:
    # Gemini exposes an OpenAI-compatible REST endpoint
    return AsyncOpenAI(
        api_key=settings.GEMINI_API_KEY,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

def _grok_client() -> AsyncOpenAI:
    # xAI Grok is fully OpenAI-compatible
    return AsyncOpenAI(
        api_key=settings.XAI_API_KEY,
        base_url="https://api.x.ai/v1"
    )

def _perplexity_client() -> AsyncOpenAI:
    # Perplexity Sonar is OpenAI-compatible
    return AsyncOpenAI(
        api_key=settings.PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )

def _featherless_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.FEATHERLESS_API_KEY,
        base_url="https://api.featherless.ai/v1"
    )


# ── Main AI Router ─────────────────────────────────────────────────────────────

class AIRouter:
    """
    Intelligent AI router with automatic fallback across 7 providers.
    Instantiate via the factory functions at the bottom of this file.
    """

    def __init__(self, provider: str, api_key: str, model: str = None, system: str = None):
        self.provider = provider.lower()
        self.api_key  = api_key
        self.model    = model
        self.system   = system or _ARGUS_SYSTEM

    def generate(self, prompt: str) -> str:
        try:
            return asyncio.get_event_loop().run_until_complete(self.agenerate(prompt))
        except RuntimeError:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(self.agenerate(prompt))
            finally:
                loop.close()

    async def agenerate(self, prompt: str) -> str:
        if not self.api_key and self.provider not in ("ollama", "offline"):
            result = await self._ollama(prompt)
            if result and not result.startswith("ARGUS OFFLINE"):
                return result
            return self._offline_fallback()

        handlers = {
            "nvidia":      self._nvidia,
            "anthropic":   self._claude,
            "openai":      self._openai,
            "gemini":      self._gemini,
            "grok":        self._grok,
            "perplexity":  self._perplexity,
            "ollama":      self._ollama,
            "featherless": self._featherless,
        }
        handler = handlers.get(self.provider)
        if not handler:
            return self._offline_fallback()

        try:
            result = await handler(prompt)
            return result if result else self._offline_fallback()
        except Exception as exc:
            logger.error(f"{self.provider} error ({self.model}): {exc}")
            try:
                result = await self._ollama(prompt)
                if result and not result.startswith("ARGUS OFFLINE"):
                    return result
            except Exception:
                pass
            return self._offline_fallback()

    # ── Streaming ──────────────────────────────────────────────────────────────

    async def stream(self, prompt: str) -> AsyncIterator[str]:
        if not self.api_key and self.provider not in ("ollama",):
            async for chunk in self._stream_ollama(prompt):
                yield chunk
            return

        if self.provider == "anthropic":
            async for chunk in self._stream_claude(prompt):
                yield chunk
            return

        if self.provider == "ollama":
            async for chunk in self._stream_ollama(prompt):
                yield chunk
            return

        # All other providers use OpenAI-compatible streaming
        _compat_map = {
            "nvidia":      (_nvidia_client,      self.model or settings.NVIDIA_MODEL),
            "openai":      (_openai_client,       self.model or settings.OPENAI_MODEL),
            "gemini":      (_gemini_client,       self.model or settings.GEMINI_MODEL_FAST),
            "grok":        (_grok_client,         self.model or settings.GROK_MODEL_FAST),
            "perplexity":  (_perplexity_client,   self.model or settings.PERPLEXITY_MODEL_FAST),
            "featherless": (_featherless_client,  self.model or settings.FEATHERLESS_MODEL),
        }
        if self.provider in _compat_map:
            client_fn, model = _compat_map[self.provider]
            try:
                client = client_fn()
                stream = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12, stream=True,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield delta
                return
            except Exception as exc:
                logger.error(f"Stream error ({self.provider}): {exc}")

        async for chunk in self._stream_ollama(prompt):
            yield chunk

    # ── NVIDIA NIM (Free showcase) ─────────────────────────────────────────────

    async def _nvidia(self, prompt: str) -> str:
        client = _nvidia_client()
        for model in list(dict.fromkeys([
            self.model or settings.NVIDIA_MODEL,
            settings.NVIDIA_MODEL,
            settings.NVIDIA_MODEL_FAST,
        ])):
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"NVIDIA {model}: {exc}")
        return ""

    # ── Anthropic Claude ───────────────────────────────────────────────────────

    async def _claude(self, prompt: str) -> str:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key or settings.ANTHROPIC_API_KEY)
            resp = await client.messages.create(
                model=self.model or settings.ANTHROPIC_MODEL,
                max_tokens=1200,
                system=self.system,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text
        except ImportError:
            logger.warning("pip install anthropic")
            return ""
        except Exception as exc:
            try:
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                resp = await client.messages.create(
                    model=settings.ANTHROPIC_MODEL_FAST,
                    max_tokens=1200, system=self.system,
                    messages=[{"role": "user", "content": prompt}],
                )
                return resp.content[0].text
            except Exception:
                logger.error(f"Claude error: {exc}")
                return ""

    async def _stream_claude(self, prompt: str) -> AsyncIterator[str]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            async with client.messages.stream(
                model=self.model or settings.ANTHROPIC_MODEL_FAST,
                max_tokens=1200, system=self.system,
                messages=[{"role": "user", "content": prompt}],
            ) as s:
                async for text in s.text_stream:
                    yield text
        except Exception as exc:
            yield f"\n[Claude stream error: {exc}]"

    # ── OpenAI GPT ─────────────────────────────────────────────────────────────

    async def _openai(self, prompt: str) -> str:
        try:
            resp = await _openai_client().chat.completions.create(
                model=self.model or settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": self.system},
                    {"role": "user",   "content": prompt},
                ],
                max_tokens=1200, temperature=0.12,
            )
            return resp.choices[0].message.content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error: {exc}")
            return ""

    # ── Google Gemini ──────────────────────────────────────────────────────────

    async def _gemini(self, prompt: str) -> str:
        for model in list(dict.fromkeys([
            self.model or settings.GEMINI_MODEL,
            settings.GEMINI_MODEL_FAST,
        ])):
            try:
                resp = await _gemini_client().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Gemini {model}: {exc}")
        return ""

    # ── xAI Grok ──────────────────────────────────────────────────────────────

    async def _grok(self, prompt: str) -> str:
        for model in list(dict.fromkeys([
            self.model or settings.GROK_MODEL,
            settings.GROK_MODEL_FAST,
        ])):
            try:
                resp = await _grok_client().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Grok {model}: {exc}")
        return ""

    # ── Perplexity Sonar (live web) ────────────────────────────────────────────

    async def _perplexity(self, prompt: str) -> str:
        for model in list(dict.fromkeys([
            self.model or settings.PERPLEXITY_MODEL,
            settings.PERPLEXITY_MODEL_FAST,
        ])):
            try:
                resp = await _perplexity_client().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Perplexity {model}: {exc}")
        return ""

    # ── Ollama Local ───────────────────────────────────────────────────────────

    async def _ollama(self, prompt: str) -> str:
        models = list(dict.fromkeys([
            self.model if self.provider == "ollama" else settings.OLLAMA_MODEL,
            settings.OLLAMA_MODEL,
            settings.OLLAMA_MODEL_FALLBACK,
        ]))
        for model in models:
            if not model:
                continue
            try:
                async with httpx.AsyncClient(timeout=60.0) as c:
                    resp = await c.post(
                        f"{settings.OLLAMA_BASE_URL}/api/chat",
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": self.system},
                                {"role": "user",   "content": prompt},
                            ],
                            "stream": False,
                            "options": {"temperature": 0.12, "num_predict": 1200},
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json().get("message", {}).get("content", "").strip()
            except Exception as exc:
                logger.debug(f"Ollama {model}: {exc}")
        return ""

    async def _stream_ollama(self, prompt: str) -> AsyncIterator[str]:
        try:
            async with httpx.AsyncClient(timeout=120.0) as c:
                async with c.stream(
                    "POST", f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [
                            {"role": "system", "content": self.system},
                            {"role": "user",   "content": prompt},
                        ],
                        "stream": True,
                        "options": {"temperature": 0.12},
                    }
                ) as resp:
                    async for line in resp.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                chunk = data.get("message", {}).get("content", "")
                                if chunk:
                                    yield chunk
                                if data.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
        except Exception as exc:
            yield f"\n[Ollama unavailable: {exc}]"

    # ── Featherless (legacy) ───────────────────────────────────────────────────

    async def _featherless(self, prompt: str) -> str:
        for model in list(dict.fromkeys([
            self.model or settings.FEATHERLESS_MODEL,
            settings.FEATHERLESS_MODEL_FAST,
        ])):
            try:
                resp = await _featherless_client().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": self.system},
                        {"role": "user",   "content": prompt},
                    ],
                    max_tokens=1200, temperature=0.12,
                )
                return resp.choices[0].message.content.strip()
            except Exception as exc:
                logger.warning(f"Featherless {model}: {exc}")
        return ""

    @staticmethod
    def _offline_fallback() -> str:
        return (
            "ARGUS RULE ENGINE ACTIVE — AI synthesis temporarily unavailable. "
            "Pattern-based detection confirmed elevated risk signals. "
            "Configure an AI provider in .env to enable full intelligence synthesis."
        )


# ── Provider Status ────────────────────────────────────────────────────────────

async def get_provider_status() -> dict:
    status = {}

    # NVIDIA NIM — free showcase
    if settings.NVIDIA_API_KEY:
        try:
            await _nvidia_client().models.list()
            status["nvidia"] = {"available": True, "model": settings.NVIDIA_MODEL,
                                 "tier": "free", "note": "1,000 calls/month free"}
        except Exception:
            status["nvidia"] = {"available": False, "model": settings.NVIDIA_MODEL, "tier": "free"}
    else:
        status["nvidia"] = {"available": False, "tier": "free",
                            "get_key": "https://build.nvidia.com",
                            "note": "FREE — 1k calls/month on 49B model"}

    # Claude
    status["claude"] = {
        "available": bool(settings.ANTHROPIC_API_KEY),
        "model": settings.ANTHROPIC_MODEL, "tier": "paid",
        "get_key": "https://console.anthropic.com",
        "models": [settings.ANTHROPIC_MODEL, settings.ANTHROPIC_MODEL_FAST, settings.ANTHROPIC_MODEL_MINI]
    }

    # OpenAI
    status["openai"] = {
        "available": bool(settings.OPENAI_API_KEY),
        "model": settings.OPENAI_MODEL, "tier": "paid",
        "get_key": "https://platform.openai.com",
        "models": [settings.OPENAI_MODEL, settings.OPENAI_MODEL_REASONING, settings.OPENAI_MODEL_MINI]
    }

    # Gemini
    status["gemini"] = {
        "available": bool(settings.GEMINI_API_KEY),
        "model": settings.GEMINI_MODEL, "tier": "free+paid",
        "get_key": "https://aistudio.google.com/app/apikey",
        "note": "FREE tier available · 1M token context",
        "models": [settings.GEMINI_MODEL, settings.GEMINI_MODEL_FAST]
    }

    # Grok
    status["grok"] = {
        "available": bool(settings.XAI_API_KEY),
        "model": settings.GROK_MODEL, "tier": "paid",
        "get_key": "https://console.x.ai",
        "note": "Live internet access — real-time threat data",
        "models": [settings.GROK_MODEL, settings.GROK_MODEL_FAST]
    }

    # Perplexity
    status["perplexity"] = {
        "available": bool(settings.PERPLEXITY_API_KEY),
        "model": settings.PERPLEXITY_MODEL, "tier": "paid",
        "get_key": "https://www.perplexity.ai/settings/api",
        "note": "Live web search — best for real-time threat intel",
        "models": [settings.PERPLEXITY_MODEL, settings.PERPLEXITY_MODEL_FAST]
    }

    # Ollama local
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            models = [m["name"] for m in r.json().get("models", [])] if r.status_code == 200 else []
            status["ollama"] = {"available": r.status_code == 200, "models": models,
                                 "tier": "local/free", "install": "https://ollama.ai"}
    except Exception:
        status["ollama"] = {"available": False, "tier": "local/free",
                            "install": "https://ollama.ai", "setup": "ollama pull llama3.2"}

    return status


# ── Task-Optimized Factory Functions ──────────────────────────────────────────

def veil_router() -> AIRouter:
    """VEIL phishing — fast + security-specialized.
    Priority: NVIDIA → Claude Sonnet → GPT-4o → Gemini Flash → Grok Mini → Ollama"""
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_SEC_SYSTEM)
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL_FAST, system=_SEC_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, system=_SEC_SYSTEM)
    if settings.GEMINI_API_KEY:
        return AIRouter("gemini", settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL_FAST, system=_SEC_SYSTEM)
    if settings.XAI_API_KEY:
        return AIRouter("grok", settings.XAI_API_KEY, model=settings.GROK_MODEL_FAST, system=_SEC_SYSTEM)
    return AIRouter("ollama", "", system=_SEC_SYSTEM)


def oracle_router() -> AIRouter:
    """ORACLE attack chain — deepest available reasoning.
    Priority: Claude Opus → GPT o4-mini → Gemini Pro → Grok → NVIDIA → Ollama"""
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL, system=_ARGUS_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL_REASONING, system=_ARGUS_SYSTEM)
    if settings.GEMINI_API_KEY:
        return AIRouter("gemini", settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL, system=_ARGUS_SYSTEM)
    if settings.XAI_API_KEY:
        return AIRouter("grok", settings.XAI_API_KEY, model=settings.GROK_MODEL, system=_ARGUS_SYSTEM)
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_ARGUS_SYSTEM)
    return AIRouter("ollama", "", system=_ARGUS_SYSTEM)


def intel_router() -> AIRouter:
    """THREAT INTEL — live web access is critical here.
    Priority: Perplexity (live web) → Grok (live X/web) → Claude → GPT → NVIDIA → Ollama"""
    if settings.PERPLEXITY_API_KEY:
        return AIRouter("perplexity", settings.PERPLEXITY_API_KEY, model=settings.PERPLEXITY_MODEL, system=_INTEL_SYSTEM)
    if settings.XAI_API_KEY:
        return AIRouter("grok", settings.XAI_API_KEY, model=settings.GROK_MODEL, system=_INTEL_SYSTEM)
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL_FAST, system=_INTEL_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, system=_INTEL_SYSTEM)
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_INTEL_SYSTEM)
    return AIRouter("ollama", "", system=_INTEL_SYSTEM)


def breach_router() -> AIRouter:
    """BREACH-IQ commentary — deep analytical reasoning.
    Priority: Claude Opus → GPT-4o → Gemini Pro → Grok → NVIDIA → Ollama"""
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL, system=_ARGUS_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, system=_ARGUS_SYSTEM)
    if settings.GEMINI_API_KEY:
        return AIRouter("gemini", settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL, system=_ARGUS_SYSTEM)
    if settings.XAI_API_KEY:
        return AIRouter("grok", settings.XAI_API_KEY, model=settings.GROK_MODEL, system=_ARGUS_SYSTEM)
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_ARGUS_SYSTEM)
    return AIRouter("ollama", "", system=_ARGUS_SYSTEM)


def hunt_router() -> AIRouter:
    """HUNT analysis — fast, technical, pattern-matching.
    Priority: NVIDIA → Claude Sonnet → GPT-4o → Gemini Flash → Ollama"""
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_SEC_SYSTEM)
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL_FAST, system=_SEC_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, system=_SEC_SYSTEM)
    if settings.GEMINI_API_KEY:
        return AIRouter("gemini", settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL_FAST, system=_SEC_SYSTEM)
    return AIRouter("ollama", "", system=_SEC_SYSTEM)


def iem_router() -> AIRouter:
    """IEM statistical analysis — deepest reasoning needed.
    Priority: Claude Opus → GPT o4-mini → Gemini Pro → Grok → NVIDIA → Ollama"""
    if settings.ANTHROPIC_API_KEY:
        return AIRouter("anthropic", settings.ANTHROPIC_API_KEY, model=settings.ANTHROPIC_MODEL, system=_ARGUS_SYSTEM)
    if settings.OPENAI_API_KEY:
        return AIRouter("openai", settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL_REASONING, system=_ARGUS_SYSTEM)
    if settings.GEMINI_API_KEY:
        return AIRouter("gemini", settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL, system=_ARGUS_SYSTEM)
    if settings.XAI_API_KEY:
        return AIRouter("grok", settings.XAI_API_KEY, model=settings.GROK_MODEL, system=_ARGUS_SYSTEM)
    if settings.NVIDIA_API_KEY:
        return AIRouter("nvidia", settings.NVIDIA_API_KEY, model=settings.NVIDIA_MODEL, system=_ARGUS_SYSTEM)
    return AIRouter("ollama", "", system=_ARGUS_SYSTEM)


# ── Direct provider accessors ──────────────────────────────────────────────────

def nvidia_router()      -> AIRouter: return AIRouter("nvidia",     settings.NVIDIA_API_KEY,      model=settings.NVIDIA_MODEL,      system=_SEC_SYSTEM)
def claude_router()      -> AIRouter: return AIRouter("anthropic",  settings.ANTHROPIC_API_KEY,   model=settings.ANTHROPIC_MODEL,   system=_ARGUS_SYSTEM)
def gpt_router()         -> AIRouter: return AIRouter("openai",     settings.OPENAI_API_KEY,      model=settings.OPENAI_MODEL,      system=_ARGUS_SYSTEM)
def gemini_router()      -> AIRouter: return AIRouter("gemini",     settings.GEMINI_API_KEY,      model=settings.GEMINI_MODEL,      system=_ARGUS_SYSTEM)
def grok_router()        -> AIRouter: return AIRouter("grok",       settings.XAI_API_KEY,         model=settings.GROK_MODEL,        system=_ARGUS_SYSTEM)
def perplexity_router()  -> AIRouter: return AIRouter("perplexity", settings.PERPLEXITY_API_KEY,  model=settings.PERPLEXITY_MODEL,  system=_INTEL_SYSTEM)
def ollama_router(model: str = None) -> AIRouter: return AIRouter("ollama", "", model=model or settings.OLLAMA_MODEL, system=_SEC_SYSTEM)


def best_available_router() -> AIRouter:
    """Best available router based on configured keys.
    Priority: NVIDIA → Claude → OpenAI → Gemini → Grok → Perplexity → Ollama"""
    if settings.NVIDIA_API_KEY:      return nvidia_router()
    if settings.ANTHROPIC_API_KEY:   return claude_router()
    if settings.OPENAI_API_KEY:      return gpt_router()
    if settings.GEMINI_API_KEY:      return gemini_router()
    if settings.XAI_API_KEY:         return grok_router()
    if settings.PERPLEXITY_API_KEY:  return perplexity_router()
    return ollama_router()
