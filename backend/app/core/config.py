"""
ARGUS — Core Configuration v5.0
AI Provider Priority: NVIDIA → Ollama (local) → Claude → OpenAI → Featherless
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str    = "ARGUS — Palantir-Class Autonomous Cyber Defense Intelligence Platform"
    APP_VERSION: str = "6.0.0"

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ]

    # ── NVIDIA NIM (Primary — enterprise-grade) ───────────────────────────────
    # Get your free API key: https://build.nvidia.com
    # Free tier: 1,000 calls/month — enough for demo + hackathon
    NVIDIA_API_KEY: str   = ""
    NVIDIA_MODEL: str     = "nvidia/llama-3.3-nemotron-super-49b-v1"  # 49B params — elite
    NVIDIA_MODEL_FAST: str = "meta/llama-3.3-70b-instruct"            # 70B — fast fallback

    # ── Ollama Local (Free, Private, No Internet) ─────────────────────────────
    # Install: https://ollama.ai
    # Pull models: ollama pull llama3.2 && ollama pull mistral
    OLLAMA_BASE_URL: str      = "http://localhost:11434"
    OLLAMA_MODEL: str         = "llama3.2"       # ~2GB — great quality/speed
    OLLAMA_MODEL_FALLBACK: str = "mistral"        # alternative
    OLLAMA_MODEL_LARGE: str   = "llama3.1:8b"    # higher quality if available

    # ── Anthropic Claude (Reference Tier — state-of-the-art) ─────────────────
    # Get API key: https://console.anthropic.com
    # Claude Opus 4 excels at: attack chain reasoning, executive summaries,
    # complex threat correlation — the best AI for cybersecurity analysis
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str   = "claude-opus-4-5"   # Most capable — elite reasoning
    ANTHROPIC_MODEL_FAST: str = "claude-sonnet-4-5"  # Faster, still excellent

    # ── OpenAI GPT-4o (Reference Tier) ───────────────────────────────────────
    # Get API key: https://platform.openai.com
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str   = "gpt-4o"
    OPENAI_MODEL_MINI: str = "gpt-4o-mini"

    # ── Featherless (Legacy backup — multiple open-source models) ─────────────
    FEATHERLESS_API_KEY: str         = ""
    FEATHERLESS_MODEL: str           = "Qwen/Qwen3.6-35B-A3B"
    FEATHERLESS_MODEL_ORACLE: str    = "moonshotai/Kimi-K2.6"
    FEATHERLESS_MODEL_SEC: str       = "fdtn-ai/Foundation-Sec-8B-Reasoning"  # Security specialist
    FEATHERLESS_MODEL_FAST: str      = "meta-llama/Llama-3.1-8B-Instruct"
    FEATHERLESS_MODEL_FALLBACK: str  = "meta-llama/Llama-3.1-8B-Instruct"

    # ── Threat Intelligence APIs (all free tier) ──────────────────────────────
    ABUSEIPDB_API_KEY: str = ""   # https://www.abuseipdb.com  — 1,000 checks/day
    GREYNOISE_API_KEY: str = ""   # https://www.greynoise.io   — Community free tier
    NVD_API_KEY: str       = ""   # https://nvd.nist.gov/developers/request-an-api-key — 50 req/30s vs 5/30s
    SHODAN_API_KEY: str    = ""   # https://account.shodan.io  — Asset exposure scanning
    VIRUSTOTAL_API_KEY: str = ""  # https://www.virustotal.com/gui/join-us — File/URL/IP reputation
    HIBP_API_KEY: str      = ""   # https://haveibeenpwned.com/API/Key — Breach credential check

    # ── Auth (not required for local demo) ───────────────────────────────────
    AUTH0_DOMAIN: str    = "your-domain.auth0.com"
    AUTH0_AUDIENCE: str  = "https://argus-api"
    AUTH0_CLIENT_ID: str = "your-client-id"

    class Config:
        env_file         = ".env"
        env_file_encoding = "utf-8"
        extra            = "ignore"


settings = Settings()
