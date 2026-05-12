"""
ARGUS — Core Configuration
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "ARGUS — Autonomous Cyber Defense Intelligence Platform"
    APP_VERSION: str = "3.0.0"

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]

    AUTH0_DOMAIN: str = "your-domain.auth0.com"
    AUTH0_AUDIENCE: str = "https://argus-api"
    AUTH0_CLIENT_ID: str = "your-client-id"

    # ── Featherless (primary) ─────────────────────────────────────────────────
    FEATHERLESS_API_KEY: str = ""

    # Module-specific model routing
    FEATHERLESS_MODEL: str          = "Qwen/Qwen3.6-35B-A3B"              # VEIL — phishing analysis
    FEATHERLESS_MODEL_ORACLE: str   = "moonshotai/Kimi-K2.6"              # ORACLE — executive summaries
    FEATHERLESS_MODEL_SEC: str      = "fdtn-ai/Foundation-Sec-8B-Reasoning"  # security specialist
    FEATHERLESS_MODEL_FAST: str     = "zai-org/GLM-5.1"                   # fast / live responses
    FEATHERLESS_MODEL_FALLBACK: str = "meta-llama/Llama-3.1-8B-Instruct"  # last resort

    # ── NVIDIA NIM (high-quality secondary) ──────────────────────────────────
    NVIDIA_API_KEY: str   = ""
    NVIDIA_MODEL: str     = "nvidia/llama-3.3-nemotron-super-49b-v1"

    # ── Threat Intelligence APIs (free tier — optional) ──────────────────────
    ABUSEIPDB_API_KEY: str   = ""   # https://www.abuseipdb.com  — 1,000 checks/day free
    GREYNOISE_API_KEY: str   = ""   # https://www.greynoise.io   — Community free tier

    # ── Optional overrides ───────────────────────────────────────────────────
    OPENAI_API_KEY: str      = ""
    OPENAI_MODEL: str        = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str   = ""
    ANTHROPIC_MODEL: str     = "claude-3-haiku-20240307"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
